import { read, dlopen, FFIType, suffix, ptr, CString, toArrayBuffer } from 'bun:ffi';
import * as os from 'os';
import * as path from 'path';
import {
    NonceManager,
    nonceManagerFactory,
    NonceManagerType,
    OptimisticNonceManager
} from './nonce_manager';
import { StrOrErr, SignResult, type CreateOrderParams, TxResponse } from './types';
import { ValidationError, SignerError } from './errors';
import { TransactionApi, AccountApi, ServerConfiguration, IsomorphicFetchHttpLibrary, ApiKeyAuthentication, OrderApi, RespSendTx } from './generated';
import { Configuration } from './generated/configuration';

export const CODE_OK = 200;

// Define C structure layouts for Bun FFI
const StrOrErrStruct = {
    str: FFIType.cstring,
    err: FFIType.cstring
};

interface SignerLibrary {
    symbols: {
        CreateClient: {
            args: [FFIType.cstring, FFIType.cstring, FFIType.i32, FFIType.i32, FFIType.i64];
            returns: FFIType.cstring;
        };
        SignCreateOrder: {
            args: [FFIType.i32, FFIType.i64, FFIType.i64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i64, FFIType.i64];
            returns: FFIType.ptr;
        };
        SignCancelAllOrders: {
            args: [FFIType.i32, FFIType.i64, FFIType.i64];
            returns: FFIType.ptr
        };
        SignCancelOrder: {
            args: [FFIType.i32, FFIType.i64, FFIType.i64];
            returns: FFIType.ptr
        };
    };
}

function initializeSigner(): SignerLibrary {
    const platform = os.platform();
    const arch = os.arch();
    const currentDir = __dirname;
    const signerPath = path.join(currentDir, 'signers');

    let libPath: string;

    console.log("before");
    if (platform === 'darwin' && arch === 'arm64') {
        console.log("macOS");
        libPath = path.join(signerPath, 'signer-arm64.dylib');
    } else if (platform === 'linux' && (arch === 'x64' || arch === 'x86_64')) {
        libPath = path.join(signerPath, 'signer-amd64.so');
    } else if (platform === 'win32' && (arch === 'x64' || arch === 'x86_64')) {
        libPath = path.join(signerPath, 'signer-amd64.dll');
    } else {
        throw new SignerError(
            `Unsupported platform/architecture: ${platform}/${arch}. ` +
            'Currently supported: Linux(x86_64), macOS(arm64), and Windows(x86_64).'
        );
    }

    return dlopen(libPath, {
        CreateClient: {
            args: [FFIType.cstring, FFIType.cstring, FFIType.i32, FFIType.i32, FFIType.i64],
            returns: FFIType.cstring
        },
        SignCreateOrder: {
            args: [FFIType.i32, FFIType.i64, FFIType.i64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i64, FFIType.i64],
            returns: FFIType.ptr
        },
        SignCancelAllOrders: {
            args: [FFIType.i32, FFIType.i64, FFIType.i64],
            returns: FFIType.ptr
        },
        SignCancelOrder: {
            args: [FFIType.i32, FFIType.i64, FFIType.i64],
            returns: FFIType.ptr
        }
    }) as unknown as SignerLibrary;
}


const POINTER_SIZE = 8;


function readStrOrErr(resultPtr: number): { str: string | null; err: string | null } {
   
    let str = new CString(resultPtr).toString();
    let err = new CString(resultPtr + str.length).toString();
    console.log(str)
    console.log(err)
    return { str, err };
}

export interface SignerClientOptions {
    url: string;
    privateKey: string;
    apiKeyIndex: number;
    accountIndex: number;
    maxApiKeyIndex?: number;
    privateKeys?: Record<number, string>;
    nonceManagementType?: NonceManagerType;
}

export class SignerClient {
    // Constants
    static readonly USDC_TICKER_SCALE = 1e6;

    // Transaction types
    static readonly TX_TYPE_CHANGE_PUB_KEY = 8;
    static readonly TX_TYPE_CREATE_SUB_ACCOUNT = 9;
    static readonly TX_TYPE_CREATE_PUBLIC_POOL = 10;
    static readonly TX_TYPE_UPDATE_PUBLIC_POOL = 11;
    static readonly TX_TYPE_TRANSFER = 12;
    static readonly TX_TYPE_WITHDRAW = 13;
    static readonly TX_TYPE_CREATE_ORDER = 14;
    static readonly TX_TYPE_CANCEL_ORDER = 15;
    static readonly TX_TYPE_CANCEL_ALL_ORDERS = 16;
    static readonly TX_TYPE_MODIFY_ORDER = 17;
    static readonly TX_TYPE_MINT_SHARES = 18;
    static readonly TX_TYPE_BURN_SHARES = 19;
    static readonly TX_TYPE_UPDATE_LEVERAGE = 20;

    // Order types
    static readonly ORDER_TYPE_LIMIT = 0;
    static readonly ORDER_TYPE_MARKET = 1;
    static readonly ORDER_TYPE_STOP_LOSS = 2;
    static readonly ORDER_TYPE_STOP_LOSS_LIMIT = 3;
    static readonly ORDER_TYPE_TAKE_PROFIT = 4;
    static readonly ORDER_TYPE_TAKE_PROFIT_LIMIT = 5;
    static readonly ORDER_TYPE_TWAP = 6;

    // Time in force
    static readonly ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL = 0;
    static readonly ORDER_TIME_IN_FORCE_GOOD_TILL_TIME = 1;
    static readonly ORDER_TIME_IN_FORCE_POST_ONLY = 2;

    // Cancel all TIF
    static readonly CANCEL_ALL_TIF_IMMEDIATE = 0;
    static readonly CANCEL_ALL_TIF_SCHEDULED = 1;
    static readonly CANCEL_ALL_TIF_ABORT = 2;

    static readonly NIL_TRIGGER_PRICE = 0;
    static readonly DEFAULT_28_DAY_ORDER_EXPIRY = -1;
    static readonly DEFAULT_IOC_EXPIRY = 0;
    static readonly DEFAULT_10_MIN_AUTH_EXPIRY = -1;
    static readonly MINUTE = 60;

    // Margin modes
    static readonly CROSS_MARGIN_MODE = 0;
    static readonly ISOLATED_MARGIN_MODE = 1;

    // Instance properties
    private url: string;
    private privateKey: string;
    private chainId: number;
    private apiKeyIndex: number;
    private endApiKeyIndex: number;
    private apiKeyDict: Record<number, string>;
    private accountIndex: number;
    private signer: SignerLibrary;
    private txApi: TransactionApi;
    private nonceManager: NonceManager;
    private orderApi: OrderApi;

    private constructor(options: SignerClientOptions & { 
        nonceManager?: NonceManager;
        signer: SignerLibrary;
        apiKeyDict: Record<number, string>;
        endApiKeyIndex: number;
        cleanPrivateKey: string;
    }) {
        this.url = options.url;
        this.privateKey = options.cleanPrivateKey;
        this.chainId = options.url.includes('mainnet') ? 304 : 300;
        this.apiKeyIndex = options.apiKeyIndex;
        this.endApiKeyIndex = options.endApiKeyIndex;
        this.apiKeyDict = options.apiKeyDict;
        this.accountIndex = options.accountIndex;
        this.signer = options.signer;
        this.nonceManager = options.nonceManager ?? new OptimisticNonceManager(options.accountIndex, this.url, options.apiKeyIndex, options.endApiKeyIndex);
        this.txApi = new TransactionApi({
            baseServer:  new ServerConfiguration<{  }>(this.url, {  }),
            httpApi: new IsomorphicFetchHttpLibrary(),
            middleware: [],
            authMethods: {
                apiKey: new ApiKeyAuthentication(this.apiKeyDict[this.apiKeyIndex] ?? '')
            }
        });
        this.orderApi = new OrderApi({
            baseServer:  new ServerConfiguration<{  }>(this.url, {  }),
            httpApi: new IsomorphicFetchHttpLibrary(),
            middleware: [],
            authMethods: {
                apiKey: new ApiKeyAuthentication(this.apiKeyDict[this.apiKeyIndex] ?? '')
            }
        });
        // Create clients for all API keys
        for (let apiKey = this.apiKeyIndex; apiKey <= this.endApiKeyIndex; apiKey++) {
            this.createClient(apiKey);
        }
    }

    static async create(options: SignerClientOptions): Promise<SignerClient> {
        const {
            url,
            privateKey: rawPrivateKey,
            apiKeyIndex,
            accountIndex,
            maxApiKeyIndex = -1,
            privateKeys = {},
            nonceManagementType = NonceManagerType.OPTIMISTIC
        } = options;

        // Clean private key
        const cleanPrivateKey = rawPrivateKey.startsWith('0x') 
            ? rawPrivateKey.slice(2) 
            : rawPrivateKey;

        const apiKeyDict = SignerClient.buildApiKeyDict(apiKeyIndex, cleanPrivateKey, privateKeys);
        
        const endApiKeyIndex = maxApiKeyIndex === -1 ? apiKeyIndex : maxApiKeyIndex;
        
        // Initialize signer
        const signer = initializeSigner();

        // Initialize nonce manager
        const nonceManager = await nonceManagerFactory(
            nonceManagementType,
            accountIndex,
            url,
            apiKeyIndex,
            endApiKeyIndex
        );

        return new SignerClient({
            ...options,
            nonceManager,
            signer,
            apiKeyDict,
            endApiKeyIndex,
            cleanPrivateKey
        });
    }

    private static buildApiKeyDict(
        apiKeyIndex: number,
        privateKey: string,
        privateKeys: Record<number, string>
    ): Record<number, string> {
        const dict: Record<number, string> = { [apiKeyIndex]: privateKey };
        
        for (const [index, key] of Object.entries(privateKeys)) {
            const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
            dict[Number(index)] = cleanKey;
        }
        
        return dict;
    }

    private createClient(apiKeyIndex?: number): void {
        const effectiveApiKeyIndex = apiKeyIndex ?? this.apiKeyIndex;
    
        // Convert strings to null-terminated buffers
        const urlBuffer = Buffer.from(this.url + '\0', 'utf-8');
        const privateKeyBuffer = Buffer.from((this.apiKeyDict[effectiveApiKeyIndex] ?? '') + '\0', 'utf-8');
    
        const err = this.signer.symbols.CreateClient(
            ptr(urlBuffer),
            ptr(privateKeyBuffer),
            this.chainId,
            effectiveApiKeyIndex,
            this.accountIndex
        );
    
        if (err && typeof err === 'number' && err !== 0) {
            const errorStr = new CString(err);
            throw new SignerError(errorStr.toString());
        }
    }

    private async getNextNonce(): Promise<[number, number]> {
        const result = this.nonceManager.nextNonce();
        
        // Handle both sync and async nonce managers
        if (result instanceof Promise) {
            return await result;
        }
        return result;
    }

    async createOrder(params: CreateOrderParams): Promise<TxResponse> {
        const {
            marketIndex,
            clientOrderIndex,
            baseAmount,
            price,
            isAsk,
            orderType,
            timeInForce,
            reduceOnly,
            triggerPrice,
            orderExpiry = SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY
        } = params;

        // Get next nonce
        const [apiKeyIndex, nonce] = await this.getNextNonce();

        try {
            // Sign the order
            const signResult = this.signCreateOrder(
                marketIndex,
                clientOrderIndex,
                baseAmount,
                price,
                isAsk,
                orderType,
                timeInForce,
                reduceOnly,
                triggerPrice,
                orderExpiry,
                nonce
            );

            if (signResult.error) {
                throw new SignerError(`Failed to sign order: ${signResult.error}`);
            }

            if (!signResult.txInfo) {
                throw new SignerError('No transaction data returned from signer');
            }

            const apiResponse = await this.sendTx(SignerClient.TX_TYPE_CREATE_ORDER, signResult.txInfo);
            return {
                txInfo: signResult.txInfo,
                error: null,
                apiResponse: apiResponse
            }
        } catch (error) {
            // Acknowledge failure to decrement nonce if using optimistic nonce manager
            this.nonceManager.acknowledgeFailure(apiKeyIndex);
            throw error;
        }
    }

    async cancelOrder(marketIndex: number, clientOrderIndex: number): Promise<TxResponse> {

        const [apiKeyIndex, nonce] = await this.getNextNonce();
        
        try {
            const signResult = this.signCancelOrder(
                marketIndex,
                clientOrderIndex,
                nonce
            );

            if (signResult.error) {
                throw new SignerError(`Failed to sign cancel order: ${signResult.error}`);
            }

            if (!signResult.txInfo) {
                throw new SignerError('No transaction data returned from signer');
            }

            const apiResponse = await this.sendTx(SignerClient.TX_TYPE_CANCEL_ORDER, signResult.txInfo);
            return {
                txInfo: signResult.txInfo,
                error: null,
                apiResponse: apiResponse
            };
        } catch (error) {
            // Acknowledge failure to decrement nonce if using optimistic nonce manager
            this.nonceManager.acknowledgeFailure(apiKeyIndex);
            throw error;
        }
    }

    async sendTx(tx_type: number, tx_info: string): Promise<RespSendTx> {
        const response = await this.txApi.sendTx(tx_type, tx_info, true);
        return response;
    }

    signCreateOrder(
        marketIndex: number,
        clientOrderIndex: number,
        baseAmount: number,
        price: number,
        isAsk: boolean,
        orderType: number,
        timeInForce: number,
        reduceOnly: number,
        triggerPrice: number,
        orderExpiry: number = SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY,
        nonce: number = -1
    ): SignResult {
        const resultPtr = this.signer.symbols.SignCreateOrder(
            marketIndex,
            clientOrderIndex,
            baseAmount,
            price,
            isAsk ? 1 : 0,
            orderType,
            timeInForce,
            reduceOnly,
            triggerPrice,
            orderExpiry,
            nonce
        );

        console.log(resultPtr);
        const result = readStrOrErr(resultPtr);

        return {
            txInfo: result.str ? result.str.toString() : null,
            error: result.err ? result.err.toString() : null
        };
    }

    signCancelAllOrders(
        timeInForce: number,
        time: number,
        nonce: number = -1
    ): SignResult {
        const resultPtr = this.signer.symbols.SignCancelAllOrders(timeInForce, time, nonce);
        const result = readStrOrErr(resultPtr);

        return {
            txInfo: result.str ? result.str.toString() : null,
            error: result.err ? result.err.toString() : null
        };
    }

    signCancelOrder(
        marketIndex: number,
        clientOrderIndex: number,
        nonce: number = -1
    ): SignResult {
        const resultPtr = this.signer.symbols.SignCancelOrder(marketIndex, clientOrderIndex, nonce);
        const result = readStrOrErr(resultPtr);

        return {
            txInfo: result.str ? result.str.toString() : null,
            error: result.err ? result.err.toString() : null
        };
    }

    getNonceManager(): NonceManager | undefined {
        return this.nonceManager;
    }
}