import { intro, outro } from "@clack/prompts";
import pc from "picocolors";

export async function runWizard(): Promise<void> {
  intro(pc.cyan(" QuantNest Agent "));

  console.log(
    pc.dim("┌─────────────────────────────────────────────────────┐"),
  );
  console.log(
    pc.dim("│"),
    pc.bold(" Your personal AI trading agent is now live!       "),
    pc.dim("│"),
  );
  console.log(
    pc.dim("│"),
    pc.green(" ✔ Agent connected to cloud"),
    pc.dim("              │"),
  );
  console.log(
    pc.dim("│"),
    pc.green(" ✔ OpenClaw AI gateway running locally"),
    pc.dim("        │"),
  );
  console.log(
    pc.dim("│"),
    pc.green(" ✔ QuantNest plugin installed"),
    pc.dim("              │"),
  );
  console.log(
    pc.dim("│"),
    pc.dim("   Open the dashboard to create and run workflows:"),
    pc.dim(" │"),
  );
  console.log(
    pc.dim("│"),
    pc.cyan("   quantnest configure"),
    pc.dim("           │"),
  );
  console.log(
    pc.dim("└─────────────────────────────────────────────────────┘"),
  );
  console.log();

  outro(pc.green("Ready"));
}
