import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions, mergeConfiguration } from '../configuration'
import type { Middleware } from '../middleware';
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
import { Account } from '../models/Account';
import { AccountApiKeys } from '../models/AccountApiKeys';
import { AccountLimits } from '../models/AccountLimits';
import { AccountMarginStats } from '../models/AccountMarginStats';
import { AccountMarketStats } from '../models/AccountMarketStats';
import { AccountMetadata } from '../models/AccountMetadata';
import { AccountMetadatas } from '../models/AccountMetadatas';
import { AccountPnL } from '../models/AccountPnL';
import { AccountPosition } from '../models/AccountPosition';
import { AccountStats } from '../models/AccountStats';
import { AccountTradeStats } from '../models/AccountTradeStats';
import { Announcement } from '../models/Announcement';
import { Announcements } from '../models/Announcements';
import { ApiKey } from '../models/ApiKey';
import { Block } from '../models/Block';
import { Blocks } from '../models/Blocks';
import { BridgeSupportedNetwork } from '../models/BridgeSupportedNetwork';
import { Candlestick } from '../models/Candlestick';
import { Candlesticks } from '../models/Candlesticks';
import { ContractAddress } from '../models/ContractAddress';
import { CurrentHeight } from '../models/CurrentHeight';
import { Cursor } from '../models/Cursor';
import { DailyReturn } from '../models/DailyReturn';
import { DepositHistory } from '../models/DepositHistory';
import { DepositHistoryItem } from '../models/DepositHistoryItem';
import { DetailedAccount } from '../models/DetailedAccount';
import { DetailedAccounts } from '../models/DetailedAccounts';
import { DetailedCandlestick } from '../models/DetailedCandlestick';
import { EnrichedTx } from '../models/EnrichedTx';
import { ExchangeStats } from '../models/ExchangeStats';
import { ExportData } from '../models/ExportData';
import { Funding } from '../models/Funding';
import { FundingRate } from '../models/FundingRate';
import { FundingRates } from '../models/FundingRates';
import { Fundings } from '../models/Fundings';
import { L1Metadata } from '../models/L1Metadata';
import { L1ProviderInfo } from '../models/L1ProviderInfo';
import { LiqTrade } from '../models/LiqTrade';
import { Liquidation } from '../models/Liquidation';
import { LiquidationInfo } from '../models/LiquidationInfo';
import { LiquidationInfos } from '../models/LiquidationInfos';
import { MarketInfo } from '../models/MarketInfo';
import { NextNonce } from '../models/NextNonce';
import { Order } from '../models/Order';
import { OrderBook } from '../models/OrderBook';
import { OrderBookDepth } from '../models/OrderBookDepth';
import { OrderBookDetail } from '../models/OrderBookDetail';
import { OrderBookDetails } from '../models/OrderBookDetails';
import { OrderBookOrders } from '../models/OrderBookOrders';
import { OrderBookStats } from '../models/OrderBookStats';
import { OrderBooks } from '../models/OrderBooks';
import { Orders } from '../models/Orders';
import { PnLEntry } from '../models/PnLEntry';
import { PositionFunding } from '../models/PositionFunding';
import { PositionFundings } from '../models/PositionFundings';
import { PriceLevel } from '../models/PriceLevel';
import { PublicPool } from '../models/PublicPool';
import { PublicPoolInfo } from '../models/PublicPoolInfo';
import { PublicPoolMetadata } from '../models/PublicPoolMetadata';
import { PublicPoolShare } from '../models/PublicPoolShare';
import { PublicPools } from '../models/PublicPools';
import { ReferralPointEntry } from '../models/ReferralPointEntry';
import { ReferralPoints } from '../models/ReferralPoints';
import { ReqExportData } from '../models/ReqExportData';
import { ReqGetAccount } from '../models/ReqGetAccount';
import { ReqGetAccountActiveOrders } from '../models/ReqGetAccountActiveOrders';
import { ReqGetAccountApiKeys } from '../models/ReqGetAccountApiKeys';
import { ReqGetAccountByL1Address } from '../models/ReqGetAccountByL1Address';
import { ReqGetAccountInactiveOrders } from '../models/ReqGetAccountInactiveOrders';
import { ReqGetAccountLimits } from '../models/ReqGetAccountLimits';
import { ReqGetAccountMetadata } from '../models/ReqGetAccountMetadata';
import { ReqGetAccountPnL } from '../models/ReqGetAccountPnL';
import { ReqGetAccountTxs } from '../models/ReqGetAccountTxs';
import { ReqGetBlock } from '../models/ReqGetBlock';
import { ReqGetBlockTxs } from '../models/ReqGetBlockTxs';
import { ReqGetByAccount } from '../models/ReqGetByAccount';
import { ReqGetCandlesticks } from '../models/ReqGetCandlesticks';
import { ReqGetDepositHistory } from '../models/ReqGetDepositHistory';
import { ReqGetFastWithdrawInfo } from '../models/ReqGetFastWithdrawInfo';
import { ReqGetFundings } from '../models/ReqGetFundings';
import { ReqGetL1Metadata } from '../models/ReqGetL1Metadata';
import { ReqGetL1Tx } from '../models/ReqGetL1Tx';
import { ReqGetLatestDeposit } from '../models/ReqGetLatestDeposit';
import { ReqGetLiquidationInfos } from '../models/ReqGetLiquidationInfos';
import { ReqGetNextNonce } from '../models/ReqGetNextNonce';
import { ReqGetOrderBookDetails } from '../models/ReqGetOrderBookDetails';
import { ReqGetOrderBookOrders } from '../models/ReqGetOrderBookOrders';
import { ReqGetOrderBooks } from '../models/ReqGetOrderBooks';
import { ReqGetPositionFunding } from '../models/ReqGetPositionFunding';
import { ReqGetPublicPools } from '../models/ReqGetPublicPools';
import { ReqGetPublicPoolsMetadata } from '../models/ReqGetPublicPoolsMetadata';
import { ReqGetRangeWithCursor } from '../models/ReqGetRangeWithCursor';
import { ReqGetRangeWithIndex } from '../models/ReqGetRangeWithIndex';
import { ReqGetRangeWithIndexSortable } from '../models/ReqGetRangeWithIndexSortable';
import { ReqGetRecentTrades } from '../models/ReqGetRecentTrades';
import { ReqGetReferralPoints } from '../models/ReqGetReferralPoints';
import { ReqGetTrades } from '../models/ReqGetTrades';
import { ReqGetTransferFeeInfo } from '../models/ReqGetTransferFeeInfo';
import { ReqGetTransferHistory } from '../models/ReqGetTransferHistory';
import { ReqGetTx } from '../models/ReqGetTx';
import { ReqGetWithdrawHistory } from '../models/ReqGetWithdrawHistory';
import { RespChangeAccountTier } from '../models/RespChangeAccountTier';
import { RespGetFastBridgeInfo } from '../models/RespGetFastBridgeInfo';
import { RespPublicPoolsMetadata } from '../models/RespPublicPoolsMetadata';
import { RespSendTx } from '../models/RespSendTx';
import { RespSendTxBatch } from '../models/RespSendTxBatch';
import { RespWithdrawalDelay } from '../models/RespWithdrawalDelay';
import { ResultCode } from '../models/ResultCode';
import { RiskInfo } from '../models/RiskInfo';
import { RiskParameters } from '../models/RiskParameters';
import { SharePrice } from '../models/SharePrice';
import { SimpleOrder } from '../models/SimpleOrder';
import { Status } from '../models/Status';
import { SubAccounts } from '../models/SubAccounts';
import { Ticker } from '../models/Ticker';
import { Trade } from '../models/Trade';
import { Trades } from '../models/Trades';
import { TransferFeeInfo } from '../models/TransferFeeInfo';
import { TransferHistory } from '../models/TransferHistory';
import { TransferHistoryItem } from '../models/TransferHistoryItem';
import { Tx } from '../models/Tx';
import { TxHash } from '../models/TxHash';
import { TxHashes } from '../models/TxHashes';
import { Txs } from '../models/Txs';
import { ValidatorInfo } from '../models/ValidatorInfo';
import { WithdrawHistory } from '../models/WithdrawHistory';
import { WithdrawHistoryItem } from '../models/WithdrawHistoryItem';
import { ZkLighterInfo } from '../models/ZkLighterInfo';

import { AccountApiRequestFactory, AccountApiResponseProcessor} from "../apis/AccountApi";
export class ObservableAccountApi {
    private requestFactory: AccountApiRequestFactory;
    private responseProcessor: AccountApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: AccountApiRequestFactory,
        responseProcessor?: AccountApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new AccountApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new AccountApiResponseProcessor();
    }

    /**
     * Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.
     * account
     * @param by
     * @param value
     */
    public accountWithHttpInfo(by: 'index' | 'l1_address', value: string, _options?: ConfigurationOptions): Observable<HttpInfo<DetailedAccounts>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.account(by, value, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.accountWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.
     * account
     * @param by
     * @param value
     */
    public account(by: 'index' | 'l1_address', value: string, _options?: ConfigurationOptions): Observable<DetailedAccounts> {
        return this.accountWithHttpInfo(by, value, _options).pipe(map((apiResponse: HttpInfo<DetailedAccounts>) => apiResponse.data));
    }

    /**
     * Get account limits
     * accountLimits
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountLimitsWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<AccountLimits>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.accountLimits(accountIndex, authorization, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.accountLimitsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get account limits
     * accountLimits
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountLimits(accountIndex: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<AccountLimits> {
        return this.accountLimitsWithHttpInfo(accountIndex, authorization, auth, _options).pipe(map((apiResponse: HttpInfo<AccountLimits>) => apiResponse.data));
    }

    /**
     * Get account metadatas
     * accountMetadata
     * @param by
     * @param value
     * @param [authorization]
     * @param [auth]
     */
    public accountMetadataWithHttpInfo(by: 'index' | 'l1_address', value: string, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<AccountMetadatas>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.accountMetadata(by, value, authorization, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.accountMetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get account metadatas
     * accountMetadata
     * @param by
     * @param value
     * @param [authorization]
     * @param [auth]
     */
    public accountMetadata(by: 'index' | 'l1_address', value: string, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<AccountMetadatas> {
        return this.accountMetadataWithHttpInfo(by, value, authorization, auth, _options).pipe(map((apiResponse: HttpInfo<AccountMetadatas>) => apiResponse.data));
    }

    /**
     * Get accounts by l1_address returns all accounts associated with the given L1 address
     * accountsByL1Address
     * @param l1Address
     */
    public accountsByL1AddressWithHttpInfo(l1Address: string, _options?: ConfigurationOptions): Observable<HttpInfo<SubAccounts>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.accountsByL1Address(l1Address, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.accountsByL1AddressWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get accounts by l1_address returns all accounts associated with the given L1 address
     * accountsByL1Address
     * @param l1Address
     */
    public accountsByL1Address(l1Address: string, _options?: ConfigurationOptions): Observable<SubAccounts> {
        return this.accountsByL1AddressWithHttpInfo(l1Address, _options).pipe(map((apiResponse: HttpInfo<SubAccounts>) => apiResponse.data));
    }

    /**
     * Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.
     * apikeys
     * @param accountIndex
     * @param [apiKeyIndex]
     */
    public apikeysWithHttpInfo(accountIndex: number, apiKeyIndex?: number, _options?: ConfigurationOptions): Observable<HttpInfo<AccountApiKeys>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.apikeys(accountIndex, apiKeyIndex, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.apikeysWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.
     * apikeys
     * @param accountIndex
     * @param [apiKeyIndex]
     */
    public apikeys(accountIndex: number, apiKeyIndex?: number, _options?: ConfigurationOptions): Observable<AccountApiKeys> {
        return this.apikeysWithHttpInfo(accountIndex, apiKeyIndex, _options).pipe(map((apiResponse: HttpInfo<AccountApiKeys>) => apiResponse.data));
    }

    /**
     * Change account tier
     * changeAccountTier
     * @param accountIndex
     * @param newTier
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public changeAccountTierWithHttpInfo(accountIndex: number, newTier: string, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<RespChangeAccountTier>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.changeAccountTier(accountIndex, newTier, authorization, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.changeAccountTierWithHttpInfo(rsp)));
            }));
    }

    /**
     * Change account tier
     * changeAccountTier
     * @param accountIndex
     * @param newTier
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public changeAccountTier(accountIndex: number, newTier: string, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<RespChangeAccountTier> {
        return this.changeAccountTierWithHttpInfo(accountIndex, newTier, authorization, auth, _options).pipe(map((apiResponse: HttpInfo<RespChangeAccountTier>) => apiResponse.data));
    }

    /**
     * Get L1 metadata
     * l1Metadata
     * @param l1Address
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public l1MetadataWithHttpInfo(l1Address: string, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<L1Metadata>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.l1Metadata(l1Address, authorization, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.l1MetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get L1 metadata
     * l1Metadata
     * @param l1Address
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public l1Metadata(l1Address: string, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<L1Metadata> {
        return this.l1MetadataWithHttpInfo(l1Address, authorization, auth, _options).pipe(map((apiResponse: HttpInfo<L1Metadata>) => apiResponse.data));
    }

    /**
     * Get liquidation infos
     * liquidations
     * @param accountIndex
     * @param limit
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [marketId]
     * @param [cursor]
     */
    public liquidationsWithHttpInfo(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, _options?: ConfigurationOptions): Observable<HttpInfo<LiquidationInfos>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.liquidations(accountIndex, limit, authorization, auth, marketId, cursor, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.liquidationsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get liquidation infos
     * liquidations
     * @param accountIndex
     * @param limit
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [marketId]
     * @param [cursor]
     */
    public liquidations(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, _options?: ConfigurationOptions): Observable<LiquidationInfos> {
        return this.liquidationsWithHttpInfo(accountIndex, limit, authorization, auth, marketId, cursor, _options).pipe(map((apiResponse: HttpInfo<LiquidationInfos>) => apiResponse.data));
    }

    /**
     * Get account PnL chart
     * pnl
     * @param by
     * @param value
     * @param resolution
     * @param startTimestamp
     * @param endTimestamp
     * @param countBack
     * @param [authorization]
     * @param [auth]
     * @param [ignoreTransfers]
     */
    public pnlWithHttpInfo(by: 'index', value: string, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, authorization?: string, auth?: string, ignoreTransfers?: boolean, _options?: ConfigurationOptions): Observable<HttpInfo<AccountPnL>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.pnl(by, value, resolution, startTimestamp, endTimestamp, countBack, authorization, auth, ignoreTransfers, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.pnlWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get account PnL chart
     * pnl
     * @param by
     * @param value
     * @param resolution
     * @param startTimestamp
     * @param endTimestamp
     * @param countBack
     * @param [authorization]
     * @param [auth]
     * @param [ignoreTransfers]
     */
    public pnl(by: 'index', value: string, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, authorization?: string, auth?: string, ignoreTransfers?: boolean, _options?: ConfigurationOptions): Observable<AccountPnL> {
        return this.pnlWithHttpInfo(by, value, resolution, startTimestamp, endTimestamp, countBack, authorization, auth, ignoreTransfers, _options).pipe(map((apiResponse: HttpInfo<AccountPnL>) => apiResponse.data));
    }

    /**
     * Get accounts position fundings
     * positionFunding
     * @param accountIndex
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [marketId]
     * @param [cursor]
     * @param [side]
     */
    public positionFundingWithHttpInfo(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, side?: 'long' | 'short' | 'all', _options?: ConfigurationOptions): Observable<HttpInfo<PositionFundings>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.positionFunding(accountIndex, limit, authorization, auth, marketId, cursor, side, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.positionFundingWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get accounts position fundings
     * positionFunding
     * @param accountIndex
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [marketId]
     * @param [cursor]
     * @param [side]
     */
    public positionFunding(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, side?: 'long' | 'short' | 'all', _options?: ConfigurationOptions): Observable<PositionFundings> {
        return this.positionFundingWithHttpInfo(accountIndex, limit, authorization, auth, marketId, cursor, side, _options).pipe(map((apiResponse: HttpInfo<PositionFundings>) => apiResponse.data));
    }

    /**
     * Get public pools
     * publicPools
     * @param index
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [filter]
     * @param [accountIndex]
     */
    public publicPoolsWithHttpInfo(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PublicPools>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.publicPools(index, limit, authorization, auth, filter, accountIndex, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.publicPoolsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get public pools
     * publicPools
     * @param index
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [filter]
     * @param [accountIndex]
     */
    public publicPools(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: ConfigurationOptions): Observable<PublicPools> {
        return this.publicPoolsWithHttpInfo(index, limit, authorization, auth, filter, accountIndex, _options).pipe(map((apiResponse: HttpInfo<PublicPools>) => apiResponse.data));
    }

    /**
     * Get public pools metadata
     * publicPoolsMetadata
     * @param index
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [filter]
     * @param [accountIndex]
     */
    public publicPoolsMetadataWithHttpInfo(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: ConfigurationOptions): Observable<HttpInfo<RespPublicPoolsMetadata>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.publicPoolsMetadata(index, limit, authorization, auth, filter, accountIndex, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.publicPoolsMetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get public pools metadata
     * publicPoolsMetadata
     * @param index
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [filter]
     * @param [accountIndex]
     */
    public publicPoolsMetadata(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: ConfigurationOptions): Observable<RespPublicPoolsMetadata> {
        return this.publicPoolsMetadataWithHttpInfo(index, limit, authorization, auth, filter, accountIndex, _options).pipe(map((apiResponse: HttpInfo<RespPublicPoolsMetadata>) => apiResponse.data));
    }

}

import { AnnouncementApiRequestFactory, AnnouncementApiResponseProcessor} from "../apis/AnnouncementApi";
export class ObservableAnnouncementApi {
    private requestFactory: AnnouncementApiRequestFactory;
    private responseProcessor: AnnouncementApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: AnnouncementApiRequestFactory,
        responseProcessor?: AnnouncementApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new AnnouncementApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new AnnouncementApiResponseProcessor();
    }

    /**
     * Get announcement
     * announcement
     */
    public announcementWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Announcements>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.announcement(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.announcementWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get announcement
     * announcement
     */
    public announcement(_options?: ConfigurationOptions): Observable<Announcements> {
        return this.announcementWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Announcements>) => apiResponse.data));
    }

}

import { BlockApiRequestFactory, BlockApiResponseProcessor} from "../apis/BlockApi";
export class ObservableBlockApi {
    private requestFactory: BlockApiRequestFactory;
    private responseProcessor: BlockApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: BlockApiRequestFactory,
        responseProcessor?: BlockApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new BlockApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new BlockApiResponseProcessor();
    }

    /**
     * Get block by its height or commitment
     * block
     * @param by
     * @param value
     */
    public blockWithHttpInfo(by: 'commitment' | 'height', value: string, _options?: ConfigurationOptions): Observable<HttpInfo<Blocks>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.block(by, value, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.blockWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get block by its height or commitment
     * block
     * @param by
     * @param value
     */
    public block(by: 'commitment' | 'height', value: string, _options?: ConfigurationOptions): Observable<Blocks> {
        return this.blockWithHttpInfo(by, value, _options).pipe(map((apiResponse: HttpInfo<Blocks>) => apiResponse.data));
    }

    /**
     * Get blocks
     * blocks
     * @param limit
     * @param [index]
     * @param [sort]
     */
    public blocksWithHttpInfo(limit: number, index?: number, sort?: 'asc' | 'desc', _options?: ConfigurationOptions): Observable<HttpInfo<Blocks>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.blocks(limit, index, sort, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.blocksWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get blocks
     * blocks
     * @param limit
     * @param [index]
     * @param [sort]
     */
    public blocks(limit: number, index?: number, sort?: 'asc' | 'desc', _options?: ConfigurationOptions): Observable<Blocks> {
        return this.blocksWithHttpInfo(limit, index, sort, _options).pipe(map((apiResponse: HttpInfo<Blocks>) => apiResponse.data));
    }

    /**
     * Get current height
     * currentHeight
     */
    public currentHeightWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<CurrentHeight>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.currentHeight(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.currentHeightWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get current height
     * currentHeight
     */
    public currentHeight(_options?: ConfigurationOptions): Observable<CurrentHeight> {
        return this.currentHeightWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<CurrentHeight>) => apiResponse.data));
    }

}

import { BridgeApiRequestFactory, BridgeApiResponseProcessor} from "../apis/BridgeApi";
export class ObservableBridgeApi {
    private requestFactory: BridgeApiRequestFactory;
    private responseProcessor: BridgeApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: BridgeApiRequestFactory,
        responseProcessor?: BridgeApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new BridgeApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new BridgeApiResponseProcessor();
    }

    /**
     * Get fast bridge info
     * fastbridge_info
     */
    public fastbridgeInfoWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<RespGetFastBridgeInfo>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.fastbridgeInfo(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.fastbridgeInfoWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get fast bridge info
     * fastbridge_info
     */
    public fastbridgeInfo(_options?: ConfigurationOptions): Observable<RespGetFastBridgeInfo> {
        return this.fastbridgeInfoWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<RespGetFastBridgeInfo>) => apiResponse.data));
    }

}

import { CandlestickApiRequestFactory, CandlestickApiResponseProcessor} from "../apis/CandlestickApi";
export class ObservableCandlestickApi {
    private requestFactory: CandlestickApiRequestFactory;
    private responseProcessor: CandlestickApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: CandlestickApiRequestFactory,
        responseProcessor?: CandlestickApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new CandlestickApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new CandlestickApiResponseProcessor();
    }

    /**
     * Get candlesticks
     * candlesticks
     * @param marketId
     * @param resolution
     * @param startTimestamp
     * @param endTimestamp
     * @param countBack
     * @param [setTimestampToEnd]
     */
    public candlesticksWithHttpInfo(marketId: number, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, setTimestampToEnd?: boolean, _options?: ConfigurationOptions): Observable<HttpInfo<Candlesticks>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.candlesticks(marketId, resolution, startTimestamp, endTimestamp, countBack, setTimestampToEnd, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.candlesticksWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get candlesticks
     * candlesticks
     * @param marketId
     * @param resolution
     * @param startTimestamp
     * @param endTimestamp
     * @param countBack
     * @param [setTimestampToEnd]
     */
    public candlesticks(marketId: number, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, setTimestampToEnd?: boolean, _options?: ConfigurationOptions): Observable<Candlesticks> {
        return this.candlesticksWithHttpInfo(marketId, resolution, startTimestamp, endTimestamp, countBack, setTimestampToEnd, _options).pipe(map((apiResponse: HttpInfo<Candlesticks>) => apiResponse.data));
    }

    /**
     * Get fundings
     * fundings
     * @param marketId
     * @param resolution
     * @param startTimestamp
     * @param endTimestamp
     * @param countBack
     */
    public fundingsWithHttpInfo(marketId: number, resolution: '1h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, _options?: ConfigurationOptions): Observable<HttpInfo<Fundings>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.fundings(marketId, resolution, startTimestamp, endTimestamp, countBack, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.fundingsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get fundings
     * fundings
     * @param marketId
     * @param resolution
     * @param startTimestamp
     * @param endTimestamp
     * @param countBack
     */
    public fundings(marketId: number, resolution: '1h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, _options?: ConfigurationOptions): Observable<Fundings> {
        return this.fundingsWithHttpInfo(marketId, resolution, startTimestamp, endTimestamp, countBack, _options).pipe(map((apiResponse: HttpInfo<Fundings>) => apiResponse.data));
    }

}

import { FundingApiRequestFactory, FundingApiResponseProcessor} from "../apis/FundingApi";
export class ObservableFundingApi {
    private requestFactory: FundingApiRequestFactory;
    private responseProcessor: FundingApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FundingApiRequestFactory,
        responseProcessor?: FundingApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FundingApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FundingApiResponseProcessor();
    }

    /**
     * Get funding rates
     * funding-rates
     */
    public fundingRatesWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<FundingRates>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.fundingRates(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.fundingRatesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get funding rates
     * funding-rates
     */
    public fundingRates(_options?: ConfigurationOptions): Observable<FundingRates> {
        return this.fundingRatesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<FundingRates>) => apiResponse.data));
    }

}

import { InfoApiRequestFactory, InfoApiResponseProcessor} from "../apis/InfoApi";
export class ObservableInfoApi {
    private requestFactory: InfoApiRequestFactory;
    private responseProcessor: InfoApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: InfoApiRequestFactory,
        responseProcessor?: InfoApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new InfoApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new InfoApiResponseProcessor();
    }

    /**
     * Transfer fee info
     * transferFeeInfo
     * @param accountIndex
     * @param [authorization]
     * @param [auth]
     * @param [toAccountIndex]
     */
    public transferFeeInfoWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, toAccountIndex?: number, _options?: ConfigurationOptions): Observable<HttpInfo<TransferFeeInfo>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.transferFeeInfo(accountIndex, authorization, auth, toAccountIndex, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.transferFeeInfoWithHttpInfo(rsp)));
            }));
    }

    /**
     * Transfer fee info
     * transferFeeInfo
     * @param accountIndex
     * @param [authorization]
     * @param [auth]
     * @param [toAccountIndex]
     */
    public transferFeeInfo(accountIndex: number, authorization?: string, auth?: string, toAccountIndex?: number, _options?: ConfigurationOptions): Observable<TransferFeeInfo> {
        return this.transferFeeInfoWithHttpInfo(accountIndex, authorization, auth, toAccountIndex, _options).pipe(map((apiResponse: HttpInfo<TransferFeeInfo>) => apiResponse.data));
    }

    /**
     * Withdrawal delay in seconds
     * withdrawalDelay
     */
    public withdrawalDelayWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<RespWithdrawalDelay>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.withdrawalDelay(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.withdrawalDelayWithHttpInfo(rsp)));
            }));
    }

    /**
     * Withdrawal delay in seconds
     * withdrawalDelay
     */
    public withdrawalDelay(_options?: ConfigurationOptions): Observable<RespWithdrawalDelay> {
        return this.withdrawalDelayWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<RespWithdrawalDelay>) => apiResponse.data));
    }

}

import { NotificationApiRequestFactory, NotificationApiResponseProcessor} from "../apis/NotificationApi";
export class ObservableNotificationApi {
    private requestFactory: NotificationApiRequestFactory;
    private responseProcessor: NotificationApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: NotificationApiRequestFactory,
        responseProcessor?: NotificationApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new NotificationApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new NotificationApiResponseProcessor();
    }

    /**
     * Ack notification
     * notification_ack
     * @param notifId
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public notificationAckWithHttpInfo(notifId: string, accountIndex: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<ResultCode>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.notificationAck(notifId, accountIndex, authorization, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.notificationAckWithHttpInfo(rsp)));
            }));
    }

    /**
     * Ack notification
     * notification_ack
     * @param notifId
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public notificationAck(notifId: string, accountIndex: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<ResultCode> {
        return this.notificationAckWithHttpInfo(notifId, accountIndex, authorization, auth, _options).pipe(map((apiResponse: HttpInfo<ResultCode>) => apiResponse.data));
    }

}

import { OrderApiRequestFactory, OrderApiResponseProcessor} from "../apis/OrderApi";
export class ObservableOrderApi {
    private requestFactory: OrderApiRequestFactory;
    private responseProcessor: OrderApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: OrderApiRequestFactory,
        responseProcessor?: OrderApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new OrderApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new OrderApiResponseProcessor();
    }

    /**
     * Export data
     * export
     * @param type
     * @param [authorization]
     * @param [auth]
     * @param [accountIndex]
     * @param [marketId]
     */
    public _exportWithHttpInfo(type: 'funding' | 'trade', authorization?: string, auth?: string, accountIndex?: number, marketId?: number, _options?: ConfigurationOptions): Observable<HttpInfo<ExportData>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory._export(type, authorization, auth, accountIndex, marketId, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor._exportWithHttpInfo(rsp)));
            }));
    }

    /**
     * Export data
     * export
     * @param type
     * @param [authorization]
     * @param [auth]
     * @param [accountIndex]
     * @param [marketId]
     */
    public _export(type: 'funding' | 'trade', authorization?: string, auth?: string, accountIndex?: number, marketId?: number, _options?: ConfigurationOptions): Observable<ExportData> {
        return this._exportWithHttpInfo(type, authorization, auth, accountIndex, marketId, _options).pipe(map((apiResponse: HttpInfo<ExportData>) => apiResponse.data));
    }

    /**
     * Get account active orders. `auth` can be generated using the SDK.
     * accountActiveOrders
     * @param accountIndex
     * @param marketId
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountActiveOrdersWithHttpInfo(accountIndex: number, marketId: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Orders>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.accountActiveOrders(accountIndex, marketId, authorization, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.accountActiveOrdersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get account active orders. `auth` can be generated using the SDK.
     * accountActiveOrders
     * @param accountIndex
     * @param marketId
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountActiveOrders(accountIndex: number, marketId: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<Orders> {
        return this.accountActiveOrdersWithHttpInfo(accountIndex, marketId, authorization, auth, _options).pipe(map((apiResponse: HttpInfo<Orders>) => apiResponse.data));
    }

    /**
     * Get account inactive orders
     * accountInactiveOrders
     * @param accountIndex
     * @param limit
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [marketId]
     * @param [askFilter]
     * @param [betweenTimestamps]
     * @param [cursor]
     */
    public accountInactiveOrdersWithHttpInfo(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, askFilter?: number, betweenTimestamps?: string, cursor?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Orders>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.accountInactiveOrders(accountIndex, limit, authorization, auth, marketId, askFilter, betweenTimestamps, cursor, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.accountInactiveOrdersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get account inactive orders
     * accountInactiveOrders
     * @param accountIndex
     * @param limit
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [marketId]
     * @param [askFilter]
     * @param [betweenTimestamps]
     * @param [cursor]
     */
    public accountInactiveOrders(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, askFilter?: number, betweenTimestamps?: string, cursor?: string, _options?: ConfigurationOptions): Observable<Orders> {
        return this.accountInactiveOrdersWithHttpInfo(accountIndex, limit, authorization, auth, marketId, askFilter, betweenTimestamps, cursor, _options).pipe(map((apiResponse: HttpInfo<Orders>) => apiResponse.data));
    }

    /**
     * Get exchange stats
     * exchangeStats
     */
    public exchangeStatsWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<ExchangeStats>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.exchangeStats(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.exchangeStatsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get exchange stats
     * exchangeStats
     */
    public exchangeStats(_options?: ConfigurationOptions): Observable<ExchangeStats> {
        return this.exchangeStatsWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ExchangeStats>) => apiResponse.data));
    }

    /**
     * Get order books metadata
     * orderBookDetails
     * @param [marketId]
     */
    public orderBookDetailsWithHttpInfo(marketId?: number, _options?: ConfigurationOptions): Observable<HttpInfo<OrderBookDetails>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.orderBookDetails(marketId, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.orderBookDetailsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get order books metadata
     * orderBookDetails
     * @param [marketId]
     */
    public orderBookDetails(marketId?: number, _options?: ConfigurationOptions): Observable<OrderBookDetails> {
        return this.orderBookDetailsWithHttpInfo(marketId, _options).pipe(map((apiResponse: HttpInfo<OrderBookDetails>) => apiResponse.data));
    }

    /**
     * Get order book orders
     * orderBookOrders
     * @param marketId
     * @param limit
     */
    public orderBookOrdersWithHttpInfo(marketId: number, limit: number, _options?: ConfigurationOptions): Observable<HttpInfo<OrderBookOrders>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.orderBookOrders(marketId, limit, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.orderBookOrdersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get order book orders
     * orderBookOrders
     * @param marketId
     * @param limit
     */
    public orderBookOrders(marketId: number, limit: number, _options?: ConfigurationOptions): Observable<OrderBookOrders> {
        return this.orderBookOrdersWithHttpInfo(marketId, limit, _options).pipe(map((apiResponse: HttpInfo<OrderBookOrders>) => apiResponse.data));
    }

    /**
     * Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.
     * orderBooks
     * @param [marketId]
     */
    public orderBooksWithHttpInfo(marketId?: number, _options?: ConfigurationOptions): Observable<HttpInfo<OrderBooks>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.orderBooks(marketId, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.orderBooksWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.
     * orderBooks
     * @param [marketId]
     */
    public orderBooks(marketId?: number, _options?: ConfigurationOptions): Observable<OrderBooks> {
        return this.orderBooksWithHttpInfo(marketId, _options).pipe(map((apiResponse: HttpInfo<OrderBooks>) => apiResponse.data));
    }

    /**
     * Get recent trades
     * recentTrades
     * @param marketId
     * @param limit
     */
    public recentTradesWithHttpInfo(marketId: number, limit: number, _options?: ConfigurationOptions): Observable<HttpInfo<Trades>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.recentTrades(marketId, limit, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.recentTradesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get recent trades
     * recentTrades
     * @param marketId
     * @param limit
     */
    public recentTrades(marketId: number, limit: number, _options?: ConfigurationOptions): Observable<Trades> {
        return this.recentTradesWithHttpInfo(marketId, limit, _options).pipe(map((apiResponse: HttpInfo<Trades>) => apiResponse.data));
    }

    /**
     * Get trades
     * trades
     * @param sortBy
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [marketId]
     * @param [accountIndex]
     * @param [orderIndex]
     * @param [sortDir]
     * @param [cursor]
     * @param [_from]
     * @param [askFilter]
     */
    public tradesWithHttpInfo(sortBy: 'block_height' | 'timestamp' | 'trade_id', limit: number, authorization?: string, auth?: string, marketId?: number, accountIndex?: number, orderIndex?: number, sortDir?: 'desc', cursor?: string, _from?: number, askFilter?: number, _options?: ConfigurationOptions): Observable<HttpInfo<Trades>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.trades(sortBy, limit, authorization, auth, marketId, accountIndex, orderIndex, sortDir, cursor, _from, askFilter, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.tradesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get trades
     * trades
     * @param sortBy
     * @param limit
     * @param [authorization]
     * @param [auth]
     * @param [marketId]
     * @param [accountIndex]
     * @param [orderIndex]
     * @param [sortDir]
     * @param [cursor]
     * @param [_from]
     * @param [askFilter]
     */
    public trades(sortBy: 'block_height' | 'timestamp' | 'trade_id', limit: number, authorization?: string, auth?: string, marketId?: number, accountIndex?: number, orderIndex?: number, sortDir?: 'desc', cursor?: string, _from?: number, askFilter?: number, _options?: ConfigurationOptions): Observable<Trades> {
        return this.tradesWithHttpInfo(sortBy, limit, authorization, auth, marketId, accountIndex, orderIndex, sortDir, cursor, _from, askFilter, _options).pipe(map((apiResponse: HttpInfo<Trades>) => apiResponse.data));
    }

}

import { ReferralApiRequestFactory, ReferralApiResponseProcessor} from "../apis/ReferralApi";
export class ObservableReferralApi {
    private requestFactory: ReferralApiRequestFactory;
    private responseProcessor: ReferralApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ReferralApiRequestFactory,
        responseProcessor?: ReferralApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ReferralApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ReferralApiResponseProcessor();
    }

    /**
     * Get referral points
     * referral_points
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public referralPointsWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<ReferralPoints>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.referralPoints(accountIndex, authorization, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.referralPointsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get referral points
     * referral_points
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public referralPoints(accountIndex: number, authorization?: string, auth?: string, _options?: ConfigurationOptions): Observable<ReferralPoints> {
        return this.referralPointsWithHttpInfo(accountIndex, authorization, auth, _options).pipe(map((apiResponse: HttpInfo<ReferralPoints>) => apiResponse.data));
    }

}

import { RootApiRequestFactory, RootApiResponseProcessor} from "../apis/RootApi";
export class ObservableRootApi {
    private requestFactory: RootApiRequestFactory;
    private responseProcessor: RootApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: RootApiRequestFactory,
        responseProcessor?: RootApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new RootApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new RootApiResponseProcessor();
    }

    /**
     * Get info of zklighter
     * info
     */
    public infoWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<ZkLighterInfo>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.info(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.infoWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get info of zklighter
     * info
     */
    public info(_options?: ConfigurationOptions): Observable<ZkLighterInfo> {
        return this.infoWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ZkLighterInfo>) => apiResponse.data));
    }

    /**
     * Get status of zklighter
     * status
     */
    public statusWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Status>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.status(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.statusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get status of zklighter
     * status
     */
    public status(_options?: ConfigurationOptions): Observable<Status> {
        return this.statusWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Status>) => apiResponse.data));
    }

}

import { TransactionApiRequestFactory, TransactionApiResponseProcessor} from "../apis/TransactionApi";
export class ObservableTransactionApi {
    private requestFactory: TransactionApiRequestFactory;
    private responseProcessor: TransactionApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: TransactionApiRequestFactory,
        responseProcessor?: TransactionApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new TransactionApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new TransactionApiResponseProcessor();
    }

    /**
     * Get transactions of a specific account
     * accountTxs
     * @param limit
     * @param by
     * @param value
     * @param [authorization]
     * @param [index]
     * @param [types]
     * @param [auth]
     */
    public accountTxsWithHttpInfo(limit: number, by: 'account_index', value: string, authorization?: string, index?: number, types?: Array<number>, auth?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Txs>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.accountTxs(limit, by, value, authorization, index, types, auth, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.accountTxsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get transactions of a specific account
     * accountTxs
     * @param limit
     * @param by
     * @param value
     * @param [authorization]
     * @param [index]
     * @param [types]
     * @param [auth]
     */
    public accountTxs(limit: number, by: 'account_index', value: string, authorization?: string, index?: number, types?: Array<number>, auth?: string, _options?: ConfigurationOptions): Observable<Txs> {
        return this.accountTxsWithHttpInfo(limit, by, value, authorization, index, types, auth, _options).pipe(map((apiResponse: HttpInfo<Txs>) => apiResponse.data));
    }

    /**
     * Get transactions in a block
     * blockTxs
     * @param by
     * @param value
     */
    public blockTxsWithHttpInfo(by: 'block_height' | 'block_commitment', value: string, _options?: ConfigurationOptions): Observable<HttpInfo<Txs>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.blockTxs(by, value, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.blockTxsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get transactions in a block
     * blockTxs
     * @param by
     * @param value
     */
    public blockTxs(by: 'block_height' | 'block_commitment', value: string, _options?: ConfigurationOptions): Observable<Txs> {
        return this.blockTxsWithHttpInfo(by, value, _options).pipe(map((apiResponse: HttpInfo<Txs>) => apiResponse.data));
    }

    /**
     * Get deposit history
     * deposit_history
     * @param accountIndex
     * @param l1Address
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     * @param [filter]
     */
    public depositHistoryWithHttpInfo(accountIndex: number, l1Address: string, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: ConfigurationOptions): Observable<HttpInfo<DepositHistory>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.depositHistory(accountIndex, l1Address, authorization, auth, cursor, filter, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.depositHistoryWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get deposit history
     * deposit_history
     * @param accountIndex
     * @param l1Address
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     * @param [filter]
     */
    public depositHistory(accountIndex: number, l1Address: string, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: ConfigurationOptions): Observable<DepositHistory> {
        return this.depositHistoryWithHttpInfo(accountIndex, l1Address, authorization, auth, cursor, filter, _options).pipe(map((apiResponse: HttpInfo<DepositHistory>) => apiResponse.data));
    }

    /**
     * Get next nonce for a specific account and api key
     * nextNonce
     * @param accountIndex
     * @param apiKeyIndex
     */
    public nextNonceWithHttpInfo(accountIndex: number, apiKeyIndex: number, _options?: ConfigurationOptions): Observable<HttpInfo<NextNonce>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.nextNonce(accountIndex, apiKeyIndex, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.nextNonceWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get next nonce for a specific account and api key
     * nextNonce
     * @param accountIndex
     * @param apiKeyIndex
     */
    public nextNonce(accountIndex: number, apiKeyIndex: number, _options?: ConfigurationOptions): Observable<NextNonce> {
        return this.nextNonceWithHttpInfo(accountIndex, apiKeyIndex, _options).pipe(map((apiResponse: HttpInfo<NextNonce>) => apiResponse.data));
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTx
     * @param txType
     * @param txInfo
     * @param [priceProtection]
     */
    public sendTxWithHttpInfo(txType: number, txInfo: string, priceProtection?: boolean, _options?: ConfigurationOptions): Observable<HttpInfo<RespSendTx>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.sendTx(txType, txInfo, priceProtection, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.sendTxWithHttpInfo(rsp)));
            }));
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTx
     * @param txType
     * @param txInfo
     * @param [priceProtection]
     */
    public sendTx(txType: number, txInfo: string, priceProtection?: boolean, _options?: ConfigurationOptions): Observable<RespSendTx> {
        return this.sendTxWithHttpInfo(txType, txInfo, priceProtection, _options).pipe(map((apiResponse: HttpInfo<RespSendTx>) => apiResponse.data));
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTxBatch
     * @param txTypes
     * @param txInfos
     */
    public sendTxBatchWithHttpInfo(txTypes: string, txInfos: string, _options?: ConfigurationOptions): Observable<HttpInfo<RespSendTxBatch>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.sendTxBatch(txTypes, txInfos, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.sendTxBatchWithHttpInfo(rsp)));
            }));
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTxBatch
     * @param txTypes
     * @param txInfos
     */
    public sendTxBatch(txTypes: string, txInfos: string, _options?: ConfigurationOptions): Observable<RespSendTxBatch> {
        return this.sendTxBatchWithHttpInfo(txTypes, txInfos, _options).pipe(map((apiResponse: HttpInfo<RespSendTxBatch>) => apiResponse.data));
    }

    /**
     * Get transfer history
     * transfer_history
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     */
    public transferHistoryWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, cursor?: string, _options?: ConfigurationOptions): Observable<HttpInfo<TransferHistory>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.transferHistory(accountIndex, authorization, auth, cursor, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.transferHistoryWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get transfer history
     * transfer_history
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     */
    public transferHistory(accountIndex: number, authorization?: string, auth?: string, cursor?: string, _options?: ConfigurationOptions): Observable<TransferHistory> {
        return this.transferHistoryWithHttpInfo(accountIndex, authorization, auth, cursor, _options).pipe(map((apiResponse: HttpInfo<TransferHistory>) => apiResponse.data));
    }

    /**
     * Get transaction by hash or sequence index
     * tx
     * @param by
     * @param value
     */
    public txWithHttpInfo(by: 'hash' | 'sequence_index', value: string, _options?: ConfigurationOptions): Observable<HttpInfo<EnrichedTx>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.tx(by, value, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.txWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get transaction by hash or sequence index
     * tx
     * @param by
     * @param value
     */
    public tx(by: 'hash' | 'sequence_index', value: string, _options?: ConfigurationOptions): Observable<EnrichedTx> {
        return this.txWithHttpInfo(by, value, _options).pipe(map((apiResponse: HttpInfo<EnrichedTx>) => apiResponse.data));
    }

    /**
     * Get L1 transaction by L1 transaction hash
     * txFromL1TxHash
     * @param hash
     */
    public txFromL1TxHashWithHttpInfo(hash: string, _options?: ConfigurationOptions): Observable<HttpInfo<EnrichedTx>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.txFromL1TxHash(hash, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.txFromL1TxHashWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get L1 transaction by L1 transaction hash
     * txFromL1TxHash
     * @param hash
     */
    public txFromL1TxHash(hash: string, _options?: ConfigurationOptions): Observable<EnrichedTx> {
        return this.txFromL1TxHashWithHttpInfo(hash, _options).pipe(map((apiResponse: HttpInfo<EnrichedTx>) => apiResponse.data));
    }

    /**
     * Get transactions which are already packed into blocks
     * txs
     * @param limit
     * @param [index]
     */
    public txsWithHttpInfo(limit: number, index?: number, _options?: ConfigurationOptions): Observable<HttpInfo<Txs>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.txs(limit, index, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.txsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get transactions which are already packed into blocks
     * txs
     * @param limit
     * @param [index]
     */
    public txs(limit: number, index?: number, _options?: ConfigurationOptions): Observable<Txs> {
        return this.txsWithHttpInfo(limit, index, _options).pipe(map((apiResponse: HttpInfo<Txs>) => apiResponse.data));
    }

    /**
     * Get withdraw history
     * withdraw_history
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     * @param [filter]
     */
    public withdrawHistoryWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: ConfigurationOptions): Observable<HttpInfo<WithdrawHistory>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.withdrawHistory(accountIndex, authorization, auth, cursor, filter, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.withdrawHistoryWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get withdraw history
     * withdraw_history
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     * @param [filter]
     */
    public withdrawHistory(accountIndex: number, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: ConfigurationOptions): Observable<WithdrawHistory> {
        return this.withdrawHistoryWithHttpInfo(accountIndex, authorization, auth, cursor, filter, _options).pipe(map((apiResponse: HttpInfo<WithdrawHistory>) => apiResponse.data));
    }

}
