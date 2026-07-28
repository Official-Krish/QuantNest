import {
  select,
  text,
  password,
  spinner,
  log,
  isCancel,
  cancel,
} from "@clack/prompts";

const BROKERS = ["zerodha", "groww", "jupiter", "lighter"] as const;

type Broker = (typeof BROKERS)[number];

const BROKER_FIELDS: Record<
  Broker,
  Array<{ key: string; label: string; secret?: boolean }>
> = {
  zerodha: [
    { key: "apiKey", label: "Zerodha API Key" },
    { key: "accessToken", label: "Zerodha Access Token", secret: true },
  ],
  groww: [
    { key: "apiKey", label: "Groww API Key" },
    { key: "clientId", label: "Groww Client ID" },
    { key: "clientSecret", label: "Groww Client Secret", secret: true },
  ],
  jupiter: [
    { key: "rpcUrl", label: "Solana RPC URL" },
    { key: "walletPrivateKey", label: "Wallet Private Key", secret: true },
  ],
  lighter: [
    { key: "apiKey", label: "Lighter API Key" },
    { key: "secretKey", label: "Lighter Secret Key", secret: true },
  ],
};

export async function configure() {
  log.step("Configure Broker");

  const broker = (await select({
    message: "Select a broker to configure",
    options: BROKERS.map((b) => ({
      label: b.charAt(0).toUpperCase() + b.slice(1),
      value: b,
    })),
  })) as Broker | symbol;

  if (isCancel(broker)) {
    cancel("Configuration cancelled");
    process.exit(0);
  }

  const fields = BROKER_FIELDS[broker as Broker];
  if (!fields) return;

  log.message(`Enter your ${broker} credentials:`);
  const config: Record<string, string> = {};

  for (const field of fields) {
    const val = field.secret
      ? await password({
          message: field.label,
          validate: (v) =>
            v?.trim() ? undefined : `${field.label} is required`,
        })
      : await text({
          message: field.label,
          validate: (v) =>
            v?.trim() ? undefined : `${field.label} is required`,
        });

    if (isCancel(val)) {
      cancel("Configuration cancelled");
      process.exit(0);
    }
    config[field.key] = (val as string).trim();
  }

  const s = spinner();
  s.start(`Sending ${broker} config to OpenClaw...`);

  try {
    const res = await fetch(
      "http://127.0.0.1:18789/v1/plugins/quantnest/config",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [broker]: config }),
      },
    );

    if (res.ok) {
      s.stop(`${broker} configured successfully`);
      log.success(`Ready to use ${broker} tools`);
    } else {
      const body = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      s.stop(`Failed: ${body.message || res.statusText}`);
      process.exit(1);
    }
  } catch (err) {
    s.stop(
      `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    log.error(
      "Make sure OpenClaw gateway is running on http://127.0.0.1:18789",
    );
    process.exit(1);
  }
}
