import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiSignin, apiSignup } from "@/http";
import { AVATAR_OPTIONS } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/ui/shine-border";
import { getSignupValidationErrors } from "@/lib/validation";
import { toast } from "sonner";

export function Auth({ mode }: { mode: "signin" | "signup" }) {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signupValidationErrors =
    mode === "signup"
      ? getSignupValidationErrors({ username, email, password })
      : [];

  async function onSubmit() {
    setError(null);

    if (mode === "signup" && signupValidationErrors.length > 0) {
      const firstError = signupValidationErrors[0];
      toast.warning("Invalid signup details", {
        description: firstError,
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await apiSignup({
          username,
          email,
          password,
          avatarUrl: selectedAvatar,
        });
        if ('status' in res && res.status === 409) {
          setError("Username already exists");
          toast.warning("Signup blocked", {
            description: "This username is already taken. Try another one.",
          });
          setLoading(false);
          return;
        }
        toast.success("Account created", {
          description: "Your QuantNest account is ready. Signing you in now.",
        });
      }
      await apiSignin({ username, password });
      toast.success(mode === "signin" ? "Signed in" : "Welcome to QuantNest", {
        description: "Redirecting you to the workflow builder.",
      });

      nav("/create/onboarding");
    } catch (e: any) {
      const message = e?.response?.data?.message ?? e?.message ?? "Request failed";
      setError(message);
      toast.error(mode === "signin" ? "Signin failed" : "Signup failed", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center bg-black px-6 pb-6 pt-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
        {/* Left Content Section */}
        <div className="flex-1 space-y-6 text-neutral-200 lg:self-center">
          <div className="space-y-4">
            <h1
              className="text-5xl font-bold bg-linear-to-r from-[#f17463] via-[#f4937d] to-[#fde1d6] bg-clip-text text-transparent"
            >
              {mode === "signin" ? "Welcome Back" : "Get Started"}
            </h1>
            <p className="text-xl text-neutral-400">
              {mode === "signin"
                ? "Sign in to continue building and managing your workflows"
                : "Create an account to start building powerful workflows"}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200">Personal Workflow Storage</h3>
                <p className="text-sm text-neutral-400">All your workflows are securely stored and accessible only to you</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-linear-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200">Lightning Fast</h3>
                <p className="text-sm text-neutral-400">Build and execute workflows with minimal latency</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-linear-to-r from-orange-500 to-purple-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200">Secure & Private</h3>
                <p className="text-sm text-neutral-400">Your data is encrypted and protected with industry-standard security</p>
              </div>
            </div>
          </div>

          {mode === "signup" && (
            <div className="pt-6 border-t border-gray-800">
              <p className="text-sm text-neutral-500">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          )}
        </div>

        {/* Right Auth Form Section */}
        <div className="w-full max-w-md lg:ml-auto">
          <Card className="relative overflow-hidden bg-[#171717] border border-gray-800">
            <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />

            <CardHeader className="pb-2">
              <CardTitle className="text-neutral-200">
                {mode === "signin" ? "Sign in" : "Create account"}
              </CardTitle>
              <CardDescription className="text-neutral-400">
                This is required because workflows are stored per user.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-2.5">
                {mode === "signup" && (
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-neutral-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      autoComplete="email"
                      className="h-10 text-neutral-200"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-neutral-200">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    autoComplete="username"
                    className="h-10 text-neutral-200"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-neutral-200">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="h-10 text-neutral-200"
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                  />
                  {mode === "signup" && (
                    <p className="text-[11px] text-neutral-500">
                      Use at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  )}
                </div>

                {mode === "signup" && (
                  <div className="grid gap-2">
                    <Label className="text-neutral-200">Select Avatar</Label>
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                          Avatar Library
                        </p>
                        <p className="text-xs text-neutral-500">
                          {AVATAR_OPTIONS.length} options
                        </p>
                      </div>
                      <div className="grid max-h-28 grid-cols-7 gap-1.5 overflow-y-auto pr-1">
                        {AVATAR_OPTIONS.map((avatar, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedAvatar(avatar)}
                            className={`relative h-9 w-9 overflow-hidden rounded-full border-2 transition-all ${
                              selectedAvatar === avatar
                                ? "border-[#f17463]"
                                : "border-transparent hover:border-neutral-500"
                            }`}
                          >
                            <img src={avatar} alt={`Avatar option ${idx + 1}`} className="h-full w-full rounded-full" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="text-sm text-red-600">{error}</div>}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2.5">
              <button
                className="w-full bg-white py-2 rounded-lg cursor-pointer text-neutral-800 font-normal disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform text-center"
                onClick={onSubmit}
                disabled={
                  loading ||
                  !username ||
                  !password ||
                  (mode === "signup" && (!email || signupValidationErrors.length > 0))
                }
              >
                {loading
                  ? "Working..."
                  : mode === "signin"
                  ? "Sign in"
                  : "Sign up"}
              </button>

              <div className="text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <button
                    className="underline text-neutral-200 cursor-pointer"
                    onClick={() => nav("/signup")}
                    type="button"
                  >
                    Need an account? Sign up
                  </button>
                ) : (
                  <button
                    className="hover:underline text-neutral-200 cursor-pointer"
                    onClick={() => nav("/signin")}
                    type="button"
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
