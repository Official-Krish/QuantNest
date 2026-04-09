import { useEffect, useMemo, useState } from "react";
import {
  SUPPORTED_INDIAN_MARKET_ASSETS,
  SUPPORTED_WEB3_ASSETS,
} from "@quantnest-trading/types";
import { apiGetMarketAssets } from "@/http";

type AssetState = {
  Indian: string[];
  Crypto: string[];
};

const fallbackAssets: AssetState = {
  Indian: [...SUPPORTED_INDIAN_MARKET_ASSETS],
  Crypto: [...SUPPORTED_WEB3_ASSETS],
};

let cachedAssets: AssetState | null = null;
let inflightRequest: Promise<AssetState> | null = null;

function hasSufficientCachedAssets(assets: AssetState): boolean {
  return assets.Indian.length >= 5 && assets.Crypto.length >= 8;
}

async function fetchAssetState(): Promise<AssetState> {
  if (cachedAssets && hasSufficientCachedAssets(cachedAssets)) {
    return cachedAssets;
  }

  if (!inflightRequest) {
    inflightRequest = (async () => {
      try {
        const data = await apiGetMarketAssets(undefined, { forceRefresh: true });
        const indian = Array.from(
          new Set((data.Indian || []).map((entry) => String(entry.symbol || "").trim().toUpperCase()).filter(Boolean)),
        );
        const crypto = Array.from(
          new Set((data.Crypto || []).map((entry) => String(entry.symbol || "").trim().toUpperCase()).filter(Boolean)),
        );

        cachedAssets = {
          Indian: indian.length ? indian : fallbackAssets.Indian,
          Crypto: crypto.length ? crypto : fallbackAssets.Crypto,
        };
        return cachedAssets;
      } catch {
        cachedAssets = fallbackAssets;
        return fallbackAssets;
      } finally {
        inflightRequest = null;
      }
    })();
  }

  return inflightRequest;
}

export function useMarketAssets() {
  const [assets, setAssets] = useState<AssetState>(cachedAssets || fallbackAssets);

  useEffect(() => {
    let mounted = true;

    void fetchAssetState().then((next) => {
      if (mounted) {
        setAssets(next);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(
    () => ({
      indianAssets: assets.Indian,
      cryptoAssets: assets.Crypto,
    }),
    [assets],
  );
}