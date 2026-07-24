import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createMockSupabaseClient,
  getMockTable,
  resolveTableQuery,
} from "../helpers/supabase-mock";
import { createTeacherSession } from "../helpers/session-factory";
import { SPEKIT } from "@/lib/spekit-targets";
import { ADMIN_STUDENTS_PAGE_SIZE } from "@/lib/pagination-server";

const FEATURE = "[MT-003]";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireTeacher: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAdminAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe(`${FEATURE} Student unlink vs admin hard delete`, () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exposes Spekit ids for unlink and admin students purge", () => {
    expect(SPEKIT.unlinkStudentAction).toBe("unlink-student-action");
    expect(SPEKIT.adminStudentsTable).toBe("admin-students-table");
    expect(SPEKIT.adminStudentPurgeAction).toBe("admin-student-purge-action");
    expect(ADMIN_STUDENTS_PAGE_SIZE).toBe(20);
  });

  it("deleteStudentLink removes scoped link and never deletes profiles", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const linksTable = getMockTable(mockClient, "student_teachers");
    const groupsTable = getMockTable(mockClient, "teacher_groups");
    const membersTable = getMockTable(mockClient, "teacher_group_members");
    const profilesTable = getMockTable(mockClient, "profiles");

    linksTable.maybeSingle.mockResolvedValue({
      data: { id: "link-1", student_id: "student-1" },
      error: null,
    });
    resolveTableQuery(groupsTable, {
      data: [{ id: "group-1" }],
      error: null,
    });
    resolveTableQuery(linksTable, { data: null, error: null });
    resolveTableQuery(membersTable, { data: null, error: null });

    const { deleteStudentLink } = await import("@/actions/teacher");
    const result = await deleteStudentLink("link-1");

    expect(result).toEqual({ ok: true });
    expect(linksTable.delete).toHaveBeenCalled();
    expect(linksTable.eq).toHaveBeenCalledWith(
      "teacher_id",
      "teacher-profile-001"
    );
    expect(membersTable.delete).toHaveBeenCalled();
    expect(profilesTable.delete).not.toHaveBeenCalled();
  });

  it("teacher deleteStudentLink source never hard-deletes profiles", () => {
    const source = readFileSync(
      join(process.cwd(), "src/actions/teacher.ts"),
      "utf8"
    );
    const fnStart = source.indexOf("export async function deleteStudentLink");
    expect(fnStart).toBeGreaterThan(-1);
    const nextExport = source.indexOf("\nexport async function", fnStart + 1);
    const body = source.slice(fnStart, nextExport === -1 ? undefined : nextExport);
    expect(body).not.toMatch(/\.from\(\s*["']profiles["']\s*\)[\s\S]*\.delete\(/);
    expect(body).toContain('from("student_teachers")');
  });

  it("hardDeleteStudent requires confirm true", async () => {
    const { hardDeleteStudent } = await import("@/lib/admin/students");
    const result = await hardDeleteStudent("admin-1", "student-1", {
      confirm: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/تأكيد/);
    }
  });

  it("hardDeleteStudent refuses non-STUDENT roles", async () => {
    const admin = await import("@/lib/supabase/admin");
    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const profilesTable = getMockTable(mockClient, "profiles");
    profilesTable.maybeSingle.mockResolvedValue({
      data: { id: "teacher-1", full_name: "مدرس", role: "TEACHER" },
      error: null,
    });

    const { hardDeleteStudent } = await import("@/lib/admin/students");
    const result = await hardDeleteStudent("admin-1", "teacher-1", {
      confirm: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/الطلاب فقط/);
    }
    expect(profilesTable.delete).not.toHaveBeenCalled();
  });

  it("hardDeleteStudent deletes STUDENT profile and audits", async () => {
    const admin = await import("@/lib/supabase/admin");
    const audit = await import("@/lib/admin/audit");
    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const profilesTable = getMockTable(mockClient, "profiles");
    const linksTable = getMockTable(mockClient, "student_teachers");

    profilesTable.maybeSingle.mockResolvedValue({
      data: { id: "student-1", full_name: "أحمد", role: "STUDENT" },
      error: null,
    });
    resolveTableQuery(linksTable, { data: null, error: null, count: 2 } as never);
    // head count path: select returns thenable with count
    linksTable.select.mockImplementation(() => {
      const chain = linksTable;
      return Object.assign(chain, {
        then(
          onFulfilled?: (v: unknown) => unknown,
          onRejected?: (e: unknown) => unknown
        ) {
          return Promise.resolve({ data: null, error: null, count: 2 }).then(
            onFulfilled,
            onRejected
          );
        },
      });
    });
    resolveTableQuery(profilesTable, { data: null, error: null });

    const { hardDeleteStudent } = await import("@/lib/admin/students");
    const result = await hardDeleteStudent("admin-1", "student-1", {
      confirm: true,
    });

    expect(result).toEqual({ ok: true });
    expect(profilesTable.delete).toHaveBeenCalled();
    expect(profilesTable.eq).toHaveBeenCalledWith("role", "STUDENT");
    expect(audit.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: "admin-1",
        action: "student.hard_delete",
        targetId: "student-1",
      })
    );
  });
});
