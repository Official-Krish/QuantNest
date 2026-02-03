import { CandlestickApi, IsomorphicFetchHttpLibrary, ServerConfiguration } from "../generated";
const BASE_URL = "https://mainnet.zklighter.elliot.ai"
const SOL_MARKET_ID = 2

async function getKlines() {
    const klinesApi = new CandlestickApi({
        baseServer: new ServerConfiguration<{  }>(BASE_URL, {  }),
        httpApi: new IsomorphicFetchHttpLibrary(),
        middleware: [],
        authMethods: {}
    });

    const klines = await klinesApi.candlesticks(SOL_MARKET_ID, '1m', Date.now() - 1000 * 60 * 60 * 24, Date.now(), 100, false);
    console.log(klines);
}

getKlines();