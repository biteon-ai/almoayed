"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  defaultSession,
  sessionOptions,
  type SessionData,
} from "@/lib/session";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (session.profileId) {
    const supabase = createAdminClient();
    await supabase
      .from("profiles")
      .update({ last_session_id: null })
      .eq("id", session.profileId);
  }

  Object.assign(session, defaultSession);
  await session.save();
  redirect("/login");
}
