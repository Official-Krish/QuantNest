import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, PromiseConfigurationOptions, wrapOptions } from '../configuration'
import { PromiseMiddleware, Middleware, PromiseMiddlewareWrapper } from '../middleware';

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
import { ObservableAccountApi } from './ObservableAPI';

import { AccountApiRequestFactory, AccountApiResponseProcessor} from "../apis/AccountApi";
export class PromiseAccountApi {
    private api: ObservableAccountApi

    public constructor(
        configuration: Configuration,
        requestFactory?: AccountApiRequestFactory,
        responseProcessor?: AccountApiResponseProcessor
    ) {
        this.api = new ObservableAccountApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.
     * account
     * @param by
     * @param value
     */
    public accountWithHttpInfo(by: 'index' | 'l1_address', value: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<DetailedAccounts>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountWithHttpInfo(by, value, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.
     * account
     * @param by
     * @param value
     */
    public account(by: 'index' | 'l1_address', value: string, _options?: PromiseConfigurationOptions): Promise<DetailedAccounts> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.account(by, value, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account limits
     * accountLimits
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountLimitsWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<AccountLimits>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountLimitsWithHttpInfo(accountIndex, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account limits
     * accountLimits
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountLimits(accountIndex: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<AccountLimits> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountLimits(accountIndex, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account metadatas
     * accountMetadata
     * @param by
     * @param value
     * @param [authorization]
     * @param [auth]
     */
    public accountMetadataWithHttpInfo(by: 'index' | 'l1_address', value: string, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<AccountMetadatas>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountMetadataWithHttpInfo(by, value, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account metadatas
     * accountMetadata
     * @param by
     * @param value
     * @param [authorization]
     * @param [auth]
     */
    public accountMetadata(by: 'index' | 'l1_address', value: string, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<AccountMetadatas> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountMetadata(by, value, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get accounts by l1_address returns all accounts associated with the given L1 address
     * accountsByL1Address
     * @param l1Address
     */
    public accountsByL1AddressWithHttpInfo(l1Address: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<SubAccounts>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountsByL1AddressWithHttpInfo(l1Address, observableOptions);
        return result.toPromise();
    }

    /**
     * Get accounts by l1_address returns all accounts associated with the given L1 address
     * accountsByL1Address
     * @param l1Address
     */
    public accountsByL1Address(l1Address: string, _options?: PromiseConfigurationOptions): Promise<SubAccounts> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountsByL1Address(l1Address, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.
     * apikeys
     * @param accountIndex
     * @param [apiKeyIndex]
     */
    public apikeysWithHttpInfo(accountIndex: number, apiKeyIndex?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<AccountApiKeys>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.apikeysWithHttpInfo(accountIndex, apiKeyIndex, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.
     * apikeys
     * @param accountIndex
     * @param [apiKeyIndex]
     */
    public apikeys(accountIndex: number, apiKeyIndex?: number, _options?: PromiseConfigurationOptions): Promise<AccountApiKeys> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.apikeys(accountIndex, apiKeyIndex, observableOptions);
        return result.toPromise();
    }

    /**
     * Change account tier
     * changeAccountTier
     * @param accountIndex
     * @param newTier
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public changeAccountTierWithHttpInfo(accountIndex: number, newTier: string, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<RespChangeAccountTier>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.changeAccountTierWithHttpInfo(accountIndex, newTier, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Change account tier
     * changeAccountTier
     * @param accountIndex
     * @param newTier
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public changeAccountTier(accountIndex: number, newTier: string, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<RespChangeAccountTier> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.changeAccountTier(accountIndex, newTier, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get L1 metadata
     * l1Metadata
     * @param l1Address
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public l1MetadataWithHttpInfo(l1Address: string, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<L1Metadata>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.l1MetadataWithHttpInfo(l1Address, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get L1 metadata
     * l1Metadata
     * @param l1Address
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public l1Metadata(l1Address: string, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<L1Metadata> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.l1Metadata(l1Address, authorization, auth, observableOptions);
        return result.toPromise();
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
    public liquidationsWithHttpInfo(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<LiquidationInfos>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.liquidationsWithHttpInfo(accountIndex, limit, authorization, auth, marketId, cursor, observableOptions);
        return result.toPromise();
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
    public liquidations(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, _options?: PromiseConfigurationOptions): Promise<LiquidationInfos> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.liquidations(accountIndex, limit, authorization, auth, marketId, cursor, observableOptions);
        return result.toPromise();
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
    public pnlWithHttpInfo(by: 'index', value: string, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, authorization?: string, auth?: string, ignoreTransfers?: boolean, _options?: PromiseConfigurationOptions): Promise<HttpInfo<AccountPnL>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.pnlWithHttpInfo(by, value, resolution, startTimestamp, endTimestamp, countBack, authorization, auth, ignoreTransfers, observableOptions);
        return result.toPromise();
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
    public pnl(by: 'index', value: string, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, authorization?: string, auth?: string, ignoreTransfers?: boolean, _options?: PromiseConfigurationOptions): Promise<AccountPnL> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.pnl(by, value, resolution, startTimestamp, endTimestamp, countBack, authorization, auth, ignoreTransfers, observableOptions);
        return result.toPromise();
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
    public positionFundingWithHttpInfo(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, side?: 'long' | 'short' | 'all', _options?: PromiseConfigurationOptions): Promise<HttpInfo<PositionFundings>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.positionFundingWithHttpInfo(accountIndex, limit, authorization, auth, marketId, cursor, side, observableOptions);
        return result.toPromise();
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
    public positionFunding(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, side?: 'long' | 'short' | 'all', _options?: PromiseConfigurationOptions): Promise<PositionFundings> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.positionFunding(accountIndex, limit, authorization, auth, marketId, cursor, side, observableOptions);
        return result.toPromise();
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
    public publicPoolsWithHttpInfo(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PublicPools>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.publicPoolsWithHttpInfo(index, limit, authorization, auth, filter, accountIndex, observableOptions);
        return result.toPromise();
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
    public publicPools(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: PromiseConfigurationOptions): Promise<PublicPools> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.publicPools(index, limit, authorization, auth, filter, accountIndex, observableOptions);
        return result.toPromise();
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
    public publicPoolsMetadataWithHttpInfo(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<RespPublicPoolsMetadata>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.publicPoolsMetadataWithHttpInfo(index, limit, authorization, auth, filter, accountIndex, observableOptions);
        return result.toPromise();
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
    public publicPoolsMetadata(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: PromiseConfigurationOptions): Promise<RespPublicPoolsMetadata> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.publicPoolsMetadata(index, limit, authorization, auth, filter, accountIndex, observableOptions);
        return result.toPromise();
    }


}



import { ObservableAnnouncementApi } from './ObservableAPI';

import { AnnouncementApiRequestFactory, AnnouncementApiResponseProcessor} from "../apis/AnnouncementApi";
export class PromiseAnnouncementApi {
    private api: ObservableAnnouncementApi

    public constructor(
        configuration: Configuration,
        requestFactory?: AnnouncementApiRequestFactory,
        responseProcessor?: AnnouncementApiResponseProcessor
    ) {
        this.api = new ObservableAnnouncementApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get announcement
     * announcement
     */
    public announcementWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Announcements>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.announcementWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get announcement
     * announcement
     */
    public announcement(_options?: PromiseConfigurationOptions): Promise<Announcements> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.announcement(observableOptions);
        return result.toPromise();
    }


}



import { ObservableBlockApi } from './ObservableAPI';

import { BlockApiRequestFactory, BlockApiResponseProcessor} from "../apis/BlockApi";
export class PromiseBlockApi {
    private api: ObservableBlockApi

    public constructor(
        configuration: Configuration,
        requestFactory?: BlockApiRequestFactory,
        responseProcessor?: BlockApiResponseProcessor
    ) {
        this.api = new ObservableBlockApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get block by its height or commitment
     * block
     * @param by
     * @param value
     */
    public blockWithHttpInfo(by: 'commitment' | 'height', value: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Blocks>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.blockWithHttpInfo(by, value, observableOptions);
        return result.toPromise();
    }

    /**
     * Get block by its height or commitment
     * block
     * @param by
     * @param value
     */
    public block(by: 'commitment' | 'height', value: string, _options?: PromiseConfigurationOptions): Promise<Blocks> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.block(by, value, observableOptions);
        return result.toPromise();
    }

    /**
     * Get blocks
     * blocks
     * @param limit
     * @param [index]
     * @param [sort]
     */
    public blocksWithHttpInfo(limit: number, index?: number, sort?: 'asc' | 'desc', _options?: PromiseConfigurationOptions): Promise<HttpInfo<Blocks>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.blocksWithHttpInfo(limit, index, sort, observableOptions);
        return result.toPromise();
    }

    /**
     * Get blocks
     * blocks
     * @param limit
     * @param [index]
     * @param [sort]
     */
    public blocks(limit: number, index?: number, sort?: 'asc' | 'desc', _options?: PromiseConfigurationOptions): Promise<Blocks> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.blocks(limit, index, sort, observableOptions);
        return result.toPromise();
    }

    /**
     * Get current height
     * currentHeight
     */
    public currentHeightWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<CurrentHeight>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.currentHeightWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get current height
     * currentHeight
     */
    public currentHeight(_options?: PromiseConfigurationOptions): Promise<CurrentHeight> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.currentHeight(observableOptions);
        return result.toPromise();
    }


}



import { ObservableBridgeApi } from './ObservableAPI';

import { BridgeApiRequestFactory, BridgeApiResponseProcessor} from "../apis/BridgeApi";
export class PromiseBridgeApi {
    private api: ObservableBridgeApi

    public constructor(
        configuration: Configuration,
        requestFactory?: BridgeApiRequestFactory,
        responseProcessor?: BridgeApiResponseProcessor
    ) {
        this.api = new ObservableBridgeApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get fast bridge info
     * fastbridge_info
     */
    public fastbridgeInfoWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<RespGetFastBridgeInfo>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.fastbridgeInfoWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get fast bridge info
     * fastbridge_info
     */
    public fastbridgeInfo(_options?: PromiseConfigurationOptions): Promise<RespGetFastBridgeInfo> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.fastbridgeInfo(observableOptions);
        return result.toPromise();
    }


}



import { ObservableCandlestickApi } from './ObservableAPI';

import { CandlestickApiRequestFactory, CandlestickApiResponseProcessor} from "../apis/CandlestickApi";
export class PromiseCandlestickApi {
    private api: ObservableCandlestickApi

    public constructor(
        configuration: Configuration,
        requestFactory?: CandlestickApiRequestFactory,
        responseProcessor?: CandlestickApiResponseProcessor
    ) {
        this.api = new ObservableCandlestickApi(configuration, requestFactory, responseProcessor);
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
    public candlesticksWithHttpInfo(marketId: number, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, setTimestampToEnd?: boolean, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Candlesticks>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.candlesticksWithHttpInfo(marketId, resolution, startTimestamp, endTimestamp, countBack, setTimestampToEnd, observableOptions);
        return result.toPromise();
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
    public candlesticks(marketId: number, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, setTimestampToEnd?: boolean, _options?: PromiseConfigurationOptions): Promise<Candlesticks> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.candlesticks(marketId, resolution, startTimestamp, endTimestamp, countBack, setTimestampToEnd, observableOptions);
        return result.toPromise();
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
    public fundingsWithHttpInfo(marketId: number, resolution: '1h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Fundings>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.fundingsWithHttpInfo(marketId, resolution, startTimestamp, endTimestamp, countBack, observableOptions);
        return result.toPromise();
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
    public fundings(marketId: number, resolution: '1h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, _options?: PromiseConfigurationOptions): Promise<Fundings> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.fundings(marketId, resolution, startTimestamp, endTimestamp, countBack, observableOptions);
        return result.toPromise();
    }


}



import { ObservableFundingApi } from './ObservableAPI';

import { FundingApiRequestFactory, FundingApiResponseProcessor} from "../apis/FundingApi";
export class PromiseFundingApi {
    private api: ObservableFundingApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FundingApiRequestFactory,
        responseProcessor?: FundingApiResponseProcessor
    ) {
        this.api = new ObservableFundingApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get funding rates
     * funding-rates
     */
    public fundingRatesWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<FundingRates>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.fundingRatesWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get funding rates
     * funding-rates
     */
    public fundingRates(_options?: PromiseConfigurationOptions): Promise<FundingRates> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.fundingRates(observableOptions);
        return result.toPromise();
    }


}



import { ObservableInfoApi } from './ObservableAPI';

import { InfoApiRequestFactory, InfoApiResponseProcessor} from "../apis/InfoApi";
export class PromiseInfoApi {
    private api: ObservableInfoApi

    public constructor(
        configuration: Configuration,
        requestFactory?: InfoApiRequestFactory,
        responseProcessor?: InfoApiResponseProcessor
    ) {
        this.api = new ObservableInfoApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Transfer fee info
     * transferFeeInfo
     * @param accountIndex
     * @param [authorization]
     * @param [auth]
     * @param [toAccountIndex]
     */
    public transferFeeInfoWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, toAccountIndex?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<TransferFeeInfo>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.transferFeeInfoWithHttpInfo(accountIndex, authorization, auth, toAccountIndex, observableOptions);
        return result.toPromise();
    }

    /**
     * Transfer fee info
     * transferFeeInfo
     * @param accountIndex
     * @param [authorization]
     * @param [auth]
     * @param [toAccountIndex]
     */
    public transferFeeInfo(accountIndex: number, authorization?: string, auth?: string, toAccountIndex?: number, _options?: PromiseConfigurationOptions): Promise<TransferFeeInfo> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.transferFeeInfo(accountIndex, authorization, auth, toAccountIndex, observableOptions);
        return result.toPromise();
    }

    /**
     * Withdrawal delay in seconds
     * withdrawalDelay
     */
    public withdrawalDelayWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<RespWithdrawalDelay>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.withdrawalDelayWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Withdrawal delay in seconds
     * withdrawalDelay
     */
    public withdrawalDelay(_options?: PromiseConfigurationOptions): Promise<RespWithdrawalDelay> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.withdrawalDelay(observableOptions);
        return result.toPromise();
    }


}



import { ObservableNotificationApi } from './ObservableAPI';

import { NotificationApiRequestFactory, NotificationApiResponseProcessor} from "../apis/NotificationApi";
export class PromiseNotificationApi {
    private api: ObservableNotificationApi

    public constructor(
        configuration: Configuration,
        requestFactory?: NotificationApiRequestFactory,
        responseProcessor?: NotificationApiResponseProcessor
    ) {
        this.api = new ObservableNotificationApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Ack notification
     * notification_ack
     * @param notifId
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public notificationAckWithHttpInfo(notifId: string, accountIndex: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ResultCode>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.notificationAckWithHttpInfo(notifId, accountIndex, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Ack notification
     * notification_ack
     * @param notifId
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public notificationAck(notifId: string, accountIndex: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<ResultCode> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.notificationAck(notifId, accountIndex, authorization, auth, observableOptions);
        return result.toPromise();
    }


}



import { ObservableOrderApi } from './ObservableAPI';

import { OrderApiRequestFactory, OrderApiResponseProcessor} from "../apis/OrderApi";
export class PromiseOrderApi {
    private api: ObservableOrderApi

    public constructor(
        configuration: Configuration,
        requestFactory?: OrderApiRequestFactory,
        responseProcessor?: OrderApiResponseProcessor
    ) {
        this.api = new ObservableOrderApi(configuration, requestFactory, responseProcessor);
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
    public _exportWithHttpInfo(type: 'funding' | 'trade', authorization?: string, auth?: string, accountIndex?: number, marketId?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ExportData>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api._exportWithHttpInfo(type, authorization, auth, accountIndex, marketId, observableOptions);
        return result.toPromise();
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
    public _export(type: 'funding' | 'trade', authorization?: string, auth?: string, accountIndex?: number, marketId?: number, _options?: PromiseConfigurationOptions): Promise<ExportData> {
        const observableOptions = wrapOptions(_options);
        const result = this.api._export(type, authorization, auth, accountIndex, marketId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account active orders. `auth` can be generated using the SDK.
     * accountActiveOrders
     * @param accountIndex
     * @param marketId
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountActiveOrdersWithHttpInfo(accountIndex: number, marketId: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Orders>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountActiveOrdersWithHttpInfo(accountIndex, marketId, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get account active orders. `auth` can be generated using the SDK.
     * accountActiveOrders
     * @param accountIndex
     * @param marketId
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public accountActiveOrders(accountIndex: number, marketId: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<Orders> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountActiveOrders(accountIndex, marketId, authorization, auth, observableOptions);
        return result.toPromise();
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
    public accountInactiveOrdersWithHttpInfo(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, askFilter?: number, betweenTimestamps?: string, cursor?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Orders>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountInactiveOrdersWithHttpInfo(accountIndex, limit, authorization, auth, marketId, askFilter, betweenTimestamps, cursor, observableOptions);
        return result.toPromise();
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
    public accountInactiveOrders(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, askFilter?: number, betweenTimestamps?: string, cursor?: string, _options?: PromiseConfigurationOptions): Promise<Orders> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountInactiveOrders(accountIndex, limit, authorization, auth, marketId, askFilter, betweenTimestamps, cursor, observableOptions);
        return result.toPromise();
    }

    /**
     * Get exchange stats
     * exchangeStats
     */
    public exchangeStatsWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<ExchangeStats>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.exchangeStatsWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get exchange stats
     * exchangeStats
     */
    public exchangeStats(_options?: PromiseConfigurationOptions): Promise<ExchangeStats> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.exchangeStats(observableOptions);
        return result.toPromise();
    }

    /**
     * Get order books metadata
     * orderBookDetails
     * @param [marketId]
     */
    public orderBookDetailsWithHttpInfo(marketId?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<OrderBookDetails>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.orderBookDetailsWithHttpInfo(marketId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get order books metadata
     * orderBookDetails
     * @param [marketId]
     */
    public orderBookDetails(marketId?: number, _options?: PromiseConfigurationOptions): Promise<OrderBookDetails> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.orderBookDetails(marketId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get order book orders
     * orderBookOrders
     * @param marketId
     * @param limit
     */
    public orderBookOrdersWithHttpInfo(marketId: number, limit: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<OrderBookOrders>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.orderBookOrdersWithHttpInfo(marketId, limit, observableOptions);
        return result.toPromise();
    }

    /**
     * Get order book orders
     * orderBookOrders
     * @param marketId
     * @param limit
     */
    public orderBookOrders(marketId: number, limit: number, _options?: PromiseConfigurationOptions): Promise<OrderBookOrders> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.orderBookOrders(marketId, limit, observableOptions);
        return result.toPromise();
    }

    /**
     * Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.
     * orderBooks
     * @param [marketId]
     */
    public orderBooksWithHttpInfo(marketId?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<OrderBooks>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.orderBooksWithHttpInfo(marketId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.
     * orderBooks
     * @param [marketId]
     */
    public orderBooks(marketId?: number, _options?: PromiseConfigurationOptions): Promise<OrderBooks> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.orderBooks(marketId, observableOptions);
        return result.toPromise();
    }

    /**
     * Get recent trades
     * recentTrades
     * @param marketId
     * @param limit
     */
    public recentTradesWithHttpInfo(marketId: number, limit: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Trades>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.recentTradesWithHttpInfo(marketId, limit, observableOptions);
        return result.toPromise();
    }

    /**
     * Get recent trades
     * recentTrades
     * @param marketId
     * @param limit
     */
    public recentTrades(marketId: number, limit: number, _options?: PromiseConfigurationOptions): Promise<Trades> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.recentTrades(marketId, limit, observableOptions);
        return result.toPromise();
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
    public tradesWithHttpInfo(sortBy: 'block_height' | 'timestamp' | 'trade_id', limit: number, authorization?: string, auth?: string, marketId?: number, accountIndex?: number, orderIndex?: number, sortDir?: 'desc', cursor?: string, _from?: number, askFilter?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Trades>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.tradesWithHttpInfo(sortBy, limit, authorization, auth, marketId, accountIndex, orderIndex, sortDir, cursor, _from, askFilter, observableOptions);
        return result.toPromise();
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
    public trades(sortBy: 'block_height' | 'timestamp' | 'trade_id', limit: number, authorization?: string, auth?: string, marketId?: number, accountIndex?: number, orderIndex?: number, sortDir?: 'desc', cursor?: string, _from?: number, askFilter?: number, _options?: PromiseConfigurationOptions): Promise<Trades> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.trades(sortBy, limit, authorization, auth, marketId, accountIndex, orderIndex, sortDir, cursor, _from, askFilter, observableOptions);
        return result.toPromise();
    }


}



import { ObservableReferralApi } from './ObservableAPI';

import { ReferralApiRequestFactory, ReferralApiResponseProcessor} from "../apis/ReferralApi";
export class PromiseReferralApi {
    private api: ObservableReferralApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ReferralApiRequestFactory,
        responseProcessor?: ReferralApiResponseProcessor
    ) {
        this.api = new ObservableReferralApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get referral points
     * referral_points
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public referralPointsWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ReferralPoints>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.referralPointsWithHttpInfo(accountIndex, authorization, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get referral points
     * referral_points
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     */
    public referralPoints(accountIndex: number, authorization?: string, auth?: string, _options?: PromiseConfigurationOptions): Promise<ReferralPoints> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.referralPoints(accountIndex, authorization, auth, observableOptions);
        return result.toPromise();
    }


}



import { ObservableRootApi } from './ObservableAPI';

import { RootApiRequestFactory, RootApiResponseProcessor} from "../apis/RootApi";
export class PromiseRootApi {
    private api: ObservableRootApi

    public constructor(
        configuration: Configuration,
        requestFactory?: RootApiRequestFactory,
        responseProcessor?: RootApiResponseProcessor
    ) {
        this.api = new ObservableRootApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get info of zklighter
     * info
     */
    public infoWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<ZkLighterInfo>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.infoWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get info of zklighter
     * info
     */
    public info(_options?: PromiseConfigurationOptions): Promise<ZkLighterInfo> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.info(observableOptions);
        return result.toPromise();
    }

    /**
     * Get status of zklighter
     * status
     */
    public statusWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Status>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.statusWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Get status of zklighter
     * status
     */
    public status(_options?: PromiseConfigurationOptions): Promise<Status> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.status(observableOptions);
        return result.toPromise();
    }


}



import { ObservableTransactionApi } from './ObservableAPI';

import { TransactionApiRequestFactory, TransactionApiResponseProcessor} from "../apis/TransactionApi";
export class PromiseTransactionApi {
    private api: ObservableTransactionApi

    public constructor(
        configuration: Configuration,
        requestFactory?: TransactionApiRequestFactory,
        responseProcessor?: TransactionApiResponseProcessor
    ) {
        this.api = new ObservableTransactionApi(configuration, requestFactory, responseProcessor);
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
    public accountTxsWithHttpInfo(limit: number, by: 'account_index', value: string, authorization?: string, index?: number, types?: Array<number>, auth?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Txs>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountTxsWithHttpInfo(limit, by, value, authorization, index, types, auth, observableOptions);
        return result.toPromise();
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
    public accountTxs(limit: number, by: 'account_index', value: string, authorization?: string, index?: number, types?: Array<number>, auth?: string, _options?: PromiseConfigurationOptions): Promise<Txs> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.accountTxs(limit, by, value, authorization, index, types, auth, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transactions in a block
     * blockTxs
     * @param by
     * @param value
     */
    public blockTxsWithHttpInfo(by: 'block_height' | 'block_commitment', value: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Txs>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.blockTxsWithHttpInfo(by, value, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transactions in a block
     * blockTxs
     * @param by
     * @param value
     */
    public blockTxs(by: 'block_height' | 'block_commitment', value: string, _options?: PromiseConfigurationOptions): Promise<Txs> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.blockTxs(by, value, observableOptions);
        return result.toPromise();
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
    public depositHistoryWithHttpInfo(accountIndex: number, l1Address: string, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: PromiseConfigurationOptions): Promise<HttpInfo<DepositHistory>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.depositHistoryWithHttpInfo(accountIndex, l1Address, authorization, auth, cursor, filter, observableOptions);
        return result.toPromise();
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
    public depositHistory(accountIndex: number, l1Address: string, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: PromiseConfigurationOptions): Promise<DepositHistory> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.depositHistory(accountIndex, l1Address, authorization, auth, cursor, filter, observableOptions);
        return result.toPromise();
    }

    /**
     * Get next nonce for a specific account and api key
     * nextNonce
     * @param accountIndex
     * @param apiKeyIndex
     */
    public nextNonceWithHttpInfo(accountIndex: number, apiKeyIndex: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<NextNonce>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.nextNonceWithHttpInfo(accountIndex, apiKeyIndex, observableOptions);
        return result.toPromise();
    }

    /**
     * Get next nonce for a specific account and api key
     * nextNonce
     * @param accountIndex
     * @param apiKeyIndex
     */
    public nextNonce(accountIndex: number, apiKeyIndex: number, _options?: PromiseConfigurationOptions): Promise<NextNonce> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.nextNonce(accountIndex, apiKeyIndex, observableOptions);
        return result.toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTx
     * @param txType
     * @param txInfo
     * @param [priceProtection]
     */
    public sendTxWithHttpInfo(txType: number, txInfo: string, priceProtection?: boolean, _options?: PromiseConfigurationOptions): Promise<HttpInfo<RespSendTx>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.sendTxWithHttpInfo(txType, txInfo, priceProtection, observableOptions);
        return result.toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTx
     * @param txType
     * @param txInfo
     * @param [priceProtection]
     */
    public sendTx(txType: number, txInfo: string, priceProtection?: boolean, _options?: PromiseConfigurationOptions): Promise<RespSendTx> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.sendTx(txType, txInfo, priceProtection, observableOptions);
        return result.toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTxBatch
     * @param txTypes
     * @param txInfos
     */
    public sendTxBatchWithHttpInfo(txTypes: string, txInfos: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<RespSendTxBatch>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.sendTxBatchWithHttpInfo(txTypes, txInfos, observableOptions);
        return result.toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTxBatch
     * @param txTypes
     * @param txInfos
     */
    public sendTxBatch(txTypes: string, txInfos: string, _options?: PromiseConfigurationOptions): Promise<RespSendTxBatch> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.sendTxBatch(txTypes, txInfos, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transfer history
     * transfer_history
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     */
    public transferHistoryWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, cursor?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<TransferHistory>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.transferHistoryWithHttpInfo(accountIndex, authorization, auth, cursor, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transfer history
     * transfer_history
     * @param accountIndex
     * @param [authorization]  make required after integ is done
     * @param [auth]  made optional to support header auth clients
     * @param [cursor]
     */
    public transferHistory(accountIndex: number, authorization?: string, auth?: string, cursor?: string, _options?: PromiseConfigurationOptions): Promise<TransferHistory> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.transferHistory(accountIndex, authorization, auth, cursor, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transaction by hash or sequence index
     * tx
     * @param by
     * @param value
     */
    public txWithHttpInfo(by: 'hash' | 'sequence_index', value: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<EnrichedTx>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.txWithHttpInfo(by, value, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transaction by hash or sequence index
     * tx
     * @param by
     * @param value
     */
    public tx(by: 'hash' | 'sequence_index', value: string, _options?: PromiseConfigurationOptions): Promise<EnrichedTx> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.tx(by, value, observableOptions);
        return result.toPromise();
    }

    /**
     * Get L1 transaction by L1 transaction hash
     * txFromL1TxHash
     * @param hash
     */
    public txFromL1TxHashWithHttpInfo(hash: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<EnrichedTx>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.txFromL1TxHashWithHttpInfo(hash, observableOptions);
        return result.toPromise();
    }

    /**
     * Get L1 transaction by L1 transaction hash
     * txFromL1TxHash
     * @param hash
     */
    public txFromL1TxHash(hash: string, _options?: PromiseConfigurationOptions): Promise<EnrichedTx> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.txFromL1TxHash(hash, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transactions which are already packed into blocks
     * txs
     * @param limit
     * @param [index]
     */
    public txsWithHttpInfo(limit: number, index?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Txs>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.txsWithHttpInfo(limit, index, observableOptions);
        return result.toPromise();
    }

    /**
     * Get transactions which are already packed into blocks
     * txs
     * @param limit
     * @param [index]
     */
    public txs(limit: number, index?: number, _options?: PromiseConfigurationOptions): Promise<Txs> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.txs(limit, index, observableOptions);
        return result.toPromise();
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
    public withdrawHistoryWithHttpInfo(accountIndex: number, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: PromiseConfigurationOptions): Promise<HttpInfo<WithdrawHistory>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.withdrawHistoryWithHttpInfo(accountIndex, authorization, auth, cursor, filter, observableOptions);
        return result.toPromise();
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
    public withdrawHistory(accountIndex: number, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: PromiseConfigurationOptions): Promise<WithdrawHistory> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.withdrawHistory(accountIndex, authorization, auth, cursor, filter, observableOptions);
        return result.toPromise();
    }


}



