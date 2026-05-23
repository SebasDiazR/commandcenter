import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import BDCommandCenter from "@/components/BDCommandCenter";
import ClerkSetupNotice from "@/components/ClerkSetupNotice";
import { getPrimaryEmailAddress, isAllowedEmail } from "@/lib/auth";

export default async function Home() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return <ClerkSetupNotice message="Add your Clerk keys first, then this site will require @hksinc.com sign-in." />;
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = getPrimaryEmailAddress(user);

  if (!isAllowedEmail(email)) {
    redirect("/unauthorized");
  }

  return <BDCommandCenter />;
}
