export * from '../models/Account';
export * from '../models/AccountApiKeys';
export * from '../models/AccountLimits';
export * from '../models/AccountMarginStats';
export * from '../models/AccountMarketStats';
export * from '../models/AccountMetadata';
export * from '../models/AccountMetadatas';
export * from '../models/AccountPnL';
export * from '../models/AccountPosition';
export * from '../models/AccountStats';
export * from '../models/AccountTradeStats';
export * from '../models/Announcement';
export * from '../models/Announcements';
export * from '../models/ApiKey';
export * from '../models/Block';
export * from '../models/Blocks';
export * from '../models/BridgeSupportedNetwork';
export * from '../models/Candlestick';
export * from '../models/Candlesticks';
export * from '../models/ContractAddress';
export * from '../models/CurrentHeight';
export * from '../models/Cursor';
export * from '../models/DailyReturn';
export * from '../models/DepositHistory';
export * from '../models/DepositHistoryItem';
export * from '../models/DetailedAccount';
export * from '../models/DetailedAccounts';
export * from '../models/DetailedCandlestick';
export * from '../models/EnrichedTx';
export * from '../models/ExchangeStats';
export * from '../models/ExportData';
export * from '../models/Funding';
export * from '../models/FundingRate';
export * from '../models/FundingRates';
export * from '../models/Fundings';
export * from '../models/L1Metadata';
export * from '../models/L1ProviderInfo';
export * from '../models/LiqTrade';
export * from '../models/Liquidation';
export * from '../models/LiquidationInfo';
export * from '../models/LiquidationInfos';
export * from '../models/MarketInfo';
export * from '../models/NextNonce';
export * from '../models/Order';
export * from '../models/OrderBook';
export * from '../models/OrderBookDepth';
export * from '../models/OrderBookDetail';
export * from '../models/OrderBookDetails';
export * from '../models/OrderBookOrders';
export * from '../models/OrderBookStats';
export * from '../models/OrderBooks';
export * from '../models/Orders';
export * from '../models/PnLEntry';
export * from '../models/PositionFunding';
export * from '../models/PositionFundings';
export * from '../models/PriceLevel';
export * from '../models/PublicPool';
export * from '../models/PublicPoolInfo';
export * from '../models/PublicPoolMetadata';
export * from '../models/PublicPoolShare';
export * from '../models/PublicPools';
export * from '../models/ReferralPointEntry';
export * from '../models/ReferralPoints';
export * from '../models/ReqExportData';
export * from '../models/ReqGetAccount';
export * from '../models/ReqGetAccountActiveOrders';
export * from '../models/ReqGetAccountApiKeys';
export * from '../models/ReqGetAccountByL1Address';
export * from '../models/ReqGetAccountInactiveOrders';
export * from '../models/ReqGetAccountLimits';
export * from '../models/ReqGetAccountMetadata';
export * from '../models/ReqGetAccountPnL';
export * from '../models/ReqGetAccountTxs';
export * from '../models/ReqGetBlock';
export * from '../models/ReqGetBlockTxs';
export * from '../models/ReqGetByAccount';
export * from '../models/ReqGetCandlesticks';
export * from '../models/ReqGetDepositHistory';
export * from '../models/ReqGetFastWithdrawInfo';
export * from '../models/ReqGetFundings';
export * from '../models/ReqGetL1Metadata';
export * from '../models/ReqGetL1Tx';
export * from '../models/ReqGetLatestDeposit';
export * from '../models/ReqGetLiquidationInfos';
export * from '../models/ReqGetNextNonce';
export * from '../models/ReqGetOrderBookDetails';
export * from '../models/ReqGetOrderBookOrders';
export * from '../models/ReqGetOrderBooks';
export * from '../models/ReqGetPositionFunding';
export * from '../models/ReqGetPublicPools';
export * from '../models/ReqGetPublicPoolsMetadata';
export * from '../models/ReqGetRangeWithCursor';
export * from '../models/ReqGetRangeWithIndex';
export * from '../models/ReqGetRangeWithIndexSortable';
export * from '../models/ReqGetRecentTrades';
export * from '../models/ReqGetReferralPoints';
export * from '../models/ReqGetTrades';
export * from '../models/ReqGetTransferFeeInfo';
export * from '../models/ReqGetTransferHistory';
export * from '../models/ReqGetTx';
export * from '../models/ReqGetWithdrawHistory';
export * from '../models/RespChangeAccountTier';
export * from '../models/RespGetFastBridgeInfo';
export * from '../models/RespPublicPoolsMetadata';
export * from '../models/RespSendTx';
export * from '../models/RespSendTxBatch';
export * from '../models/RespWithdrawalDelay';
export * from '../models/ResultCode';
export * from '../models/RiskInfo';
export * from '../models/RiskParameters';
export * from '../models/SharePrice';
export * from '../models/SimpleOrder';
export * from '../models/Status';
export * from '../models/SubAccounts';
export * from '../models/Ticker';
export * from '../models/Trade';
export * from '../models/Trades';
export * from '../models/TransferFeeInfo';
export * from '../models/TransferHistory';
export * from '../models/TransferHistoryItem';
export * from '../models/Tx';
export * from '../models/TxHash';
export * from '../models/TxHashes';
export * from '../models/Txs';
export * from '../models/ValidatorInfo';
export * from '../models/WithdrawHistory';
export * from '../models/WithdrawHistoryItem';
export * from '../models/ZkLighterInfo';

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
import { DepositHistoryItem   , DepositHistoryItemStatusEnum    } from '../models/DepositHistoryItem';
import { DetailedAccount } from '../models/DetailedAccount';
import { DetailedAccounts } from '../models/DetailedAccounts';
import { DetailedCandlestick } from '../models/DetailedCandlestick';
import { EnrichedTx } from '../models/EnrichedTx';
import { ExchangeStats } from '../models/ExchangeStats';
import { ExportData } from '../models/ExportData';
import { Funding } from '../models/Funding';
import { FundingRate , FundingRateExchangeEnum     } from '../models/FundingRate';
import { FundingRates } from '../models/FundingRates';
import { Fundings } from '../models/Fundings';
import { L1Metadata } from '../models/L1Metadata';
import { L1ProviderInfo } from '../models/L1ProviderInfo';
import { LiqTrade } from '../models/LiqTrade';
import { Liquidation  , LiquidationTypeEnum      } from '../models/Liquidation';
import { LiquidationInfo } from '../models/LiquidationInfo';
import { LiquidationInfos } from '../models/LiquidationInfos';
import { MarketInfo } from '../models/MarketInfo';
import { NextNonce } from '../models/NextNonce';
import { Order                , OrderTypeEnum  , OrderTimeInForceEnum     , OrderStatusEnum  , OrderTriggerStatusEnum           } from '../models/Order';
import { OrderBook  , OrderBookStatusEnum           } from '../models/OrderBook';
import { OrderBookDepth } from '../models/OrderBookDepth';
import { OrderBookDetail  , OrderBookDetailStatusEnum                           } from '../models/OrderBookDetail';
import { OrderBookDetails } from '../models/OrderBookDetails';
import { OrderBookOrders } from '../models/OrderBookOrders';
import { OrderBookStats } from '../models/OrderBookStats';
import { OrderBooks } from '../models/OrderBooks';
import { Orders } from '../models/Orders';
import { PnLEntry } from '../models/PnLEntry';
import { PositionFunding      , PositionFundingPositionSideEnum   } from '../models/PositionFunding';
import { PositionFundings } from '../models/PositionFundings';
import { PriceLevel } from '../models/PriceLevel';
import { PublicPool } from '../models/PublicPool';
import { PublicPoolInfo } from '../models/PublicPoolInfo';
import { PublicPoolMetadata } from '../models/PublicPoolMetadata';
import { PublicPoolShare } from '../models/PublicPoolShare';
import { PublicPools } from '../models/PublicPools';
import { ReferralPointEntry } from '../models/ReferralPointEntry';
import { ReferralPoints } from '../models/ReferralPoints';
import { ReqExportData   , ReqExportDataTypeEnum   } from '../models/ReqExportData';
import { ReqGetAccount, ReqGetAccountByEnum    } from '../models/ReqGetAccount';
import { ReqGetAccountActiveOrders } from '../models/ReqGetAccountActiveOrders';
import { ReqGetAccountApiKeys } from '../models/ReqGetAccountApiKeys';
import { ReqGetAccountByL1Address } from '../models/ReqGetAccountByL1Address';
import { ReqGetAccountInactiveOrders } from '../models/ReqGetAccountInactiveOrders';
import { ReqGetAccountLimits } from '../models/ReqGetAccountLimits';
import { ReqGetAccountMetadata, ReqGetAccountMetadataByEnum     } from '../models/ReqGetAccountMetadata';
import { ReqGetAccountPnL , ReqGetAccountPnLByEnum   , ReqGetAccountPnLResolutionEnum       } from '../models/ReqGetAccountPnL';
import { ReqGetAccountTxs  , ReqGetAccountTxsByEnum      } from '../models/ReqGetAccountTxs';
import { ReqGetBlock, ReqGetBlockByEnum    } from '../models/ReqGetBlock';
import { ReqGetBlockTxs, ReqGetBlockTxsByEnum    } from '../models/ReqGetBlockTxs';
import { ReqGetByAccount, ReqGetByAccountByEnum    } from '../models/ReqGetByAccount';
import { ReqGetCandlesticks , ReqGetCandlesticksResolutionEnum       } from '../models/ReqGetCandlesticks';
import { ReqGetDepositHistory    , ReqGetDepositHistoryFilterEnum   } from '../models/ReqGetDepositHistory';
import { ReqGetFastWithdrawInfo } from '../models/ReqGetFastWithdrawInfo';
import { ReqGetFundings , ReqGetFundingsResolutionEnum      } from '../models/ReqGetFundings';
import { ReqGetL1Metadata } from '../models/ReqGetL1Metadata';
import { ReqGetL1Tx } from '../models/ReqGetL1Tx';
import { ReqGetLatestDeposit } from '../models/ReqGetLatestDeposit';
import { ReqGetLiquidationInfos } from '../models/ReqGetLiquidationInfos';
import { ReqGetNextNonce } from '../models/ReqGetNextNonce';
import { ReqGetOrderBookDetails } from '../models/ReqGetOrderBookDetails';
import { ReqGetOrderBookOrders } from '../models/ReqGetOrderBookOrders';
import { ReqGetOrderBooks } from '../models/ReqGetOrderBooks';
import { ReqGetPositionFunding     , ReqGetPositionFundingSideEnum   } from '../models/ReqGetPositionFunding';
import { ReqGetPublicPools , ReqGetPublicPoolsFilterEnum      } from '../models/ReqGetPublicPools';
import { ReqGetPublicPoolsMetadata , ReqGetPublicPoolsMetadataFilterEnum      } from '../models/ReqGetPublicPoolsMetadata';
import { ReqGetRangeWithCursor } from '../models/ReqGetRangeWithCursor';
import { ReqGetRangeWithIndex } from '../models/ReqGetRangeWithIndex';
import { ReqGetRangeWithIndexSortable  , ReqGetRangeWithIndexSortableSortEnum   } from '../models/ReqGetRangeWithIndexSortable';
import { ReqGetRecentTrades } from '../models/ReqGetRecentTrades';
import { ReqGetReferralPoints } from '../models/ReqGetReferralPoints';
import { ReqGetTrades    , ReqGetTradesSortByEnum  , ReqGetTradesSortDirEnum       } from '../models/ReqGetTrades';
import { ReqGetTransferFeeInfo } from '../models/ReqGetTransferFeeInfo';
import { ReqGetTransferHistory } from '../models/ReqGetTransferHistory';
import { ReqGetTx, ReqGetTxByEnum    } from '../models/ReqGetTx';
import { ReqGetWithdrawHistory   , ReqGetWithdrawHistoryFilterEnum   } from '../models/ReqGetWithdrawHistory';
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
import { Trade  , TradeTypeEnum                        } from '../models/Trade';
import { Trades } from '../models/Trades';
import { TransferFeeInfo } from '../models/TransferFeeInfo';
import { TransferHistory } from '../models/TransferHistory';
import { TransferHistoryItem   , TransferHistoryItemTypeEnum        } from '../models/TransferHistoryItem';
import { Tx } from '../models/Tx';
import { TxHash } from '../models/TxHash';
import { TxHashes } from '../models/TxHashes';
import { Txs } from '../models/Txs';
import { ValidatorInfo } from '../models/ValidatorInfo';
import { WithdrawHistory } from '../models/WithdrawHistory';
import { WithdrawHistoryItem   , WithdrawHistoryItemStatusEnum  , WithdrawHistoryItemTypeEnum    } from '../models/WithdrawHistoryItem';
import { ZkLighterInfo } from '../models/ZkLighterInfo';

/* tslint:disable:no-unused-variable */
let primitives = [
                    "string",
                    "boolean",
                    "double",
                    "integer",
                    "long",
                    "float",
                    "number",
                    "any"
                 ];

let enumsMap: Set<string> = new Set<string>([
    "DepositHistoryItemStatusEnum",
    "FundingRateExchangeEnum",
    "LiquidationTypeEnum",
    "OrderTypeEnum",
    "OrderTimeInForceEnum",
    "OrderStatusEnum",
    "OrderTriggerStatusEnum",
    "OrderBookStatusEnum",
    "OrderBookDetailStatusEnum",
    "PositionFundingPositionSideEnum",
    "ReqExportDataTypeEnum",
    "ReqGetAccountByEnum",
    "ReqGetAccountMetadataByEnum",
    "ReqGetAccountPnLByEnum",
    "ReqGetAccountPnLResolutionEnum",
    "ReqGetAccountTxsByEnum",
    "ReqGetBlockByEnum",
    "ReqGetBlockTxsByEnum",
    "ReqGetByAccountByEnum",
    "ReqGetCandlesticksResolutionEnum",
    "ReqGetDepositHistoryFilterEnum",
    "ReqGetFundingsResolutionEnum",
    "ReqGetPositionFundingSideEnum",
    "ReqGetPublicPoolsFilterEnum",
    "ReqGetPublicPoolsMetadataFilterEnum",
    "ReqGetRangeWithIndexSortableSortEnum",
    "ReqGetTradesSortByEnum",
    "ReqGetTradesSortDirEnum",
    "ReqGetTxByEnum",
    "ReqGetWithdrawHistoryFilterEnum",
    "TradeTypeEnum",
    "TransferHistoryItemTypeEnum",
    "WithdrawHistoryItemStatusEnum",
    "WithdrawHistoryItemTypeEnum",
]);

let typeMap: {[index: string]: any} = {
    "Account": Account,
    "AccountApiKeys": AccountApiKeys,
    "AccountLimits": AccountLimits,
    "AccountMarginStats": AccountMarginStats,
    "AccountMarketStats": AccountMarketStats,
    "AccountMetadata": AccountMetadata,
    "AccountMetadatas": AccountMetadatas,
    "AccountPnL": AccountPnL,
    "AccountPosition": AccountPosition,
    "AccountStats": AccountStats,
    "AccountTradeStats": AccountTradeStats,
    "Announcement": Announcement,
    "Announcements": Announcements,
    "ApiKey": ApiKey,
    "Block": Block,
    "Blocks": Blocks,
    "BridgeSupportedNetwork": BridgeSupportedNetwork,
    "Candlestick": Candlestick,
    "Candlesticks": Candlesticks,
    "ContractAddress": ContractAddress,
    "CurrentHeight": CurrentHeight,
    "Cursor": Cursor,
    "DailyReturn": DailyReturn,
    "DepositHistory": DepositHistory,
    "DepositHistoryItem": DepositHistoryItem,
    "DetailedAccount": DetailedAccount,
    "DetailedAccounts": DetailedAccounts,
    "DetailedCandlestick": DetailedCandlestick,
    "EnrichedTx": EnrichedTx,
    "ExchangeStats": ExchangeStats,
    "ExportData": ExportData,
    "Funding": Funding,
    "FundingRate": FundingRate,
    "FundingRates": FundingRates,
    "Fundings": Fundings,
    "L1Metadata": L1Metadata,
    "L1ProviderInfo": L1ProviderInfo,
    "LiqTrade": LiqTrade,
    "Liquidation": Liquidation,
    "LiquidationInfo": LiquidationInfo,
    "LiquidationInfos": LiquidationInfos,
    "MarketInfo": MarketInfo,
    "NextNonce": NextNonce,
    "Order": Order,
    "OrderBook": OrderBook,
    "OrderBookDepth": OrderBookDepth,
    "OrderBookDetail": OrderBookDetail,
    "OrderBookDetails": OrderBookDetails,
    "OrderBookOrders": OrderBookOrders,
    "OrderBookStats": OrderBookStats,
    "OrderBooks": OrderBooks,
    "Orders": Orders,
    "PnLEntry": PnLEntry,
    "PositionFunding": PositionFunding,
    "PositionFundings": PositionFundings,
    "PriceLevel": PriceLevel,
    "PublicPool": PublicPool,
    "PublicPoolInfo": PublicPoolInfo,
    "PublicPoolMetadata": PublicPoolMetadata,
    "PublicPoolShare": PublicPoolShare,
    "PublicPools": PublicPools,
    "ReferralPointEntry": ReferralPointEntry,
    "ReferralPoints": ReferralPoints,
    "ReqExportData": ReqExportData,
    "ReqGetAccount": ReqGetAccount,
    "ReqGetAccountActiveOrders": ReqGetAccountActiveOrders,
    "ReqGetAccountApiKeys": ReqGetAccountApiKeys,
    "ReqGetAccountByL1Address": ReqGetAccountByL1Address,
    "ReqGetAccountInactiveOrders": ReqGetAccountInactiveOrders,
    "ReqGetAccountLimits": ReqGetAccountLimits,
    "ReqGetAccountMetadata": ReqGetAccountMetadata,
    "ReqGetAccountPnL": ReqGetAccountPnL,
    "ReqGetAccountTxs": ReqGetAccountTxs,
    "ReqGetBlock": ReqGetBlock,
    "ReqGetBlockTxs": ReqGetBlockTxs,
    "ReqGetByAccount": ReqGetByAccount,
    "ReqGetCandlesticks": ReqGetCandlesticks,
    "ReqGetDepositHistory": ReqGetDepositHistory,
    "ReqGetFastWithdrawInfo": ReqGetFastWithdrawInfo,
    "ReqGetFundings": ReqGetFundings,
    "ReqGetL1Metadata": ReqGetL1Metadata,
    "ReqGetL1Tx": ReqGetL1Tx,
    "ReqGetLatestDeposit": ReqGetLatestDeposit,
    "ReqGetLiquidationInfos": ReqGetLiquidationInfos,
    "ReqGetNextNonce": ReqGetNextNonce,
    "ReqGetOrderBookDetails": ReqGetOrderBookDetails,
    "ReqGetOrderBookOrders": ReqGetOrderBookOrders,
    "ReqGetOrderBooks": ReqGetOrderBooks,
    "ReqGetPositionFunding": ReqGetPositionFunding,
    "ReqGetPublicPools": ReqGetPublicPools,
    "ReqGetPublicPoolsMetadata": ReqGetPublicPoolsMetadata,
    "ReqGetRangeWithCursor": ReqGetRangeWithCursor,
    "ReqGetRangeWithIndex": ReqGetRangeWithIndex,
    "ReqGetRangeWithIndexSortable": ReqGetRangeWithIndexSortable,
    "ReqGetRecentTrades": ReqGetRecentTrades,
    "ReqGetReferralPoints": ReqGetReferralPoints,
    "ReqGetTrades": ReqGetTrades,
    "ReqGetTransferFeeInfo": ReqGetTransferFeeInfo,
    "ReqGetTransferHistory": ReqGetTransferHistory,
    "ReqGetTx": ReqGetTx,
    "ReqGetWithdrawHistory": ReqGetWithdrawHistory,
    "RespChangeAccountTier": RespChangeAccountTier,
    "RespGetFastBridgeInfo": RespGetFastBridgeInfo,
    "RespPublicPoolsMetadata": RespPublicPoolsMetadata,
    "RespSendTx": RespSendTx,
    "RespSendTxBatch": RespSendTxBatch,
    "RespWithdrawalDelay": RespWithdrawalDelay,
    "ResultCode": ResultCode,
    "RiskInfo": RiskInfo,
    "RiskParameters": RiskParameters,
    "SharePrice": SharePrice,
    "SimpleOrder": SimpleOrder,
    "Status": Status,
    "SubAccounts": SubAccounts,
    "Ticker": Ticker,
    "Trade": Trade,
    "Trades": Trades,
    "TransferFeeInfo": TransferFeeInfo,
    "TransferHistory": TransferHistory,
    "TransferHistoryItem": TransferHistoryItem,
    "Tx": Tx,
    "TxHash": TxHash,
    "TxHashes": TxHashes,
    "Txs": Txs,
    "ValidatorInfo": ValidatorInfo,
    "WithdrawHistory": WithdrawHistory,
    "WithdrawHistoryItem": WithdrawHistoryItem,
    "ZkLighterInfo": ZkLighterInfo,
}

type MimeTypeDescriptor = {
    type: string;
    subtype: string;
    subtypeTokens: string[];
};

/**
 * Every mime-type consists of a type, subtype, and optional parameters.
 * The subtype can be composite, including information about the content format.
 * For example: `application/json-patch+json`, `application/merge-patch+json`.
 *
 * This helper transforms a string mime-type into an internal representation.
 * This simplifies the implementation of predicates that in turn define common rules for parsing or stringifying
 * the payload.
 */
const parseMimeType = (mimeType: string): MimeTypeDescriptor => {
    const [type = '', subtype = ''] = mimeType.split('/');
    return {
        type,
        subtype,
        subtypeTokens: subtype.split('+'),
    };
};

type MimeTypePredicate = (mimeType: string) => boolean;

// This factory creates a predicate function that checks a string mime-type against defined rules.
const mimeTypePredicateFactory = (predicate: (descriptor: MimeTypeDescriptor) => boolean): MimeTypePredicate => (mimeType) => predicate(parseMimeType(mimeType));

// Use this factory when you need to define a simple predicate based only on type and, if applicable, subtype.
const mimeTypeSimplePredicateFactory = (type: string, subtype?: string): MimeTypePredicate => mimeTypePredicateFactory((descriptor) => {
    if (descriptor.type !== type) return false;
    if (subtype != null && descriptor.subtype !== subtype) return false;
    return true;
});

// Creating a set of named predicates that will help us determine how to handle different mime-types
const isTextLikeMimeType = mimeTypeSimplePredicateFactory('text');
const isJsonMimeType = mimeTypeSimplePredicateFactory('application', 'json');
const isJsonLikeMimeType = mimeTypePredicateFactory((descriptor) => descriptor.type === 'application' && descriptor.subtypeTokens.some((item) => item === 'json'));
const isOctetStreamMimeType = mimeTypeSimplePredicateFactory('application', 'octet-stream');
const isFormUrlencodedMimeType = mimeTypeSimplePredicateFactory('application', 'x-www-form-urlencoded');

// Defining a list of mime-types in the order of prioritization for handling.
const supportedMimeTypePredicatesWithPriority: MimeTypePredicate[] = [
    isJsonMimeType,
    isJsonLikeMimeType,
    isTextLikeMimeType,
    isOctetStreamMimeType,
    isFormUrlencodedMimeType,
];

const nullableSuffix = " | null";
const optionalSuffix = " | undefined";
const arrayPrefix = "Array<";
const arraySuffix = ">";
const mapPrefix = "{ [key: string]: ";
const mapSuffix = "; }";

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap.has(expectedType)) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    let mapping = typeMap[expectedType].mapping;
                    if (mapping != undefined && mapping[discriminatorType]) {
                        return mapping[discriminatorType]; // use the type given in the discriminator
                    } else if(typeMap[discriminatorType]) {
                        return discriminatorType;
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string, format: string): any {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.endsWith(nullableSuffix)) {
            let subType: string = type.slice(0, -nullableSuffix.length); // Type | null => Type
            return ObjectSerializer.serialize(data, subType, format);
        } else if (type.endsWith(optionalSuffix)) {
            let subType: string = type.slice(0, -optionalSuffix.length); // Type | undefined => Type
            return ObjectSerializer.serialize(data, subType, format);
        } else if (type.startsWith(arrayPrefix)) {
            let subType: string = type.slice(arrayPrefix.length, -arraySuffix.length); // Array<Type> => Type
            let transformedData: any[] = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.serialize(date, subType, format));
            }
            return transformedData;
        } else if (type.startsWith(mapPrefix)) {
            let subType: string = type.slice(mapPrefix.length, -mapSuffix.length); // { [key: string]: Type; } => Type
            let transformedData: { [key: string]: any } = {};
            for (let key in data) {
                transformedData[key] = ObjectSerializer.serialize(
                    data[key],
                    subType,
                    format,
                );
            }
            return transformedData;
        } else if (type === "Date") {
            if (!(data instanceof Date)) {
                return data;
            }
            if (format == "date") {
                let month = data.getMonth()+1
                let monthStr = month < 10 ? "0" + month.toString() : month.toString()
                let day = data.getDate();
                let dayStr = day < 10 ? "0" + day.toString() : day.toString();

                return data.getFullYear() + "-" + monthStr + "-" + dayStr;
            } else {
                return data.toISOString();
            }
        } else {
            if (enumsMap.has(type)) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: {[index: string]: any} = {};
            for (let attributeType of attributeTypes) {
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type, attributeType.format);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string, format: string): any {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.endsWith(nullableSuffix)) {
            let subType: string = type.slice(0, -nullableSuffix.length); // Type | null => Type
            return ObjectSerializer.deserialize(data, subType, format);
        } else if (type.endsWith(optionalSuffix)) {
            let subType: string = type.slice(0, -optionalSuffix.length); // Type | undefined => Type
            return ObjectSerializer.deserialize(data, subType, format);
        } else if (type.startsWith(arrayPrefix)) {
            let subType: string = type.slice(arrayPrefix.length, -arraySuffix.length); // Array<Type> => Type
            let transformedData: any[] = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.deserialize(date, subType, format));
            }
            return transformedData;
        } else if (type.startsWith(mapPrefix)) {
            let subType: string = type.slice(mapPrefix.length, -mapSuffix.length); // { [key: string]: Type; } => Type
            let transformedData: { [key: string]: any } = {};
            for (let key in data) {
                transformedData[key] = ObjectSerializer.deserialize(
                    data[key],
                    subType,
                    format,
                );
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap.has(type)) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let attributeType of attributeTypes) {
                let value = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type, attributeType.format);
                if (value !== undefined) {
                    instance[attributeType.name] = value;
                }
            }
            return instance;
        }
    }


    /**
     * Normalize media type
     *
     * We currently do not handle any media types attributes, i.e. anything
     * after a semicolon. All content is assumed to be UTF-8 compatible.
     */
    public static normalizeMediaType(mediaType: string | undefined): string | undefined {
        if (mediaType === undefined) {
            return undefined;
        }
        return (mediaType.split(";")[0] ?? '').trim().toLowerCase();
    }

    /**
     * From a list of possible media types, choose the one we can handle best.
     *
     * The order of the given media types does not have any impact on the choice
     * made.
     */
    public static getPreferredMediaType(mediaTypes: Array<string>): string {
        /** According to OAS 3 we should default to json */
        if (mediaTypes.length === 0) {
            return "application/json";
        }

        const normalMediaTypes = mediaTypes.map(ObjectSerializer.normalizeMediaType);

        for (const predicate of supportedMimeTypePredicatesWithPriority) {
            for (const mediaType of normalMediaTypes) {
                if (mediaType != null && predicate(mediaType)) {
                    return mediaType;
                }
            }
        }

        throw new Error("None of the given media types are supported: " + mediaTypes.join(", "));
    }

    /**
     * Convert data to a string according the given media type
     */
    public static stringify(data: any, mediaType: string): string {
        if (isTextLikeMimeType(mediaType)) {
            return String(data);
        }

        if (isJsonLikeMimeType(mediaType)) {
            return JSON.stringify(data);
        }

        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.stringify.");
    }

    /**
     * Parse data from a string according to the given media type
     */
    public static parse(rawData: string, mediaType: string | undefined) {
        if (mediaType === undefined) {
            throw new Error("Cannot parse content. No Content-Type defined.");
        }

        if (isTextLikeMimeType(mediaType)) {
            return rawData;
        }

        if (isJsonLikeMimeType(mediaType)) {
            return JSON.parse(rawData);
        }

        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.parse.");
    }
}
