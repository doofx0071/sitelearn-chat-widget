import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignupPage() {
  return (
    <AuthSplitLayout
      variant="signup"
      title="Create Account"
      subtitle="Start building your chatbot widget in minutes"
      footerQuestion="Already have an account?"
      footerLinkLabel="Log in"
      footerHref="/login"
    >
      <SignUpForm />
    </AuthSplitLayout>
  );
}
