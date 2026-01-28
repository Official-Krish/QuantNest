import axios from "axios";

export async function executeGrowwNode(symbol: string, quantity: number, type: string, exchange: string, accessToken: string): Promise<String> {
    try {
        const orderPayload = {
            trading_symbol: symbol,
            quantity: quantity,
            validity: "DAY",
            exchange: exchange,
            segment: "CASH",
            product: "CNC",
            order_type: "SL",
            transaction_type: type,
        };

        const res = await axios.post("https://api.groww.in/v1/order/create", orderPayload,{
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
                "X-API-VERSION": "1.0",
            },
        })
        if (res.status === 200) {
            return "SUCCESS";
        } else {
            return "FAILURE";
        }
    } catch (error) {
        return "FAILURE";
    }
}