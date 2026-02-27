import { SignUpForm } from "@/components/auth/sign-up-form";
import Link from "next/link";

export default function SignupPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <SignUpForm />
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
