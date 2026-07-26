import type { AgentStatus } from "./agent";

let tuiInterval: ReturnType<typeof setInterval> | null = null;

export function clearTui() {
  if (tuiInterval) {
    clearInterval(tuiInterval);
    tuiInterval = null;
  }
  process.stdout.write("\u001b[?25h");
}

export function renderTui(getStatus: () => AgentStatus) {
  process.stdout.write("\u001b[?25l");
  process.stdout.write("\u001b[2J");
  process.stdout.write("\u001b[H");

  const draw = () => {
    const s = getStatus();
    const lines = [
      "",
      "  \u001b[1m\u001b[38;2;241;116;99mQuantNest Agent\u001b[0m  \u001b[90mv" +
        s.version +
        "\u001b[0m",
      "",
      "  " +
        (s.connected
          ? "\u001b[32m● Connected\u001b[0m"
          : "\u001b[31m○ Disconnected\u001b[0m") +
        "  \u001b[90m" +
        s.hostname +
        "\u001b[0m",
      "",
      "  \u001b[90mAgent ID:\u001b[0m   " +
        (s.agentId ? s.agentId.slice(0, 8) + "..." : "\u001b[33m-\u001b[0m"),
      "  \u001b[90mPlatform:\u001b[0m   " + s.os,
      "  \u001b[90mUptime:\u001b[0m     " + formatUptime(s.uptime),
      "  \u001b[90mOpenClaw:\u001b[0m   " +
        (s.openclawRunning
          ? "\u001b[32mRunning\u001b[0m"
          : "\u001b[33mNot detected\u001b[0m"),
      "",
      "  \u001b[90m[\u001b[0mPress \u001b[1mCtrl+C\u001b[0m to stop\u001b[90m]\u001b[0m",
      "",
    ];

    process.stdout.write("\u001b[H" + lines.join("\n"));
  };

  draw();
  tuiInterval = setInterval(draw, 1000);
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
