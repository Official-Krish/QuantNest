import axios from "axios";
import { assetCompanyName, assetMapped } from "@n8n-trading/types";

export async function getCurrentPrice(asset: string): Promise<number> {
    const config = {
        method: 'get' as const,
        maxBodyLength: Infinity,
        url: `https://www.nseindia.com/api/NextApi/apiClient/GetQuoteApi?functionName=getSymbolData&marketType=N&series=EQ&symbol=${assetMapped[asset]}`,
        headers: { 
            'accept': '*/*', 
            'accept-language': 'en-GB,en;q=0.9', 
            'referer': `https://www.nseindia.com/get-quote/equity/${assetMapped[asset]}/${assetCompanyName[asset]}`, 
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', 
        }
    };

    try {
        const response = await axios(config);
        return response.data.equityResponse[0].orderBook.lastPrice;
    } catch (error) {
        console.error("Failed to fetch price for", asset, error);
        throw new Error(`Failed to fetch current price for ${asset}`);
    }
}
