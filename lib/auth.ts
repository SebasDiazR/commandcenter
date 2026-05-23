export const ALLOWED_EMAIL_DOMAIN = "hksinc.com";

export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

export function getPrimaryEmailAddress(
  user:
    | {
        primaryEmailAddressId?: string | null;
        emailAddresses?: Array<{ id: string; emailAddress: string }>;
      }
    | null
    | undefined,
) {
  if (!user?.emailAddresses?.length) {
    return null;
  }

  return (
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null
  );
}
