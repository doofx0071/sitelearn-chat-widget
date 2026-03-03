"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SignUpForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            const { error } = await signUp.email({
                email,
                password,
                name,
                callbackURL: "/dashboard",
            });
            if (error) {
                toast.error(error.message || "Failed to sign up");
            } else {
                toast.success("Account created successfully!");
                // Redirect to dashboard after successful sign up
                router.push("/dashboard");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs uppercase tracking-wide text-white/70 dark:text-black/70">
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-10 border-white/20 dark:border-black/20 bg-white/10 dark:bg-black/10 shadow-sm text-white dark:text-black placeholder:text-white/50 dark:placeholder:text-black/50 focus-visible:border-white/40 dark:focus-visible:border-black/40 focus-visible:ring-2 focus-visible:ring-primary/35"
        />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wide text-white/70 dark:text-black/70">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="........"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="h-10 border-white/20 dark:border-black/20 bg-white/10 dark:bg-black/10 shadow-sm text-white dark:text-black placeholder:text-white/50 dark:placeholder:text-black/50 focus-visible:border-white/40 dark:focus-visible:border-black/40 focus-visible:ring-2 focus-visible:ring-primary/35"
        />
      </div>

      <Button type="submit" className="h-10 w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
