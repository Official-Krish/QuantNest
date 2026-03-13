import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiVerifyEmailToken } from "@/http";

const EMAIL_VERIFIED_FLAG = "quantnest-email-verified";

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const token = searchParams.get("token") || "";

    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await apiVerifyEmailToken(token);
        window.localStorage.setItem(EMAIL_VERIFIED_FLAG, "true");
        setStatus("success");
        setMessage(response.message);
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.response?.data?.message ?? "Verification failed.");
      }
    };

    void verify();
  }, [searchParams]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    setCountdown(10);

    const intervalId = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      window.close();
      window.setTimeout(() => {
        navigate("/signin", {
          replace: true,
          state: { verifiedEmail: true },
        });
      }, 150);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [navigate, status]);

  return (
    <div className="min-h-screen bg-black px-6 pb-10 pt-36 text-white md:px-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
          Email verification
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-neutral-50">
          {status === "loading" ? "Checking link" : status === "success" ? "Email verified" : "Verification failed"}
        </h1>
        <p className="text-sm text-neutral-400">{message}</p>
        {status === "success" ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 px-5 py-4 text-sm text-neutral-300">
            You can close this tab or it will automatically close in{" "}
            <span className="font-semibold text-[#f17463]">{countdown}</span>{" "}
            seconds.
          </div>
        ) : null}
      </div>
    </div>
  );
};
