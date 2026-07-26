import { execSync } from "node:child_process";
import { spinner } from "@clack/prompts";

const OPENCLAWS_BASE = "http://127.0.0.1:18789";

function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, {
      encoding: "utf-8",
      stdio: "pipe",
      shell: "bash",
    });
    return true;
  } catch {
    return false;
  }
}

export async function ensureOpenclaw(): Promise<boolean> {
  if (commandExists("openclaw")) {
    return true;
  }

  const s = spinner();
  s.start("OpenClaw not found. Installing...");

  try {
    execSync("npm install -g openclaw", {
      encoding: "utf-8",
      stdio: "pipe",
      shell: "bash",
    });
    s.stop("OpenClaw installed");
    return true;
  } catch (err) {
    s.stop(
      `Failed to install OpenClaw: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

export async function ensureOpenclawGateway(): Promise<boolean> {
  // check if already running
  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) return true;
  } catch {
    // not running
  }

  const s = spinner();
  s.start("Starting OpenClaw gateway...");

  try {
    execSync("openclaw start", {
      encoding: "utf-8",
      stdio: "pipe",
      shell: "bash",
      timeout: 10_000,
    });

    // wait for gateway to be ready
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      try {
        const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          s.stop("OpenClaw gateway is running");
          return true;
        }
      } catch {
        // still starting
      }
    }

    s.stop("OpenClaw gateway failed to start");
    return false;
  } catch (err) {
    s.stop(
      `Failed to start OpenClaw: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
