export function getAccountId(session: {
  user?: { id?: string | null; email?: string | null };
}): string | null {
  const id = session.user?.id ?? session.user?.email;
  return id ?? null;
}
