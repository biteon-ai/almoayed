import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { redirect } from "next/navigation";

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

export async function requireStudent(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.profileId) {
    redirect("/login");
  }
  return session;
}

export async function requireSubscribedStudent(): Promise<SessionData> {
  const session = await requireStudent();
  return session;
}
