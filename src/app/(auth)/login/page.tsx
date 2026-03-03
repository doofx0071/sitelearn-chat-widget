import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function LoginPage() {
  return (
    <AuthSplitLayout
      variant="login"
      title="Sign In"
      subtitle="Continue to your SiteLearn dashboard"
      footerQuestion="Don&apos;t have an account?"
      footerLinkLabel="Sign up"
      footerHref="/signup"
    >
      <SignInForm />
    </AuthSplitLayout>
  );
}
