function str(key: string, fallback?: string): string {
  const val = process.env[key];
  if (val !== undefined && val !== "") return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${key}`);
}

function int(key: string, fallback: number): number {
  const val = process.env[key];
  if (val !== undefined && val !== "") {
    const parsed = parseInt(val, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  REDIS: {
    HOST: str("REDIS_HOST", "redis"),
    PORT: int("REDIS_PORT", 6379),
  },

  AI: {
    PROVIDER: str("AI_MODEL_PROVIDER", "gemini"),
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? "",
    GOOGLE_MODEL: str("GOOGLE_GENAI_MODEL", "gemini-2.5-flash"),
  },

  NOTIFICATIONS: {
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  },

  SOLANA: {
    RPC_URL: str("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"),
    RPC_WS_URL:
      process.env.SOLANA_RPC_WS_URL ?? "wss://api.mainnet-beta.solana.com",
  },

  RATE_LIMITS: {
    ZERODHA: int("RATE_LIMIT_ZERODHA", 50),
    GROWW: int("RATE_LIMIT_GROWW", 60),
    LIGHTER: int("RATE_LIMIT_LIGHTER", 100),
    GEMINI: int("RATE_LIMIT_GEMINI", 60),
    DISCORD: int("RATE_LIMIT_DISCORD", 30),
    SLACK: int("RATE_LIMIT_SLACK", 30),
    TELEGRAM: int("RATE_LIMIT_TELEGRAM", 20),
    WHATSAPP: int("RATE_LIMIT_WHATSAPP", 20),
    GMAIL: int("RATE_LIMIT_GMAIL", 10),
    NOTION: int("RATE_LIMIT_NOTION", 30),
    GOOGLE_DRIVE: int("RATE_LIMIT_GOOGLE_DRIVE", 30),
    GOOGLE_SHEETS: int("RATE_LIMIT_GOOGLE_SHEETS", 30),
    POSTGRES: int("RATE_LIMIT_POSTGRES", 200),
    MARKET_DATA: int("RATE_LIMIT_MARKET_DATA", 100),
    SOLANA: int("RATE_LIMIT_SOLANA", 50),
  },
} as const;
