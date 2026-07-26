import { text, password, spinner, log, cancel, isCancel } from "@clack/prompts";
import { readCredentials, writeCredentials } from "./credentials";

const API_BASE = process.env.QUANTNEST_API_URL || "http://localhost:3000";

export async function login() {
  const existing = readCredentials();
  if (existing?.refreshToken) {
    const s = spinner();
    s.start("Checking stored session...");
    try {
      if (existing.accessToken) {
        const res = await fetch(`${API_BASE}/api/v1/user/agent-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            Authorization: `Bearer ${existing.accessToken}`,
          },
        });
        if (res.ok) {
          s.stop("Already logged in (session valid)");
          return;
        }
      }
    } catch {
      // ignore, proceed to login
    }
    s.stop("Session expired. Please log in again.");
  }

  log.step("QuantNest Login");

  const email = await text({
    message: "Email",
    placeholder: "you@example.com",
    validate: (v) => (v?.trim() ? undefined : "Email is required"),
  });
  if (isCancel(email)) {
    cancel("Login cancelled");
    process.exit(0);
  }

  const pass = await password({
    message: "Password",
    validate: (v) => (v?.trim() ? undefined : "Password is required"),
  });
  if (isCancel(pass)) {
    cancel("Login cancelled");
    process.exit(0);
  }

  const s = spinner();
  s.start("Signing in...");
  try {
    const res = await fetch(`${API_BASE}/api/v1/user/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        username: (email as string).trim(),
        password: (pass as string).trim(),
      }),
    });

    const body = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      s.stop(`Failed: ${body.message || res.statusText}`);
      process.exit(1);
    }

    const cookies = res.headers.getSetCookie?.() ?? [];
    const allCookies =
      cookies.length > 0 ? cookies : [res.headers.get("set-cookie") ?? ""];
    const cookieStr = allCookies.join("; ");
    const refreshMatch = cookieStr.match(/quantnest_refresh=([^;]+)/);
    const accessMatch = cookieStr.match(/quantnest_auth=([^;]+)/);
    const refreshToken = refreshMatch?.[1];
    const accessToken = accessMatch?.[1];

    if (!refreshToken || !accessToken) {
      s.stop("Missing auth tokens in response");
      process.exit(1);
    }

    writeCredentials({
      userId: String(body.userId || ""),
      accessToken,
      refreshToken,
      apiUrl: API_BASE,
      wsUrl: process.env.QUANTNEST_WS_URL || "ws://localhost:9000",
    });

    s.stop("Signed in successfully");
    log.success(`Welcome back, ${(email as string).trim()}!`);
  } catch (err) {
    s.stop(
      `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}
