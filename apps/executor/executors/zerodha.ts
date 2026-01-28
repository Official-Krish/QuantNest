import { KiteConnect } from "kiteconnect";

export async function executeZerodhaNode(asset: string, quantity: number, orderType: "buy" | "sell", apiKey: string, accessToken: string, exchange: string): Promise<String> {
    try {
        const kc = new KiteConnect({ api_key: apiKey });
        kc.setAccessToken(accessToken);
        if(!exchange.includes("NSE") && !exchange.includes("BSE")) {
            throw new Error(`Invalid exchange: ${exchange}`);
        }
        const exchangeTyped = exchange as "NSE" | "BSE";
        await kc.placeOrder("regular",{
            exchange: exchangeTyped,
            tradingsymbol: asset,
            transaction_type: orderType.toUpperCase() as "BUY" | "SELL",
            quantity: quantity,
            order_type: "MARKET",
            product: "MIS",
        })
        return "SUCCESS";
    } catch (error) {
        return "FAILURE";
    }
}