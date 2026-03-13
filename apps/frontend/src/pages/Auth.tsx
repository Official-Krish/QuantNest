import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiResendVerificationEmail, apiSignin, apiSignup } from "@/http";
import { AVATAR_OPTIONS } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
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

const EMAIL_VERIFIED_FLAG = "quantnest-email-verified";

export function Auth({ mode }: { mode: "signin" | "signup" }) {
  const nav = useNavigate();
  const location = useLocation();
  const authLocationState = (location.state as {
    verificationEmail?: string;
    verifiedEmail?: boolean;
  } | null) || null;
  const verificationEmailFromState = authLocationState?.verificationEmail || "";
  const verifiedEmailFromState = authLocationState?.verifiedEmail === true;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupVerificationEmail, setSignupVerificationEmail] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>(
    verificationEmailFromState,
  );
  const signupValidationErrors =
    mode === "signup"
      ? getSignupValidationErrors({ username, email, password })
      : [];

  useEffect(() => {
    if (mode !== "signin") {
      return;
    }

    const emailVerifiedFlag = window.localStorage.getItem(EMAIL_VERIFIED_FLAG);
    if (emailVerifiedFlag) {
      window.localStorage.removeItem(EMAIL_VERIFIED_FLAG);
      setPendingVerificationEmail("");
      setError(null);
      toast.success("Email verified successfully", {
        description: "You can now sign in to your QuantNest workspace.",
      });
      nav(location.pathname, { replace: true, state: null });
      return;
    }

    if (verifiedEmailFromState) {
      setPendingVerificationEmail("");
      setError(null);
      toast.success("Email verified successfully", {
        description: "You can now sign in to your QuantNest workspace.",
      });
      nav(location.pathname, { replace: true, state: null });
      return;
    }

    setPendingVerificationEmail(verificationEmailFromState);
  }, [location.pathname, mode, nav, verificationEmailFromState, verifiedEmailFromState]);

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
          setError("Username or email already exists");
          toast.warning("Signup blocked", {
            description: "This username or email is already in use. Try another one.",
          });
          setLoading(false);
          return;
        }
        toast.success("Verify your email", {
          description: "We sent a verification link to your inbox. Verify first, then sign in.",
        });
        setSignupVerificationEmail("email" in res && res.email ? res.email : email);
        return;
      }
      await apiSignin({ username, password });
      setPendingVerificationEmail("");
      toast.success("Signed in", {
        description: "Redirecting you to the workflow builder.",
      });

      nav("/create/onboarding");
    } catch (e: any) {
      const message = e?.response?.data?.message ?? e?.message ?? "Request failed";
      const errorCode = e?.response?.data?.code;
      const unverifiedEmail = e?.response?.data?.email;
      if (errorCode === "EMAIL_NOT_VERIFIED") {
        setPendingVerificationEmail(unverifiedEmail || "");
      }
      setError(message);
      toast.error(mode === "signin" ? "Signin failed" : "Signup failed", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function onResendVerification() {
    if (!pendingVerificationEmail) return;
    try {
      await apiResendVerificationEmail(pendingVerificationEmail);
      toast.success("Verification email sent", {
        description: `We sent a fresh verification link to ${pendingVerificationEmail}.`,
      });
    } catch (e: any) {
      toast.error("Resend failed", {
        description: e?.response?.data?.message ?? "Could not resend verification email.",
      });
    }
  }

  async function onResendSignupVerification() {
    if (!signupVerificationEmail) return;
    try {
      await apiResendVerificationEmail(signupVerificationEmail);
      toast.success("Verification email sent", {
        description: `We sent a fresh verification link to ${signupVerificationEmail}.`,
      });
    } catch (e: any) {
      toast.error("Resend failed", {
        description: e?.response?.data?.message ?? "Could not resend verification email.",
      });
    }
  }

  if (mode === "signup" && signupVerificationEmail) {
    return (
      <div className="flex min-h-screen items-center bg-black px-6 pb-6 pt-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6 text-neutral-200 lg:self-center">
            <div className="space-y-4">
              <h1 className="bg-linear-to-r from-[#f17463] via-[#f4937d] to-[#fde1d6] bg-clip-text text-5xl font-bold text-transparent">
                Verify your email
              </h1>
              <p className="text-xl text-neutral-400">
                Your account is created. Confirm your inbox before signing in to QuantNest.
              </p>
            </div>
          </div>

          <div className="w-full max-w-md lg:ml-auto">
            <Card className="relative overflow-hidden border border-gray-800 bg-[#171717]">
              <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
              <CardHeader className="pb-2">
                <CardTitle className="text-neutral-200">Check your inbox</CardTitle>
                <CardDescription className="text-neutral-400">
                  We sent a verification link to <span className="font-medium text-neutral-200">{signupVerificationEmail}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-400">
                <p>Open the email and confirm your account to activate sign in.</p>
                <p>If you do not see it, check spam or promotions.</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2.5">
                <button
                  type="button"
                  className="w-full rounded-lg bg-white py-2 text-center font-normal text-neutral-800 transition-transform hover:scale-105 cursor-pointer"
                  onClick={() =>
                    nav("/signin", {
                      state: { verificationEmail: signupVerificationEmail },
                    })
                  }
                >
                  Go to sign in
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border border-neutral-700 py-2 text-center font-normal text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-900 cursor-pointer"
                  onClick={() => void onResendSignupVerification()}
                >
                  Resend verification email
                </button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
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
                {mode === "signin"
                  ? "Sign in to access your workflow workspace."
                  : "Create your account and verify your email to continue."}
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="h-10 pr-11 text-neutral-200"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-300"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                {mode === "signin" && pendingVerificationEmail && (
                  <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <p className="font-medium text-amber-300">Email verification pending</p>
                    <p className="mt-1">
                      {pendingVerificationEmail}
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-left font-medium text-[#f17463] hover:underline"
                      onClick={() => void onResendVerification()}
                    >
                      Resend verification email
                    </button>
                  </div>
                )}
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
