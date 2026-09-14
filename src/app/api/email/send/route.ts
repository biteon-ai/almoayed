import { NextResponse } from "next/server";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";
import {
  getResendFromEmail,
  getResendToEmail,
  isResendConfigured,
  sendEmail,
} from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MISSING_KEY_AR =
  "أضف مفتاح Resend الحقيقي بدل re_xxxxxxxxx في RESEND_API_KEY.";

type SendBody = {
  from?: string;
  to?: string | string[];
  subject?: string;
  html?: string;
};

export async function GET() {
  const session = await requireSuperAdminApi();
  return apiGuard(session, async () =>
    NextResponse.json({
      configured: isResendConfigured(),
      from: getResendFromEmail(),
      to: getResendToEmail(),
    })
  );
}

export async function POST(request: Request) {
  const session = await requireSuperAdminApi();
  return apiGuard(session, async () => {
    if (!isResendConfigured()) {
      return NextResponse.json({ error: MISSING_KEY_AR }, { status: 503 });
    }

    let body: SendBody = {};
    try {
      body = (await request.json()) as SendBody;
    } catch {
      body = {};
    }

    const result = await sendEmail({
      from: typeof body.from === "string" ? body.from : undefined,
      to: body.to,
      subject: typeof body.subject === "string" ? body.subject : undefined,
      html: typeof body.html === "string" ? body.html : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  });
}
