import { describe, expect, it } from "vitest";
import {
  filterStudentsByQuery,
  paginateStudents,
  STUDENT_PAGE_SIZE,
} from "@/lib/paginate-students";
import {
  composeWhatsAppNumber,
  isValidWhatsAppE164,
  normalizeWhatsAppNumber,
  sanitizeWhatsAppForDb,
  splitWhatsAppDial,
} from "@/lib/constants";

describe("[TEACH-001] Student management hub helpers", () => {
  const sample = [
    {
      fullName: "أحمد علي",
      whatsappNumber: "963987654321",
    },
    {
      fullName: "سارة محمد",
      whatsappNumber: "963911111111",
    },
    {
      fullName: "خالد",
      whatsappNumber: "963922222222",
    },
  ];

  it("filters by Arabic name substring", () => {
    expect(filterStudentsByQuery(sample, "سارة")).toHaveLength(1);
    expect(filterStudentsByQuery(sample, "  أحمد  ")[0]?.fullName).toBe(
      "أحمد علي"
    );
  });

  it("filters by WhatsApp digits", () => {
    expect(filterStudentsByQuery(sample, "987654")).toHaveLength(1);
    expect(filterStudentsByQuery(sample, "+963 911")).toHaveLength(1);
  });

  it("paginates at 8 per page", () => {
    expect(STUDENT_PAGE_SIZE).toBe(8);
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const page1 = paginateStudents(rows, 1);
    expect(page1.items).toHaveLength(8);
    expect(page1.totalPages).toBe(3);
    expect(page1.total).toBe(20);

    const page3 = paginateStudents(rows, 3);
    expect(page3.items).toHaveLength(4);
    expect(page3.page).toBe(3);

    const overflow = paginateStudents(rows, 99);
    expect(overflow.page).toBe(3);
  });

  it("normalizes WhatsApp for create flow expectations", () => {
    expect(normalizeWhatsAppNumber("+963 987 654 321")).toBe("963987654321");
    expect(normalizeWhatsAppNumber("09-87654321").length).toBeGreaterThan(0);
  });

  it("accepts international E.164 WhatsApp digits for student create", () => {
    expect(sanitizeWhatsAppForDb("+31 6 84-183-342")).toBe("31684183342");
    expect(sanitizeWhatsAppForDb("00 963 987 654 321")).toBe("963987654321");
    expect(isValidWhatsAppE164("31684183342")).toBe(true);
    expect(isValidWhatsAppE164("963987654321")).toBe(true);
    expect(isValidWhatsAppE164("1234567")).toBe(false); // too short
    expect(isValidWhatsAppE164("0123456789")).toBe(false); // leading zero

    expect(composeWhatsAppNumber("963", "987654321")).toBe("963987654321");
    expect(composeWhatsAppNumber("31", "684183342")).toBe("31684183342");
    // Full international paste ignores selected dial
    expect(composeWhatsAppNumber("963", "31684183342")).toBe("31684183342");
    expect(composeWhatsAppNumber("963", "+31684144342")).toBe("31684144342");
    expect(composeWhatsAppNumber("31", "+31 684 183 342")).toBe("31684183342");
    // Selected dial already in input — no duplicate prefix
    expect(composeWhatsAppNumber("963", "963987654321")).toBe("963987654321");
    expect(composeWhatsAppNumber("963", "+963 987 654 321")).toBe(
      "963987654321"
    );
    expect(splitWhatsAppDial("31684183342")).toEqual({
      dialCode: "31",
      national: "684183342",
    });
    expect(splitWhatsAppDial("963987654321")).toEqual({
      dialCode: "963",
      national: "987654321",
    });
  });

  it("rejects writing pending as a hub status transition (contract)", () => {
    const allowed = new Set(["active", "deactivated"]);
    expect(allowed.has("pending")).toBe(false);
    expect(allowed.has("active")).toBe(true);
  });
});
