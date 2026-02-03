import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions } from '../configuration'
import type { Middleware } from '../middleware';

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

import { ObservableAccountApi } from "./ObservableAPI";
import { AccountApiRequestFactory, AccountApiResponseProcessor} from "../apis/AccountApi";

export interface AccountApiAccountRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;index&#39; | &#39;l1_address&#39;
     * @memberof AccountApiaccount
     */
    by: 'index' | 'l1_address'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiaccount
     */
    value: string
}

export interface AccountApiAccountLimitsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApiaccountLimits
     */
    accountIndex: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiaccountLimits
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiaccountLimits
     */
    auth?: string
}

export interface AccountApiAccountMetadataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;index&#39; | &#39;l1_address&#39;
     * @memberof AccountApiaccountMetadata
     */
    by: 'index' | 'l1_address'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiaccountMetadata
     */
    value: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiaccountMetadata
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiaccountMetadata
     */
    auth?: string
}

export interface AccountApiAccountsByL1AddressRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiaccountsByL1Address
     */
    l1Address: string
}

export interface AccountApiApikeysRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApiapikeys
     */
    accountIndex: number
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof AccountApiapikeys
     */
    apiKeyIndex?: number
}

export interface AccountApiChangeAccountTierRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApichangeAccountTier
     */
    accountIndex: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApichangeAccountTier
     */
    newTier: string
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof AccountApichangeAccountTier
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof AccountApichangeAccountTier
     */
    auth?: string
}

export interface AccountApiL1MetadataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApil1Metadata
     */
    l1Address: string
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof AccountApil1Metadata
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof AccountApil1Metadata
     */
    auth?: string
}

export interface AccountApiLiquidationsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApiliquidations
     */
    accountIndex: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof AccountApiliquidations
     */
    limit: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiliquidations
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiliquidations
     */
    auth?: string
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof AccountApiliquidations
     */
    marketId?: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApiliquidations
     */
    cursor?: string
}

export interface AccountApiPnlRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;index&#39;
     * @memberof AccountApipnl
     */
    by: 'index'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipnl
     */
    value: string
    /**
     * 
     * Defaults to: undefined
     * @type &#39;1m&#39; | &#39;5m&#39; | &#39;15m&#39; | &#39;1h&#39; | &#39;4h&#39; | &#39;1d&#39;
     * @memberof AccountApipnl
     */
    resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
    /**
     * 
     * Minimum: 0
     * Maximum: 5000000000000
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipnl
     */
    startTimestamp: number
    /**
     * 
     * Minimum: 0
     * Maximum: 5000000000000
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipnl
     */
    endTimestamp: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipnl
     */
    countBack: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipnl
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipnl
     */
    auth?: string
    /**
     * 
     * Defaults to: false
     * @type boolean
     * @memberof AccountApipnl
     */
    ignoreTransfers?: boolean
}

export interface AccountApiPositionFundingRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipositionFunding
     */
    accountIndex: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipositionFunding
     */
    limit: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipositionFunding
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipositionFunding
     */
    auth?: string
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof AccountApipositionFunding
     */
    marketId?: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipositionFunding
     */
    cursor?: string
    /**
     * 
     * Defaults to: &#39;all&#39;
     * @type &#39;long&#39; | &#39;short&#39; | &#39;all&#39;
     * @memberof AccountApipositionFunding
     */
    side?: 'long' | 'short' | 'all'
}

export interface AccountApiPublicPoolsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipublicPools
     */
    index: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipublicPools
     */
    limit: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipublicPools
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipublicPools
     */
    auth?: string
    /**
     * 
     * Defaults to: undefined
     * @type &#39;all&#39; | &#39;user&#39; | &#39;protocol&#39; | &#39;account_index&#39;
     * @memberof AccountApipublicPools
     */
    filter?: 'all' | 'user' | 'protocol' | 'account_index'
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipublicPools
     */
    accountIndex?: number
}

export interface AccountApiPublicPoolsMetadataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipublicPoolsMetadata
     */
    index: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipublicPoolsMetadata
     */
    limit: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipublicPoolsMetadata
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AccountApipublicPoolsMetadata
     */
    auth?: string
    /**
     * 
     * Defaults to: undefined
     * @type &#39;all&#39; | &#39;user&#39; | &#39;protocol&#39; | &#39;account_index&#39;
     * @memberof AccountApipublicPoolsMetadata
     */
    filter?: 'all' | 'user' | 'protocol' | 'account_index'
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof AccountApipublicPoolsMetadata
     */
    accountIndex?: number
}

export class ObjectAccountApi {
    private api: ObservableAccountApi

    public constructor(configuration: Configuration, requestFactory?: AccountApiRequestFactory, responseProcessor?: AccountApiResponseProcessor) {
        this.api = new ObservableAccountApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.
     * account
     * @param param the request object
     */
    public accountWithHttpInfo(param: AccountApiAccountRequest, options?: ConfigurationOptions): Promise<HttpInfo<DetailedAccounts>> {
        return this.api.accountWithHttpInfo(param.by, param.value,  options).toPromise();
    }

    /**
     * Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.
     * account
     * @param param the request object
     */
    public account(param: AccountApiAccountRequest, options?: ConfigurationOptions): Promise<DetailedAccounts> {
        return this.api.account(param.by, param.value,  options).toPromise();
    }

    /**
     * Get account limits
     * accountLimits
     * @param param the request object
     */
    public accountLimitsWithHttpInfo(param: AccountApiAccountLimitsRequest, options?: ConfigurationOptions): Promise<HttpInfo<AccountLimits>> {
        return this.api.accountLimitsWithHttpInfo(param.accountIndex, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get account limits
     * accountLimits
     * @param param the request object
     */
    public accountLimits(param: AccountApiAccountLimitsRequest, options?: ConfigurationOptions): Promise<AccountLimits> {
        return this.api.accountLimits(param.accountIndex, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get account metadatas
     * accountMetadata
     * @param param the request object
     */
    public accountMetadataWithHttpInfo(param: AccountApiAccountMetadataRequest, options?: ConfigurationOptions): Promise<HttpInfo<AccountMetadatas>> {
        return this.api.accountMetadataWithHttpInfo(param.by, param.value, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get account metadatas
     * accountMetadata
     * @param param the request object
     */
    public accountMetadata(param: AccountApiAccountMetadataRequest, options?: ConfigurationOptions): Promise<AccountMetadatas> {
        return this.api.accountMetadata(param.by, param.value, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get accounts by l1_address returns all accounts associated with the given L1 address
     * accountsByL1Address
     * @param param the request object
     */
    public accountsByL1AddressWithHttpInfo(param: AccountApiAccountsByL1AddressRequest, options?: ConfigurationOptions): Promise<HttpInfo<SubAccounts>> {
        return this.api.accountsByL1AddressWithHttpInfo(param.l1Address,  options).toPromise();
    }

    /**
     * Get accounts by l1_address returns all accounts associated with the given L1 address
     * accountsByL1Address
     * @param param the request object
     */
    public accountsByL1Address(param: AccountApiAccountsByL1AddressRequest, options?: ConfigurationOptions): Promise<SubAccounts> {
        return this.api.accountsByL1Address(param.l1Address,  options).toPromise();
    }

    /**
     * Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.
     * apikeys
     * @param param the request object
     */
    public apikeysWithHttpInfo(param: AccountApiApikeysRequest, options?: ConfigurationOptions): Promise<HttpInfo<AccountApiKeys>> {
        return this.api.apikeysWithHttpInfo(param.accountIndex, param.apiKeyIndex,  options).toPromise();
    }

    /**
     * Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.
     * apikeys
     * @param param the request object
     */
    public apikeys(param: AccountApiApikeysRequest, options?: ConfigurationOptions): Promise<AccountApiKeys> {
        return this.api.apikeys(param.accountIndex, param.apiKeyIndex,  options).toPromise();
    }

    /**
     * Change account tier
     * changeAccountTier
     * @param param the request object
     */
    public changeAccountTierWithHttpInfo(param: AccountApiChangeAccountTierRequest, options?: ConfigurationOptions): Promise<HttpInfo<RespChangeAccountTier>> {
        return this.api.changeAccountTierWithHttpInfo(param.accountIndex, param.newTier, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Change account tier
     * changeAccountTier
     * @param param the request object
     */
    public changeAccountTier(param: AccountApiChangeAccountTierRequest, options?: ConfigurationOptions): Promise<RespChangeAccountTier> {
        return this.api.changeAccountTier(param.accountIndex, param.newTier, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get L1 metadata
     * l1Metadata
     * @param param the request object
     */
    public l1MetadataWithHttpInfo(param: AccountApiL1MetadataRequest, options?: ConfigurationOptions): Promise<HttpInfo<L1Metadata>> {
        return this.api.l1MetadataWithHttpInfo(param.l1Address, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get L1 metadata
     * l1Metadata
     * @param param the request object
     */
    public l1Metadata(param: AccountApiL1MetadataRequest, options?: ConfigurationOptions): Promise<L1Metadata> {
        return this.api.l1Metadata(param.l1Address, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get liquidation infos
     * liquidations
     * @param param the request object
     */
    public liquidationsWithHttpInfo(param: AccountApiLiquidationsRequest, options?: ConfigurationOptions): Promise<HttpInfo<LiquidationInfos>> {
        return this.api.liquidationsWithHttpInfo(param.accountIndex, param.limit, param.authorization, param.auth, param.marketId, param.cursor,  options).toPromise();
    }

    /**
     * Get liquidation infos
     * liquidations
     * @param param the request object
     */
    public liquidations(param: AccountApiLiquidationsRequest, options?: ConfigurationOptions): Promise<LiquidationInfos> {
        return this.api.liquidations(param.accountIndex, param.limit, param.authorization, param.auth, param.marketId, param.cursor,  options).toPromise();
    }

    /**
     * Get account PnL chart
     * pnl
     * @param param the request object
     */
    public pnlWithHttpInfo(param: AccountApiPnlRequest, options?: ConfigurationOptions): Promise<HttpInfo<AccountPnL>> {
        return this.api.pnlWithHttpInfo(param.by, param.value, param.resolution, param.startTimestamp, param.endTimestamp, param.countBack, param.authorization, param.auth, param.ignoreTransfers,  options).toPromise();
    }

    /**
     * Get account PnL chart
     * pnl
     * @param param the request object
     */
    public pnl(param: AccountApiPnlRequest, options?: ConfigurationOptions): Promise<AccountPnL> {
        return this.api.pnl(param.by, param.value, param.resolution, param.startTimestamp, param.endTimestamp, param.countBack, param.authorization, param.auth, param.ignoreTransfers,  options).toPromise();
    }

    /**
     * Get accounts position fundings
     * positionFunding
     * @param param the request object
     */
    public positionFundingWithHttpInfo(param: AccountApiPositionFundingRequest, options?: ConfigurationOptions): Promise<HttpInfo<PositionFundings>> {
        return this.api.positionFundingWithHttpInfo(param.accountIndex, param.limit, param.authorization, param.auth, param.marketId, param.cursor, param.side,  options).toPromise();
    }

    /**
     * Get accounts position fundings
     * positionFunding
     * @param param the request object
     */
    public positionFunding(param: AccountApiPositionFundingRequest, options?: ConfigurationOptions): Promise<PositionFundings> {
        return this.api.positionFunding(param.accountIndex, param.limit, param.authorization, param.auth, param.marketId, param.cursor, param.side,  options).toPromise();
    }

    /**
     * Get public pools
     * publicPools
     * @param param the request object
     */
    public publicPoolsWithHttpInfo(param: AccountApiPublicPoolsRequest, options?: ConfigurationOptions): Promise<HttpInfo<PublicPools>> {
        return this.api.publicPoolsWithHttpInfo(param.index, param.limit, param.authorization, param.auth, param.filter, param.accountIndex,  options).toPromise();
    }

    /**
     * Get public pools
     * publicPools
     * @param param the request object
     */
    public publicPools(param: AccountApiPublicPoolsRequest, options?: ConfigurationOptions): Promise<PublicPools> {
        return this.api.publicPools(param.index, param.limit, param.authorization, param.auth, param.filter, param.accountIndex,  options).toPromise();
    }

    /**
     * Get public pools metadata
     * publicPoolsMetadata
     * @param param the request object
     */
    public publicPoolsMetadataWithHttpInfo(param: AccountApiPublicPoolsMetadataRequest, options?: ConfigurationOptions): Promise<HttpInfo<RespPublicPoolsMetadata>> {
        return this.api.publicPoolsMetadataWithHttpInfo(param.index, param.limit, param.authorization, param.auth, param.filter, param.accountIndex,  options).toPromise();
    }

    /**
     * Get public pools metadata
     * publicPoolsMetadata
     * @param param the request object
     */
    public publicPoolsMetadata(param: AccountApiPublicPoolsMetadataRequest, options?: ConfigurationOptions): Promise<RespPublicPoolsMetadata> {
        return this.api.publicPoolsMetadata(param.index, param.limit, param.authorization, param.auth, param.filter, param.accountIndex,  options).toPromise();
    }

}

import { ObservableAnnouncementApi } from "./ObservableAPI";
import { AnnouncementApiRequestFactory, AnnouncementApiResponseProcessor} from "../apis/AnnouncementApi";

export interface AnnouncementApiAnnouncementRequest {
}

export class ObjectAnnouncementApi {
    private api: ObservableAnnouncementApi

    public constructor(configuration: Configuration, requestFactory?: AnnouncementApiRequestFactory, responseProcessor?: AnnouncementApiResponseProcessor) {
        this.api = new ObservableAnnouncementApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get announcement
     * announcement
     * @param param the request object
     */
    public announcementWithHttpInfo(param: AnnouncementApiAnnouncementRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Announcements>> {
        return this.api.announcementWithHttpInfo( options).toPromise();
    }

    /**
     * Get announcement
     * announcement
     * @param param the request object
     */
    public announcement(param: AnnouncementApiAnnouncementRequest = {}, options?: ConfigurationOptions): Promise<Announcements> {
        return this.api.announcement( options).toPromise();
    }

}

import { ObservableBlockApi } from "./ObservableAPI";
import { BlockApiRequestFactory, BlockApiResponseProcessor} from "../apis/BlockApi";

export interface BlockApiBlockRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;commitment&#39; | &#39;height&#39;
     * @memberof BlockApiblock
     */
    by: 'commitment' | 'height'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof BlockApiblock
     */
    value: string
}

export interface BlockApiBlocksRequest {
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof BlockApiblocks
     */
    limit: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof BlockApiblocks
     */
    index?: number
    /**
     * 
     * Defaults to: &#39;asc&#39;
     * @type &#39;asc&#39; | &#39;desc&#39;
     * @memberof BlockApiblocks
     */
    sort?: 'asc' | 'desc'
}

export interface BlockApiCurrentHeightRequest {
}

export class ObjectBlockApi {
    private api: ObservableBlockApi

    public constructor(configuration: Configuration, requestFactory?: BlockApiRequestFactory, responseProcessor?: BlockApiResponseProcessor) {
        this.api = new ObservableBlockApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get block by its height or commitment
     * block
     * @param param the request object
     */
    public blockWithHttpInfo(param: BlockApiBlockRequest, options?: ConfigurationOptions): Promise<HttpInfo<Blocks>> {
        return this.api.blockWithHttpInfo(param.by, param.value,  options).toPromise();
    }

    /**
     * Get block by its height or commitment
     * block
     * @param param the request object
     */
    public block(param: BlockApiBlockRequest, options?: ConfigurationOptions): Promise<Blocks> {
        return this.api.block(param.by, param.value,  options).toPromise();
    }

    /**
     * Get blocks
     * blocks
     * @param param the request object
     */
    public blocksWithHttpInfo(param: BlockApiBlocksRequest, options?: ConfigurationOptions): Promise<HttpInfo<Blocks>> {
        return this.api.blocksWithHttpInfo(param.limit, param.index, param.sort,  options).toPromise();
    }

    /**
     * Get blocks
     * blocks
     * @param param the request object
     */
    public blocks(param: BlockApiBlocksRequest, options?: ConfigurationOptions): Promise<Blocks> {
        return this.api.blocks(param.limit, param.index, param.sort,  options).toPromise();
    }

    /**
     * Get current height
     * currentHeight
     * @param param the request object
     */
    public currentHeightWithHttpInfo(param: BlockApiCurrentHeightRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<CurrentHeight>> {
        return this.api.currentHeightWithHttpInfo( options).toPromise();
    }

    /**
     * Get current height
     * currentHeight
     * @param param the request object
     */
    public currentHeight(param: BlockApiCurrentHeightRequest = {}, options?: ConfigurationOptions): Promise<CurrentHeight> {
        return this.api.currentHeight( options).toPromise();
    }

}

import { ObservableBridgeApi } from "./ObservableAPI";
import { BridgeApiRequestFactory, BridgeApiResponseProcessor} from "../apis/BridgeApi";

export interface BridgeApiFastbridgeInfoRequest {
}

export class ObjectBridgeApi {
    private api: ObservableBridgeApi

    public constructor(configuration: Configuration, requestFactory?: BridgeApiRequestFactory, responseProcessor?: BridgeApiResponseProcessor) {
        this.api = new ObservableBridgeApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get fast bridge info
     * fastbridge_info
     * @param param the request object
     */
    public fastbridgeInfoWithHttpInfo(param: BridgeApiFastbridgeInfoRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<RespGetFastBridgeInfo>> {
        return this.api.fastbridgeInfoWithHttpInfo( options).toPromise();
    }

    /**
     * Get fast bridge info
     * fastbridge_info
     * @param param the request object
     */
    public fastbridgeInfo(param: BridgeApiFastbridgeInfoRequest = {}, options?: ConfigurationOptions): Promise<RespGetFastBridgeInfo> {
        return this.api.fastbridgeInfo( options).toPromise();
    }

}

import { ObservableCandlestickApi } from "./ObservableAPI";
import { CandlestickApiRequestFactory, CandlestickApiResponseProcessor} from "../apis/CandlestickApi";

export interface CandlestickApiCandlesticksRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApicandlesticks
     */
    marketId: number
    /**
     * 
     * Defaults to: undefined
     * @type &#39;1m&#39; | &#39;5m&#39; | &#39;15m&#39; | &#39;1h&#39; | &#39;4h&#39; | &#39;1d&#39;
     * @memberof CandlestickApicandlesticks
     */
    resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
    /**
     * 
     * Minimum: 0
     * Maximum: 5000000000000
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApicandlesticks
     */
    startTimestamp: number
    /**
     * 
     * Minimum: 0
     * Maximum: 5000000000000
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApicandlesticks
     */
    endTimestamp: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApicandlesticks
     */
    countBack: number
    /**
     * 
     * Defaults to: false
     * @type boolean
     * @memberof CandlestickApicandlesticks
     */
    setTimestampToEnd?: boolean
}

export interface CandlestickApiFundingsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApifundings
     */
    marketId: number
    /**
     * 
     * Defaults to: undefined
     * @type &#39;1h&#39; | &#39;1d&#39;
     * @memberof CandlestickApifundings
     */
    resolution: '1h' | '1d'
    /**
     * 
     * Minimum: 0
     * Maximum: 5000000000000
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApifundings
     */
    startTimestamp: number
    /**
     * 
     * Minimum: 0
     * Maximum: 5000000000000
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApifundings
     */
    endTimestamp: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof CandlestickApifundings
     */
    countBack: number
}

export class ObjectCandlestickApi {
    private api: ObservableCandlestickApi

    public constructor(configuration: Configuration, requestFactory?: CandlestickApiRequestFactory, responseProcessor?: CandlestickApiResponseProcessor) {
        this.api = new ObservableCandlestickApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get candlesticks
     * candlesticks
     * @param param the request object
     */
    public candlesticksWithHttpInfo(param: CandlestickApiCandlesticksRequest, options?: ConfigurationOptions): Promise<HttpInfo<Candlesticks>> {
        return this.api.candlesticksWithHttpInfo(param.marketId, param.resolution, param.startTimestamp, param.endTimestamp, param.countBack, param.setTimestampToEnd,  options).toPromise();
    }

    /**
     * Get candlesticks
     * candlesticks
     * @param param the request object
     */
    public candlesticks(param: CandlestickApiCandlesticksRequest, options?: ConfigurationOptions): Promise<Candlesticks> {
        return this.api.candlesticks(param.marketId, param.resolution, param.startTimestamp, param.endTimestamp, param.countBack, param.setTimestampToEnd,  options).toPromise();
    }

    /**
     * Get fundings
     * fundings
     * @param param the request object
     */
    public fundingsWithHttpInfo(param: CandlestickApiFundingsRequest, options?: ConfigurationOptions): Promise<HttpInfo<Fundings>> {
        return this.api.fundingsWithHttpInfo(param.marketId, param.resolution, param.startTimestamp, param.endTimestamp, param.countBack,  options).toPromise();
    }

    /**
     * Get fundings
     * fundings
     * @param param the request object
     */
    public fundings(param: CandlestickApiFundingsRequest, options?: ConfigurationOptions): Promise<Fundings> {
        return this.api.fundings(param.marketId, param.resolution, param.startTimestamp, param.endTimestamp, param.countBack,  options).toPromise();
    }

}

import { ObservableFundingApi } from "./ObservableAPI";
import { FundingApiRequestFactory, FundingApiResponseProcessor} from "../apis/FundingApi";

export interface FundingApiFundingRatesRequest {
}

export class ObjectFundingApi {
    private api: ObservableFundingApi

    public constructor(configuration: Configuration, requestFactory?: FundingApiRequestFactory, responseProcessor?: FundingApiResponseProcessor) {
        this.api = new ObservableFundingApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get funding rates
     * funding-rates
     * @param param the request object
     */
    public fundingRatesWithHttpInfo(param: FundingApiFundingRatesRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<FundingRates>> {
        return this.api.fundingRatesWithHttpInfo( options).toPromise();
    }

    /**
     * Get funding rates
     * funding-rates
     * @param param the request object
     */
    public fundingRates(param: FundingApiFundingRatesRequest = {}, options?: ConfigurationOptions): Promise<FundingRates> {
        return this.api.fundingRates( options).toPromise();
    }

}

import { ObservableInfoApi } from "./ObservableAPI";
import { InfoApiRequestFactory, InfoApiResponseProcessor} from "../apis/InfoApi";

export interface InfoApiTransferFeeInfoRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof InfoApitransferFeeInfo
     */
    accountIndex: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof InfoApitransferFeeInfo
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof InfoApitransferFeeInfo
     */
    auth?: string
    /**
     * 
     * Defaults to: -1
     * @type number
     * @memberof InfoApitransferFeeInfo
     */
    toAccountIndex?: number
}

export interface InfoApiWithdrawalDelayRequest {
}

export class ObjectInfoApi {
    private api: ObservableInfoApi

    public constructor(configuration: Configuration, requestFactory?: InfoApiRequestFactory, responseProcessor?: InfoApiResponseProcessor) {
        this.api = new ObservableInfoApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Transfer fee info
     * transferFeeInfo
     * @param param the request object
     */
    public transferFeeInfoWithHttpInfo(param: InfoApiTransferFeeInfoRequest, options?: ConfigurationOptions): Promise<HttpInfo<TransferFeeInfo>> {
        return this.api.transferFeeInfoWithHttpInfo(param.accountIndex, param.authorization, param.auth, param.toAccountIndex,  options).toPromise();
    }

    /**
     * Transfer fee info
     * transferFeeInfo
     * @param param the request object
     */
    public transferFeeInfo(param: InfoApiTransferFeeInfoRequest, options?: ConfigurationOptions): Promise<TransferFeeInfo> {
        return this.api.transferFeeInfo(param.accountIndex, param.authorization, param.auth, param.toAccountIndex,  options).toPromise();
    }

    /**
     * Withdrawal delay in seconds
     * withdrawalDelay
     * @param param the request object
     */
    public withdrawalDelayWithHttpInfo(param: InfoApiWithdrawalDelayRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<RespWithdrawalDelay>> {
        return this.api.withdrawalDelayWithHttpInfo( options).toPromise();
    }

    /**
     * Withdrawal delay in seconds
     * withdrawalDelay
     * @param param the request object
     */
    public withdrawalDelay(param: InfoApiWithdrawalDelayRequest = {}, options?: ConfigurationOptions): Promise<RespWithdrawalDelay> {
        return this.api.withdrawalDelay( options).toPromise();
    }

}

import { ObservableNotificationApi } from "./ObservableAPI";
import { NotificationApiRequestFactory, NotificationApiResponseProcessor} from "../apis/NotificationApi";

export interface NotificationApiNotificationAckRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof NotificationApinotificationAck
     */
    notifId: string
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof NotificationApinotificationAck
     */
    accountIndex: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof NotificationApinotificationAck
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof NotificationApinotificationAck
     */
    auth?: string
}

export class ObjectNotificationApi {
    private api: ObservableNotificationApi

    public constructor(configuration: Configuration, requestFactory?: NotificationApiRequestFactory, responseProcessor?: NotificationApiResponseProcessor) {
        this.api = new ObservableNotificationApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Ack notification
     * notification_ack
     * @param param the request object
     */
    public notificationAckWithHttpInfo(param: NotificationApiNotificationAckRequest, options?: ConfigurationOptions): Promise<HttpInfo<ResultCode>> {
        return this.api.notificationAckWithHttpInfo(param.notifId, param.accountIndex, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Ack notification
     * notification_ack
     * @param param the request object
     */
    public notificationAck(param: NotificationApiNotificationAckRequest, options?: ConfigurationOptions): Promise<ResultCode> {
        return this.api.notificationAck(param.notifId, param.accountIndex, param.authorization, param.auth,  options).toPromise();
    }

}

import { ObservableOrderApi } from "./ObservableAPI";
import { OrderApiRequestFactory, OrderApiResponseProcessor} from "../apis/OrderApi";

export interface OrderApiExportRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;funding&#39; | &#39;trade&#39;
     * @memberof OrderApi_export
     */
    type: 'funding' | 'trade'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrderApi_export
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrderApi_export
     */
    auth?: string
    /**
     * 
     * Defaults to: -1
     * @type number
     * @memberof OrderApi_export
     */
    accountIndex?: number
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof OrderApi_export
     */
    marketId?: number
}

export interface OrderApiAccountActiveOrdersRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OrderApiaccountActiveOrders
     */
    accountIndex: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OrderApiaccountActiveOrders
     */
    marketId: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof OrderApiaccountActiveOrders
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof OrderApiaccountActiveOrders
     */
    auth?: string
}

export interface OrderApiAccountInactiveOrdersRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OrderApiaccountInactiveOrders
     */
    accountIndex: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof OrderApiaccountInactiveOrders
     */
    limit: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof OrderApiaccountInactiveOrders
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof OrderApiaccountInactiveOrders
     */
    auth?: string
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof OrderApiaccountInactiveOrders
     */
    marketId?: number
    /**
     * 
     * Defaults to: -1
     * @type number
     * @memberof OrderApiaccountInactiveOrders
     */
    askFilter?: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrderApiaccountInactiveOrders
     */
    betweenTimestamps?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrderApiaccountInactiveOrders
     */
    cursor?: string
}

export interface OrderApiExchangeStatsRequest {
}

export interface OrderApiOrderBookDetailsRequest {
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof OrderApiorderBookDetails
     */
    marketId?: number
}

export interface OrderApiOrderBookOrdersRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OrderApiorderBookOrders
     */
    marketId: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof OrderApiorderBookOrders
     */
    limit: number
}

export interface OrderApiOrderBooksRequest {
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof OrderApiorderBooks
     */
    marketId?: number
}

export interface OrderApiRecentTradesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OrderApirecentTrades
     */
    marketId: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof OrderApirecentTrades
     */
    limit: number
}

export interface OrderApiTradesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;block_height&#39; | &#39;timestamp&#39; | &#39;trade_id&#39;
     * @memberof OrderApitrades
     */
    sortBy: 'block_height' | 'timestamp' | 'trade_id'
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof OrderApitrades
     */
    limit: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrderApitrades
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrderApitrades
     */
    auth?: string
    /**
     * 
     * Defaults to: 255
     * @type number
     * @memberof OrderApitrades
     */
    marketId?: number
    /**
     * 
     * Defaults to: -1
     * @type number
     * @memberof OrderApitrades
     */
    accountIndex?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OrderApitrades
     */
    orderIndex?: number
    /**
     * 
     * Defaults to: &#39;desc&#39;
     * @type &#39;desc&#39;
     * @memberof OrderApitrades
     */
    sortDir?: 'desc'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrderApitrades
     */
    cursor?: string
    /**
     * 
     * Defaults to: -1
     * @type number
     * @memberof OrderApitrades
     */
    _from?: number
    /**
     * 
     * Defaults to: -1
     * @type number
     * @memberof OrderApitrades
     */
    askFilter?: number
}

export class ObjectOrderApi {
    private api: ObservableOrderApi

    public constructor(configuration: Configuration, requestFactory?: OrderApiRequestFactory, responseProcessor?: OrderApiResponseProcessor) {
        this.api = new ObservableOrderApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Export data
     * export
     * @param param the request object
     */
    public _exportWithHttpInfo(param: OrderApiExportRequest, options?: ConfigurationOptions): Promise<HttpInfo<ExportData>> {
        return this.api._exportWithHttpInfo(param.type, param.authorization, param.auth, param.accountIndex, param.marketId,  options).toPromise();
    }

    /**
     * Export data
     * export
     * @param param the request object
     */
    public _export(param: OrderApiExportRequest, options?: ConfigurationOptions): Promise<ExportData> {
        return this.api._export(param.type, param.authorization, param.auth, param.accountIndex, param.marketId,  options).toPromise();
    }

    /**
     * Get account active orders. `auth` can be generated using the SDK.
     * accountActiveOrders
     * @param param the request object
     */
    public accountActiveOrdersWithHttpInfo(param: OrderApiAccountActiveOrdersRequest, options?: ConfigurationOptions): Promise<HttpInfo<Orders>> {
        return this.api.accountActiveOrdersWithHttpInfo(param.accountIndex, param.marketId, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get account active orders. `auth` can be generated using the SDK.
     * accountActiveOrders
     * @param param the request object
     */
    public accountActiveOrders(param: OrderApiAccountActiveOrdersRequest, options?: ConfigurationOptions): Promise<Orders> {
        return this.api.accountActiveOrders(param.accountIndex, param.marketId, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get account inactive orders
     * accountInactiveOrders
     * @param param the request object
     */
    public accountInactiveOrdersWithHttpInfo(param: OrderApiAccountInactiveOrdersRequest, options?: ConfigurationOptions): Promise<HttpInfo<Orders>> {
        return this.api.accountInactiveOrdersWithHttpInfo(param.accountIndex, param.limit, param.authorization, param.auth, param.marketId, param.askFilter, param.betweenTimestamps, param.cursor,  options).toPromise();
    }

    /**
     * Get account inactive orders
     * accountInactiveOrders
     * @param param the request object
     */
    public accountInactiveOrders(param: OrderApiAccountInactiveOrdersRequest, options?: ConfigurationOptions): Promise<Orders> {
        return this.api.accountInactiveOrders(param.accountIndex, param.limit, param.authorization, param.auth, param.marketId, param.askFilter, param.betweenTimestamps, param.cursor,  options).toPromise();
    }

    /**
     * Get exchange stats
     * exchangeStats
     * @param param the request object
     */
    public exchangeStatsWithHttpInfo(param: OrderApiExchangeStatsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ExchangeStats>> {
        return this.api.exchangeStatsWithHttpInfo( options).toPromise();
    }

    /**
     * Get exchange stats
     * exchangeStats
     * @param param the request object
     */
    public exchangeStats(param: OrderApiExchangeStatsRequest = {}, options?: ConfigurationOptions): Promise<ExchangeStats> {
        return this.api.exchangeStats( options).toPromise();
    }

    /**
     * Get order books metadata
     * orderBookDetails
     * @param param the request object
     */
    public orderBookDetailsWithHttpInfo(param: OrderApiOrderBookDetailsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<OrderBookDetails>> {
        return this.api.orderBookDetailsWithHttpInfo(param.marketId,  options).toPromise();
    }

    /**
     * Get order books metadata
     * orderBookDetails
     * @param param the request object
     */
    public orderBookDetails(param: OrderApiOrderBookDetailsRequest = {}, options?: ConfigurationOptions): Promise<OrderBookDetails> {
        return this.api.orderBookDetails(param.marketId,  options).toPromise();
    }

    /**
     * Get order book orders
     * orderBookOrders
     * @param param the request object
     */
    public orderBookOrdersWithHttpInfo(param: OrderApiOrderBookOrdersRequest, options?: ConfigurationOptions): Promise<HttpInfo<OrderBookOrders>> {
        return this.api.orderBookOrdersWithHttpInfo(param.marketId, param.limit,  options).toPromise();
    }

    /**
     * Get order book orders
     * orderBookOrders
     * @param param the request object
     */
    public orderBookOrders(param: OrderApiOrderBookOrdersRequest, options?: ConfigurationOptions): Promise<OrderBookOrders> {
        return this.api.orderBookOrders(param.marketId, param.limit,  options).toPromise();
    }

    /**
     * Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.
     * orderBooks
     * @param param the request object
     */
    public orderBooksWithHttpInfo(param: OrderApiOrderBooksRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<OrderBooks>> {
        return this.api.orderBooksWithHttpInfo(param.marketId,  options).toPromise();
    }

    /**
     * Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.
     * orderBooks
     * @param param the request object
     */
    public orderBooks(param: OrderApiOrderBooksRequest = {}, options?: ConfigurationOptions): Promise<OrderBooks> {
        return this.api.orderBooks(param.marketId,  options).toPromise();
    }

    /**
     * Get recent trades
     * recentTrades
     * @param param the request object
     */
    public recentTradesWithHttpInfo(param: OrderApiRecentTradesRequest, options?: ConfigurationOptions): Promise<HttpInfo<Trades>> {
        return this.api.recentTradesWithHttpInfo(param.marketId, param.limit,  options).toPromise();
    }

    /**
     * Get recent trades
     * recentTrades
     * @param param the request object
     */
    public recentTrades(param: OrderApiRecentTradesRequest, options?: ConfigurationOptions): Promise<Trades> {
        return this.api.recentTrades(param.marketId, param.limit,  options).toPromise();
    }

    /**
     * Get trades
     * trades
     * @param param the request object
     */
    public tradesWithHttpInfo(param: OrderApiTradesRequest, options?: ConfigurationOptions): Promise<HttpInfo<Trades>> {
        return this.api.tradesWithHttpInfo(param.sortBy, param.limit, param.authorization, param.auth, param.marketId, param.accountIndex, param.orderIndex, param.sortDir, param.cursor, param._from, param.askFilter,  options).toPromise();
    }

    /**
     * Get trades
     * trades
     * @param param the request object
     */
    public trades(param: OrderApiTradesRequest, options?: ConfigurationOptions): Promise<Trades> {
        return this.api.trades(param.sortBy, param.limit, param.authorization, param.auth, param.marketId, param.accountIndex, param.orderIndex, param.sortDir, param.cursor, param._from, param.askFilter,  options).toPromise();
    }

}

import { ObservableReferralApi } from "./ObservableAPI";
import { ReferralApiRequestFactory, ReferralApiResponseProcessor} from "../apis/ReferralApi";

export interface ReferralApiReferralPointsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof ReferralApireferralPoints
     */
    accountIndex: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof ReferralApireferralPoints
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof ReferralApireferralPoints
     */
    auth?: string
}

export class ObjectReferralApi {
    private api: ObservableReferralApi

    public constructor(configuration: Configuration, requestFactory?: ReferralApiRequestFactory, responseProcessor?: ReferralApiResponseProcessor) {
        this.api = new ObservableReferralApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get referral points
     * referral_points
     * @param param the request object
     */
    public referralPointsWithHttpInfo(param: ReferralApiReferralPointsRequest, options?: ConfigurationOptions): Promise<HttpInfo<ReferralPoints>> {
        return this.api.referralPointsWithHttpInfo(param.accountIndex, param.authorization, param.auth,  options).toPromise();
    }

    /**
     * Get referral points
     * referral_points
     * @param param the request object
     */
    public referralPoints(param: ReferralApiReferralPointsRequest, options?: ConfigurationOptions): Promise<ReferralPoints> {
        return this.api.referralPoints(param.accountIndex, param.authorization, param.auth,  options).toPromise();
    }

}

import { ObservableRootApi } from "./ObservableAPI";
import { RootApiRequestFactory, RootApiResponseProcessor} from "../apis/RootApi";

export interface RootApiInfoRequest {
}

export interface RootApiStatusRequest {
}

export class ObjectRootApi {
    private api: ObservableRootApi

    public constructor(configuration: Configuration, requestFactory?: RootApiRequestFactory, responseProcessor?: RootApiResponseProcessor) {
        this.api = new ObservableRootApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get info of zklighter
     * info
     * @param param the request object
     */
    public infoWithHttpInfo(param: RootApiInfoRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ZkLighterInfo>> {
        return this.api.infoWithHttpInfo( options).toPromise();
    }

    /**
     * Get info of zklighter
     * info
     * @param param the request object
     */
    public info(param: RootApiInfoRequest = {}, options?: ConfigurationOptions): Promise<ZkLighterInfo> {
        return this.api.info( options).toPromise();
    }

    /**
     * Get status of zklighter
     * status
     * @param param the request object
     */
    public statusWithHttpInfo(param: RootApiStatusRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Status>> {
        return this.api.statusWithHttpInfo( options).toPromise();
    }

    /**
     * Get status of zklighter
     * status
     * @param param the request object
     */
    public status(param: RootApiStatusRequest = {}, options?: ConfigurationOptions): Promise<Status> {
        return this.api.status( options).toPromise();
    }

}

import { ObservableTransactionApi } from "./ObservableAPI";
import { TransactionApiRequestFactory, TransactionApiResponseProcessor} from "../apis/TransactionApi";

export interface TransactionApiAccountTxsRequest {
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApiaccountTxs
     */
    limit: number
    /**
     * 
     * Defaults to: undefined
     * @type &#39;account_index&#39;
     * @memberof TransactionApiaccountTxs
     */
    by: 'account_index'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApiaccountTxs
     */
    value: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApiaccountTxs
     */
    authorization?: string
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApiaccountTxs
     */
    index?: number
    /**
     * 
     * Defaults to: undefined
     * @type Array&lt;number&gt;
     * @memberof TransactionApiaccountTxs
     */
    types?: Array<number>
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApiaccountTxs
     */
    auth?: string
}

export interface TransactionApiBlockTxsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;block_height&#39; | &#39;block_commitment&#39;
     * @memberof TransactionApiblockTxs
     */
    by: 'block_height' | 'block_commitment'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApiblockTxs
     */
    value: string
}

export interface TransactionApiDepositHistoryRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApidepositHistory
     */
    accountIndex: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApidepositHistory
     */
    l1Address: string
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApidepositHistory
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApidepositHistory
     */
    auth?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApidepositHistory
     */
    cursor?: string
    /**
     * 
     * Defaults to: undefined
     * @type &#39;all&#39; | &#39;pending&#39; | &#39;claimable&#39;
     * @memberof TransactionApidepositHistory
     */
    filter?: 'all' | 'pending' | 'claimable'
}

export interface TransactionApiNextNonceRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApinextNonce
     */
    accountIndex: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApinextNonce
     */
    apiKeyIndex: number
}

export interface TransactionApiSendTxRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApisendTx
     */
    txType: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApisendTx
     */
    txInfo: string
    /**
     * 
     * Defaults to: true
     * @type boolean
     * @memberof TransactionApisendTx
     */
    priceProtection?: boolean
}

export interface TransactionApiSendTxBatchRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApisendTxBatch
     */
    txTypes: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApisendTxBatch
     */
    txInfos: string
}

export interface TransactionApiTransferHistoryRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApitransferHistory
     */
    accountIndex: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApitransferHistory
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApitransferHistory
     */
    auth?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApitransferHistory
     */
    cursor?: string
}

export interface TransactionApiTxRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;hash&#39; | &#39;sequence_index&#39;
     * @memberof TransactionApitx
     */
    by: 'hash' | 'sequence_index'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApitx
     */
    value: string
}

export interface TransactionApiTxFromL1TxHashRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApitxFromL1TxHash
     */
    hash: string
}

export interface TransactionApiTxsRequest {
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApitxs
     */
    limit: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApitxs
     */
    index?: number
}

export interface TransactionApiWithdrawHistoryRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TransactionApiwithdrawHistory
     */
    accountIndex: number
    /**
     *  make required after integ is done
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApiwithdrawHistory
     */
    authorization?: string
    /**
     *  made optional to support header auth clients
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApiwithdrawHistory
     */
    auth?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TransactionApiwithdrawHistory
     */
    cursor?: string
    /**
     * 
     * Defaults to: undefined
     * @type &#39;all&#39; | &#39;pending&#39; | &#39;claimable&#39;
     * @memberof TransactionApiwithdrawHistory
     */
    filter?: 'all' | 'pending' | 'claimable'
}

export class ObjectTransactionApi {
    private api: ObservableTransactionApi

    public constructor(configuration: Configuration, requestFactory?: TransactionApiRequestFactory, responseProcessor?: TransactionApiResponseProcessor) {
        this.api = new ObservableTransactionApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get transactions of a specific account
     * accountTxs
     * @param param the request object
     */
    public accountTxsWithHttpInfo(param: TransactionApiAccountTxsRequest, options?: ConfigurationOptions): Promise<HttpInfo<Txs>> {
        return this.api.accountTxsWithHttpInfo(param.limit, param.by, param.value, param.authorization, param.index, param.types, param.auth,  options).toPromise();
    }

    /**
     * Get transactions of a specific account
     * accountTxs
     * @param param the request object
     */
    public accountTxs(param: TransactionApiAccountTxsRequest, options?: ConfigurationOptions): Promise<Txs> {
        return this.api.accountTxs(param.limit, param.by, param.value, param.authorization, param.index, param.types, param.auth,  options).toPromise();
    }

    /**
     * Get transactions in a block
     * blockTxs
     * @param param the request object
     */
    public blockTxsWithHttpInfo(param: TransactionApiBlockTxsRequest, options?: ConfigurationOptions): Promise<HttpInfo<Txs>> {
        return this.api.blockTxsWithHttpInfo(param.by, param.value,  options).toPromise();
    }

    /**
     * Get transactions in a block
     * blockTxs
     * @param param the request object
     */
    public blockTxs(param: TransactionApiBlockTxsRequest, options?: ConfigurationOptions): Promise<Txs> {
        return this.api.blockTxs(param.by, param.value,  options).toPromise();
    }

    /**
     * Get deposit history
     * deposit_history
     * @param param the request object
     */
    public depositHistoryWithHttpInfo(param: TransactionApiDepositHistoryRequest, options?: ConfigurationOptions): Promise<HttpInfo<DepositHistory>> {
        return this.api.depositHistoryWithHttpInfo(param.accountIndex, param.l1Address, param.authorization, param.auth, param.cursor, param.filter,  options).toPromise();
    }

    /**
     * Get deposit history
     * deposit_history
     * @param param the request object
     */
    public depositHistory(param: TransactionApiDepositHistoryRequest, options?: ConfigurationOptions): Promise<DepositHistory> {
        return this.api.depositHistory(param.accountIndex, param.l1Address, param.authorization, param.auth, param.cursor, param.filter,  options).toPromise();
    }

    /**
     * Get next nonce for a specific account and api key
     * nextNonce
     * @param param the request object
     */
    public nextNonceWithHttpInfo(param: TransactionApiNextNonceRequest, options?: ConfigurationOptions): Promise<HttpInfo<NextNonce>> {
        return this.api.nextNonceWithHttpInfo(param.accountIndex, param.apiKeyIndex,  options).toPromise();
    }

    /**
     * Get next nonce for a specific account and api key
     * nextNonce
     * @param param the request object
     */
    public nextNonce(param: TransactionApiNextNonceRequest, options?: ConfigurationOptions): Promise<NextNonce> {
        return this.api.nextNonce(param.accountIndex, param.apiKeyIndex,  options).toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTx
     * @param param the request object
     */
    public sendTxWithHttpInfo(param: TransactionApiSendTxRequest, options?: ConfigurationOptions): Promise<HttpInfo<RespSendTx>> {
        return this.api.sendTxWithHttpInfo(param.txType, param.txInfo, param.priceProtection,  options).toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTx
     * @param param the request object
     */
    public sendTx(param: TransactionApiSendTxRequest, options?: ConfigurationOptions): Promise<RespSendTx> {
        return this.api.sendTx(param.txType, param.txInfo, param.priceProtection,  options).toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTxBatch
     * @param param the request object
     */
    public sendTxBatchWithHttpInfo(param: TransactionApiSendTxBatchRequest, options?: ConfigurationOptions): Promise<HttpInfo<RespSendTxBatch>> {
        return this.api.sendTxBatchWithHttpInfo(param.txTypes, param.txInfos,  options).toPromise();
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTxBatch
     * @param param the request object
     */
    public sendTxBatch(param: TransactionApiSendTxBatchRequest, options?: ConfigurationOptions): Promise<RespSendTxBatch> {
        return this.api.sendTxBatch(param.txTypes, param.txInfos,  options).toPromise();
    }

    /**
     * Get transfer history
     * transfer_history
     * @param param the request object
     */
    public transferHistoryWithHttpInfo(param: TransactionApiTransferHistoryRequest, options?: ConfigurationOptions): Promise<HttpInfo<TransferHistory>> {
        return this.api.transferHistoryWithHttpInfo(param.accountIndex, param.authorization, param.auth, param.cursor,  options).toPromise();
    }

    /**
     * Get transfer history
     * transfer_history
     * @param param the request object
     */
    public transferHistory(param: TransactionApiTransferHistoryRequest, options?: ConfigurationOptions): Promise<TransferHistory> {
        return this.api.transferHistory(param.accountIndex, param.authorization, param.auth, param.cursor,  options).toPromise();
    }

    /**
     * Get transaction by hash or sequence index
     * tx
     * @param param the request object
     */
    public txWithHttpInfo(param: TransactionApiTxRequest, options?: ConfigurationOptions): Promise<HttpInfo<EnrichedTx>> {
        return this.api.txWithHttpInfo(param.by, param.value,  options).toPromise();
    }

    /**
     * Get transaction by hash or sequence index
     * tx
     * @param param the request object
     */
    public tx(param: TransactionApiTxRequest, options?: ConfigurationOptions): Promise<EnrichedTx> {
        return this.api.tx(param.by, param.value,  options).toPromise();
    }

    /**
     * Get L1 transaction by L1 transaction hash
     * txFromL1TxHash
     * @param param the request object
     */
    public txFromL1TxHashWithHttpInfo(param: TransactionApiTxFromL1TxHashRequest, options?: ConfigurationOptions): Promise<HttpInfo<EnrichedTx>> {
        return this.api.txFromL1TxHashWithHttpInfo(param.hash,  options).toPromise();
    }

    /**
     * Get L1 transaction by L1 transaction hash
     * txFromL1TxHash
     * @param param the request object
     */
    public txFromL1TxHash(param: TransactionApiTxFromL1TxHashRequest, options?: ConfigurationOptions): Promise<EnrichedTx> {
        return this.api.txFromL1TxHash(param.hash,  options).toPromise();
    }

    /**
     * Get transactions which are already packed into blocks
     * txs
     * @param param the request object
     */
    public txsWithHttpInfo(param: TransactionApiTxsRequest, options?: ConfigurationOptions): Promise<HttpInfo<Txs>> {
        return this.api.txsWithHttpInfo(param.limit, param.index,  options).toPromise();
    }

    /**
     * Get transactions which are already packed into blocks
     * txs
     * @param param the request object
     */
    public txs(param: TransactionApiTxsRequest, options?: ConfigurationOptions): Promise<Txs> {
        return this.api.txs(param.limit, param.index,  options).toPromise();
    }

    /**
     * Get withdraw history
     * withdraw_history
     * @param param the request object
     */
    public withdrawHistoryWithHttpInfo(param: TransactionApiWithdrawHistoryRequest, options?: ConfigurationOptions): Promise<HttpInfo<WithdrawHistory>> {
        return this.api.withdrawHistoryWithHttpInfo(param.accountIndex, param.authorization, param.auth, param.cursor, param.filter,  options).toPromise();
    }

    /**
     * Get withdraw history
     * withdraw_history
     * @param param the request object
     */
    public withdrawHistory(param: TransactionApiWithdrawHistoryRequest, options?: ConfigurationOptions): Promise<WithdrawHistory> {
        return this.api.withdrawHistory(param.accountIndex, param.authorization, param.auth, param.cursor, param.filter,  options).toPromise();
    }

}
