"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github } from "lucide-react";
import { toast } from "sonner";

export function SignInForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await signIn.email({
                email,
                password,
                callbackURL: "/dashboard",
            });
            if (error) {
                toast.error(error.message || "Failed to sign in");
            } else {
                // Redirect to dashboard after successful sign in
                router.push("/dashboard");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGithubSignIn = async () => {
        try {
            await signIn.social({
                provider: "github",
                callbackURL: "/dashboard",
            });
        } catch {
            toast.error("Failed to sign in with GitHub");
        }
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs uppercase tracking-wide text-white/70 dark:text-black/70">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-10 border-white/20 dark:border-black/20 bg-white/10 dark:bg-black/10 shadow-sm text-white dark:text-black placeholder:text-white/50 dark:placeholder:text-black/50 focus-visible:border-white/40 dark:focus-visible:border-black/40 focus-visible:ring-2 focus-visible:ring-primary/35"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs uppercase tracking-wide text-white/70 dark:text-black/70">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="........"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-10 border-white/20 dark:border-black/20 bg-white/10 dark:bg-black/10 shadow-sm text-white dark:text-black placeholder:text-white/50 dark:placeholder:text-black/50 focus-visible:border-white/40 dark:focus-visible:border-black/40 focus-visible:ring-2 focus-visible:ring-primary/35"
        />
      </div>

      <Button type="submit" className="h-10 w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20 dark:border-black/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-white/5 dark:bg-black/5 px-2 text-white/70 dark:text-black/70">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full border-white/20 dark:border-black/20 bg-white/10 dark:bg-black/10 text-white dark:text-black hover:border-white/40 dark:hover:border-black/40 hover:bg-white/20 dark:hover:bg-black/20"
        onClick={handleGithubSignIn}
      >
        <Github className="mr-2 h-4 w-4" />
        GitHub
      </Button>
    </form>
  );
}
