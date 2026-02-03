import { AccountApi, ApiKeyAuthentication, IsomorphicFetchHttpLibrary, OrderApi, ServerConfiguration } from "../generated";
import { NonceManagerType } from "../nonce_manager";
import { SignerClient } from "../signer";

const BASE_URL = "https://mainnet.zklighter.elliot.ai"
const API_KEY_PRIVATE_KEY = process.env['API_KEY_PRIVATE_KEY']!
const ACCOUNT_INDEX = 283587
const API_KEY_INDEX = 2
const SOL_MARKET_ID = 2


export async function main() {
    const client = await SignerClient.create({
        url: BASE_URL,
        privateKey: API_KEY_PRIVATE_KEY,
        apiKeyIndex: API_KEY_INDEX,
        accountIndex: ACCOUNT_INDEX,
        nonceManagementType: NonceManagerType.OPTIMISTIC
    });

    // clientOrderIndex can be passed in as an argument when creating an order, see examples/createOrder.ts
    await client.cancelOrder({
        marketIndex: SOL_MARKET_ID,
        clientOrderIndex: 0,
    });
}

main()