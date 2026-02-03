import { NonceManagerType } from "@n8n-trading/lighter-sdk-ts/nonce_manager";
import { SignerClient } from "@n8n-trading/lighter-sdk-ts/signer";
const MARKETS = {
    "BTC": {
        marketId: 1,
        "qtyDecimals": 100000
    }, 
    "ETH": {
        marketId: 0,
        "qtyDecimals": 100000
    },
    "SOL": {
        marketId: 2,
        "qtyDecimals": 1000
    }
}

const BASE_URL = "https://mainnet.zklighter.elliot.ai/";

export async function ExecuteLighter(asset: "BTC" | "ETH" | "SOL", amount: number, type: "long" | "short", apiKey: string, account_index: number, api_key_index: number) {
    try {
        const marketIndex = MARKETS[asset].marketId;
        const client = await SignerClient.create({
            url: BASE_URL,
            privateKey: apiKey,
            accountIndex: account_index,
            apiKeyIndex: api_key_index,
            nonceManagementType: NonceManagerType.OPTIMISTIC
        });

        const isAsk = type === "short";
        const baseAmount = Math.round(amount * MARKETS[asset].qtyDecimals);
        await client.createOrder({
            marketIndex,
            clientOrderIndex: 0,
            baseAmount,
            price: SignerClient.NIL_TRIGGER_PRICE,
            isAsk,
            orderType: SignerClient.ORDER_TYPE_MARKET,
            timeInForce: SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME,
            reduceOnly: 0,
            triggerPrice: SignerClient.NIL_TRIGGER_PRICE,
            orderExpiry: SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY
        })
    } catch (error) {
        console.error("Error executing Lighter trade:", error);
    }
}