import "./polyfill";
import {
  intro,
  outro,
  select,
  spinner,
  log,
  isCancel,
  cancel,
} from "@clack/prompts";
import color from "picocolors";
import {
  readCredentials,
  clearCredentials,
  clearAllWorkflowCreds,
  isFirstRun,
  markFirstRunComplete,
} from "./credentials";
import { login } from "./login";
import { configure } from "./configure";
import { startAgent, stopAgent } from "./agent";
import {
  ensureOpenclaw,
  ensureOpenclawGateway,
  ensureQuantnestPlugin,
  uninstallEverything,
} from "./install";
import { runWizard } from "./wizard";
import { queryAudit, clearAudit } from "./audit";

async function main() {
  const cmd = process.argv[2];

  if (!cmd || cmd === "start") {
    const creds = readCredentials();
    if (!creds) {
      intro(color.bold(color.red("QuantNest Agent")));
      log.info("Welcome! Let's get you connected.");
      await login();
    }
    outro("Setting up OpenClaw...");
    const installed = await ensureOpenclaw();
    if (!installed) {
      log.error(
        "OpenClaw is required. Install it manually: npm install -g openclaw",
      );
      process.exit(1);
    }
    const gatewayReady = await ensureOpenclawGateway();
    if (!gatewayReady) {
      log.error(
        "Failed to start OpenClaw gateway. Start it manually: openclaw start",
      );
      process.exit(1);
    }
    const pluginInstalled = await ensureQuantnestPlugin();
    if (!pluginInstalled) {
      log.warn(
        "QuantNest plugin not installed. Broker tools will be unavailable.",
      );
    }
    outro("Starting agent...");
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await startAgent(async () => {
          if (isFirstRun()) {
            await runWizard();
            markFirstRunComplete();
          }
        });
        return;
      } catch (err) {
        if (
          attempt === 0 &&
          err instanceof Error &&
          err.message.includes("Session expired")
        ) {
          log.info("Session expired. Let's log in again.");
          await login();
          outro("Restarting agent...");
          continue;
        }
        throw err;
      }
    }
    return;
  }

  switch (cmd) {
    case "login":
      await login();
      break;

    case "configure":
      log.info("Ensuring OpenClaw is running...");
      await ensureOpenclaw();
      await ensureOpenclawGateway();
      await configure();
      break;

    case "status": {
      const creds = readCredentials();
      if (!creds) {
        intro(color.bold(color.red("QuantNest Agent")));
        log.info(
          "Not logged in. Run " + color.cyan("quantnest login") + " first.",
        );
        outro();
        return;
      }
      intro(color.bold(color.red("QuantNest Agent")));
      log.info("Logged in");
      log.info("  User: " + creds.userId);
      log.info("  API:  " + creds.apiUrl);
      log.info("  WS:   " + creds.wsUrl);
      outro();
      break;
    }

    case "disconnect":
      stopAgent();
      log.success("Disconnected");
      break;

    case "log": {
      const args = process.argv.slice(3);
      if (args.includes("--clear")) {
        clearAudit();
        log.success("Audit log cleared");
        return;
      }
      const typeFilter = args.find((a) => !a.startsWith("-"));
      const entries = queryAudit({
        tail: true,
        limit: 50,
        type: typeFilter,
      });
      if (entries.length === 0) {
        log.info("No audit entries found");
        return;
      }
      console.log("");
      for (const e of entries) {
        const ts = e.timestamp.slice(0, 19).replace("T", " ");
        const icon =
          e.type === "EXECUTE_AI"
            ? color.cyan("▶")
            : e.type === "VERIFY_CREDENTIALS"
              ? color.yellow("🔑")
              : e.type === "AGENT_CONNECT"
                ? color.green("↑")
                : e.type === "AGENT_DISCONNECT"
                  ? color.red("↓")
                  : color.dim("•");
        const tag = e.type.padEnd(20);
        const st =
          e.status === "success"
            ? color.green("✔")
            : e.status === "error"
              ? color.red("✘")
              : color.dim("–");
        console.log(
          `  ${icon} ${color.dim(ts)} ${tag} ${st}` +
            (e.workflowId ? ` ${color.dim(e.workflowId)}` : "") +
            (e.error ? ` ${color.red(e.error.slice(0, 80))}` : ""),
        );
      }
      console.log(
        color.dim(
          `\n  ${entries.length} entries. Use --clear to purge. Filter by type: quantnest log EXECUTE_AI`,
        ),
      );
      break;
    }

    case "uninstall":
      stopAgent();
      await uninstallEverything();
      log.success("QuantNest Agent fully uninstalled");
      break;

    case "logout":
      clearCredentials();
      clearAllWorkflowCreds();
      log.success("Logged out — credentials and all workflow data cleared");
      break;

    case "--help":
    case "-h":
      console.log("");
      console.log(color.bold(color.red("QuantNest Agent")));
      console.log("");
      console.log(
        "  " + color.dim("Usage:") + " quantnest " + color.cyan("<command>"),
      );
      console.log("");
      console.log("  " + color.dim("Commands:"));
      console.log(
        "    " + color.cyan("start") + "      Launch agent dashboard (default)",
      );
      console.log("    " + color.cyan("login") + "      Sign in to QuantNest");
      console.log(
        "    " + color.cyan("configure") + "  Set up broker credentials",
      );
      console.log(
        "    " + color.cyan("status") + "     Show current login state",
      );
      console.log(
        "    " +
          color.cyan("log") +
          "        Show audit trail (--clear to purge)",
      );
      console.log(
        "    " + color.cyan("logout") + "     Clear all stored credentials",
      );
      console.log(
        "    " +
          color.cyan("uninstall") +
          "  Remove everything — agent, OpenClaw, config",
      );
      console.log("    " + color.cyan("--help") + "     Show this help");
      console.log("");
      break;

    default:
      console.error(color.red("Unknown command: ") + cmd);
      console.error("Run " + color.cyan("quantnest --help") + " for usage.");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
