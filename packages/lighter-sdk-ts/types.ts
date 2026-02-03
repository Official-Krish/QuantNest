import { RespSendTx } from "./generated";

export interface ApiKeyResponse {
    privateKey: string | null;
    publicKey: string | null;
    err: string | null;
}

export interface StrOrErr {
    str: string | null;
    err: string | null;
}

export interface SignResult {
    txInfo: string | null;
    error: string | null;
}

export interface TxHash {
    hash: string;
}

export interface CreateOrderParams {
    marketIndex: number;
    clientOrderIndex: number;
    baseAmount: number;
    price: number;
    isAsk: boolean;
    orderType: number;
    timeInForce: number;
    reduceOnly: number;
    triggerPrice: number;
    orderExpiry?: number;
}

export interface TxResponse {
    apiResponse: RespSendTx;
    error: string | null;
    txInfo: string | null;
}