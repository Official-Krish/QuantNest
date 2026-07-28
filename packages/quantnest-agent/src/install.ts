import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rmSync } from "node:fs";
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { spinner } from "@clack/prompts";

const CONFIG_DIR = `${process.env.HOME || "/tmp"}/.quantnest`;

const OPENCLAWS_BASE = "http://127.0.0.1:18789";

const DEFAULT_PLUGIN_URL =
  "https://cdn.krishlabs.tech/quantnest/plugins/v0.1.0/quantnest-openclaw-plugin-0.1.0.tgz";

const LOCAL_PATHS = [
  resolve(process.cwd(), "..", "..", "plugins", "openclaw-quantnest"),
  resolve(process.cwd(), "..", "plugins", "openclaw-quantnest"),
  resolve(process.cwd(), "plugins", "openclaw-quantnest"),
];

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

function findLocalPlugin(): string | null {
  for (const p of LOCAL_PATHS) {
    if (existsSync(resolve(p, "openclaw.plugin.json"))) return p;
  }
  return null;
}

export async function ensureOpenclaw(): Promise<boolean> {
  if (commandExists("openclaw")) return true;

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
  try {
    const res = await fetch(`${OPENCLAWS_BASE}/v1/models`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) return true;
  } catch {
    /* not running */
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
        /* still starting */
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

export async function ensureQuantnestPlugin(): Promise<boolean> {
  const s = spinner();

  // Try local path first (development / monorepo)
  const local = findLocalPlugin();
  if (local) {
    s.start("Installing QuantNest plugin (local)...");
    try {
      execSync(`openclaw plugins install "${local}" --force`, {
        encoding: "utf-8",
        stdio: "pipe",
        shell: "bash",
        timeout: 30_000,
      });
      s.stop("QuantNest plugin installed");
      return true;
    } catch (err) {
      s.stop(
        `Local plugin install failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  // Download plugin from S3/CDN
  const pluginUrl = process.env.QUANTNEST_PLUGIN_URL ?? DEFAULT_PLUGIN_URL;
  s.start("Downloading QuantNest plugin...");

  try {
    const res = await fetch(pluginUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);

    const tmpFile = `/tmp/quantnest-plugin-${Date.now()}.tgz`;
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(tmpFile, buffer);

    s.message("Installing QuantNest plugin...");

    execSync(`openclaw plugins install npm-pack:${tmpFile} --force`, {
      encoding: "utf-8",
      stdio: "pipe",
      shell: "bash",
      timeout: 60_000,
    });

    await fs.unlink(tmpFile).catch(() => {});
    s.stop("QuantNest plugin installed");
    return true;
  } catch (err) {
    s.stop(
      `Failed to install plugin: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

export async function uninstallEverything(): Promise<void> {
  const s = spinner();

  s.start("Stopping OpenClaw gateway...");
  try {
    execSync("openclaw stop", {
      encoding: "utf-8",
      stdio: "pipe",
      shell: "bash",
      timeout: 10_000,
    });
  } catch {
    /* ignore */
  }
  s.stop("OpenClaw gateway stopped");

  s.start("Removing QuantNest plugin...");
  try {
    execSync("openclaw plugins remove @quantnest/quantnest-openclaw-plugin", {
      encoding: "utf-8",
      stdio: "pipe",
      shell: "bash",
      timeout: 15_000,
    });
  } catch {
    /* ignore */
  }
  s.stop("QuantNest plugin removed");

  s.start("Uninstalling OpenClaw...");
  try {
    execSync("npm uninstall -g openclaw", {
      encoding: "utf-8",
      stdio: "pipe",
      shell: "bash",
      timeout: 30_000,
    });
  } catch {
    /* ignore */
  }
  s.stop("OpenClaw uninstalled");

  s.start("Removing QuantNest config...");
  rmSync(CONFIG_DIR, { recursive: true, force: true });
  s.stop("Config directory removed");

  s.start("Cleaning cache...");
  try {
    rmSync(`${process.env.HOME || "/tmp"}/Library/Caches/quantnest`, {
      recursive: true,
      force: true,
    });
  } catch {
    /* ignore */
  }
  s.stop("Cache cleaned");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
