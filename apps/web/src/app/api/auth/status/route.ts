import { NextResponse } from "next/server";
import { getMissingAuthEnv, isGoogleAuthConfigured } from "@/lib/auth-config";

export async function GET() {
  const missing = getMissingAuthEnv();
  return NextResponse.json({
    configured: isGoogleAuthConfigured(),
    missing,
  });
}
