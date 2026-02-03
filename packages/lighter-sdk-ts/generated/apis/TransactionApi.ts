// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { DepositHistory } from '../models/DepositHistory';
import { EnrichedTx } from '../models/EnrichedTx';
import { NextNonce } from '../models/NextNonce';
import { RespSendTx } from '../models/RespSendTx';
import { RespSendTxBatch } from '../models/RespSendTxBatch';
import { ResultCode } from '../models/ResultCode';
import { TransferHistory } from '../models/TransferHistory';
import { Txs } from '../models/Txs';
import { WithdrawHistory } from '../models/WithdrawHistory';

/**
 * no description
 */
export class TransactionApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get transactions of a specific account
     * accountTxs
     * @param limit 
     * @param by 
     * @param value 
     * @param authorization 
     * @param index 
     * @param types 
     * @param auth 
     */
    public async accountTxs(limit: number, by: 'account_index', value: string, authorization?: string, index?: number, types?: Array<number>, auth?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("TransactionApi", "accountTxs", "limit");
        }


        // verify required parameter 'by' is not null or undefined
        if (by === null || by === undefined) {
            throw new RequiredError("TransactionApi", "accountTxs", "by");
        }


        // verify required parameter 'value' is not null or undefined
        if (value === null || value === undefined) {
            throw new RequiredError("TransactionApi", "accountTxs", "value");
        }






        // Path Params
        const localVarPath = '/api/v1/accountTxs';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (index !== undefined) {
            requestContext.setQueryParam("index", ObjectSerializer.serialize(index, "number", "int64"));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }

        // Query Params
        if (by !== undefined) {
            requestContext.setQueryParam("by", ObjectSerializer.serialize(by, "'account_index'", ""));
        }

        // Query Params
        if (value !== undefined) {
            requestContext.setQueryParam("value", ObjectSerializer.serialize(value, "string", ""));
        }

        // Query Params
        if (types !== undefined) {
            requestContext.setQueryParam("types", ObjectSerializer.serialize(types, "Array<number>", "uint8"));
        }

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Header Params
        requestContext.setHeaderParam("authorization", ObjectSerializer.serialize(authorization, "string", ""));


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get transactions in a block
     * blockTxs
     * @param by 
     * @param value 
     */
    public async blockTxs(by: 'block_height' | 'block_commitment', value: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'by' is not null or undefined
        if (by === null || by === undefined) {
            throw new RequiredError("TransactionApi", "blockTxs", "by");
        }


        // verify required parameter 'value' is not null or undefined
        if (value === null || value === undefined) {
            throw new RequiredError("TransactionApi", "blockTxs", "value");
        }


        // Path Params
        const localVarPath = '/api/v1/blockTxs';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (by !== undefined) {
            requestContext.setQueryParam("by", ObjectSerializer.serialize(by, "'block_height' | 'block_commitment'", ""));
        }

        // Query Params
        if (value !== undefined) {
            requestContext.setQueryParam("value", ObjectSerializer.serialize(value, "string", ""));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get deposit history
     * deposit_history
     * @param accountIndex 
     * @param l1Address 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     * @param cursor 
     * @param filter 
     */
    public async depositHistory(accountIndex: number, l1Address: string, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("TransactionApi", "depositHistory", "accountIndex");
        }


        // verify required parameter 'l1Address' is not null or undefined
        if (l1Address === null || l1Address === undefined) {
            throw new RequiredError("TransactionApi", "depositHistory", "l1Address");
        }






        // Path Params
        const localVarPath = '/api/v1/deposit/history';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
        }

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (l1Address !== undefined) {
            requestContext.setQueryParam("l1_address", ObjectSerializer.serialize(l1Address, "string", ""));
        }

        // Query Params
        if (cursor !== undefined) {
            requestContext.setQueryParam("cursor", ObjectSerializer.serialize(cursor, "string", ""));
        }

        // Query Params
        if (filter !== undefined) {
            requestContext.setQueryParam("filter", ObjectSerializer.serialize(filter, "'all' | 'pending' | 'claimable'", ""));
        }

        // Header Params
        requestContext.setHeaderParam("authorization", ObjectSerializer.serialize(authorization, "string", ""));


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get next nonce for a specific account and api key
     * nextNonce
     * @param accountIndex 
     * @param apiKeyIndex 
     */
    public async nextNonce(accountIndex: number, apiKeyIndex: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("TransactionApi", "nextNonce", "accountIndex");
        }


        // verify required parameter 'apiKeyIndex' is not null or undefined
        if (apiKeyIndex === null || apiKeyIndex === undefined) {
            throw new RequiredError("TransactionApi", "nextNonce", "apiKeyIndex");
        }


        // Path Params
        const localVarPath = '/api/v1/nextNonce';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
        }

        // Query Params
        if (apiKeyIndex !== undefined) {
            requestContext.setQueryParam("api_key_index", ObjectSerializer.serialize(apiKeyIndex, "number", "uint8"));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTx
     * @param txType 
     * @param txInfo 
     * @param priceProtection 
     */
    public async sendTx(txType: number, txInfo: string, priceProtection?: boolean, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'txType' is not null or undefined
        if (txType === null || txType === undefined) {
            throw new RequiredError("TransactionApi", "sendTx", "txType");
        }


        // verify required parameter 'txInfo' is not null or undefined
        if (txInfo === null || txInfo === undefined) {
            throw new RequiredError("TransactionApi", "sendTx", "txInfo");
        }



        // Path Params
        const localVarPath = '/api/v1/sendTx';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Form Params
        const useForm = canConsumeForm([
            'multipart/form-data',
        ]);

        let localVarFormParams
        if (useForm) {
            localVarFormParams = new FormData();
        } else {
            localVarFormParams = new URLSearchParams();
        }

        if (txType !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('tx_type', txType as any);
        }
        if (txInfo !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('tx_info', txInfo as any);
        }
        if (priceProtection !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('price_protection', priceProtection as any);
        }

        requestContext.setBody(localVarFormParams);

        if(!useForm) {
            const contentType = ObjectSerializer.getPreferredMediaType([
                "multipart/form-data"
            ]);
            requestContext.setHeaderParam("Content-Type", contentType);
        }

        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)
     * sendTxBatch
     * @param txTypes 
     * @param txInfos 
     */
    public async sendTxBatch(txTypes: string, txInfos: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'txTypes' is not null or undefined
        if (txTypes === null || txTypes === undefined) {
            throw new RequiredError("TransactionApi", "sendTxBatch", "txTypes");
        }


        // verify required parameter 'txInfos' is not null or undefined
        if (txInfos === null || txInfos === undefined) {
            throw new RequiredError("TransactionApi", "sendTxBatch", "txInfos");
        }


        // Path Params
        const localVarPath = '/api/v1/sendTxBatch';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Form Params
        const useForm = canConsumeForm([
            'multipart/form-data',
        ]);

        let localVarFormParams
        if (useForm) {
            localVarFormParams = new FormData();
        } else {
            localVarFormParams = new URLSearchParams();
        }

        if (txTypes !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('tx_types', txTypes as any);
        }
        if (txInfos !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('tx_infos', txInfos as any);
        }

        requestContext.setBody(localVarFormParams);

        if(!useForm) {
            const contentType = ObjectSerializer.getPreferredMediaType([
                "multipart/form-data"
            ]);
            requestContext.setHeaderParam("Content-Type", contentType);
        }

        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get transfer history
     * transfer_history
     * @param accountIndex 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     * @param cursor 
     */
    public async transferHistory(accountIndex: number, authorization?: string, auth?: string, cursor?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("TransactionApi", "transferHistory", "accountIndex");
        }





        // Path Params
        const localVarPath = '/api/v1/transfer/history';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
        }

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (cursor !== undefined) {
            requestContext.setQueryParam("cursor", ObjectSerializer.serialize(cursor, "string", ""));
        }

        // Header Params
        requestContext.setHeaderParam("authorization", ObjectSerializer.serialize(authorization, "string", ""));


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get transaction by hash or sequence index
     * tx
     * @param by 
     * @param value 
     */
    public async tx(by: 'hash' | 'sequence_index', value: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'by' is not null or undefined
        if (by === null || by === undefined) {
            throw new RequiredError("TransactionApi", "tx", "by");
        }


        // verify required parameter 'value' is not null or undefined
        if (value === null || value === undefined) {
            throw new RequiredError("TransactionApi", "tx", "value");
        }


        // Path Params
        const localVarPath = '/api/v1/tx';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (by !== undefined) {
            requestContext.setQueryParam("by", ObjectSerializer.serialize(by, "'hash' | 'sequence_index'", ""));
        }

        // Query Params
        if (value !== undefined) {
            requestContext.setQueryParam("value", ObjectSerializer.serialize(value, "string", ""));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get L1 transaction by L1 transaction hash
     * txFromL1TxHash
     * @param hash 
     */
    public async txFromL1TxHash(hash: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'hash' is not null or undefined
        if (hash === null || hash === undefined) {
            throw new RequiredError("TransactionApi", "txFromL1TxHash", "hash");
        }


        // Path Params
        const localVarPath = '/api/v1/txFromL1TxHash';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (hash !== undefined) {
            requestContext.setQueryParam("hash", ObjectSerializer.serialize(hash, "string", ""));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get transactions which are already packed into blocks
     * txs
     * @param limit 
     * @param index 
     */
    public async txs(limit: number, index?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("TransactionApi", "txs", "limit");
        }



        // Path Params
        const localVarPath = '/api/v1/txs';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (index !== undefined) {
            requestContext.setQueryParam("index", ObjectSerializer.serialize(index, "number", "int64"));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get withdraw history
     * withdraw_history
     * @param accountIndex 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     * @param cursor 
     * @param filter 
     */
    public async withdrawHistory(accountIndex: number, authorization?: string, auth?: string, cursor?: string, filter?: 'all' | 'pending' | 'claimable', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("TransactionApi", "withdrawHistory", "accountIndex");
        }






        // Path Params
        const localVarPath = '/api/v1/withdraw/history';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
        }

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (cursor !== undefined) {
            requestContext.setQueryParam("cursor", ObjectSerializer.serialize(cursor, "string", ""));
        }

        // Query Params
        if (filter !== undefined) {
            requestContext.setQueryParam("filter", ObjectSerializer.serialize(filter, "'all' | 'pending' | 'claimable'", ""));
        }

        // Header Params
        requestContext.setHeaderParam("authorization", ObjectSerializer.serialize(authorization, "string", ""));


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class TransactionApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to accountTxs
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async accountTxsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Txs >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Txs = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Txs", ""
            ) as Txs;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Txs = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Txs", ""
            ) as Txs;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to blockTxs
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async blockTxsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Txs >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Txs = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Txs", ""
            ) as Txs;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Txs = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Txs", ""
            ) as Txs;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to depositHistory
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async depositHistoryWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DepositHistory >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: DepositHistory = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DepositHistory", ""
            ) as DepositHistory;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: DepositHistory = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DepositHistory", ""
            ) as DepositHistory;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to nextNonce
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async nextNonceWithHttpInfo(response: ResponseContext): Promise<HttpInfo<NextNonce >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: NextNonce = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NextNonce", ""
            ) as NextNonce;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: NextNonce = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NextNonce", ""
            ) as NextNonce;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to sendTx
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async sendTxWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RespSendTx >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RespSendTx = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespSendTx", ""
            ) as RespSendTx;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: RespSendTx = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespSendTx", ""
            ) as RespSendTx;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to sendTxBatch
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async sendTxBatchWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RespSendTxBatch >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RespSendTxBatch = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespSendTxBatch", ""
            ) as RespSendTxBatch;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: RespSendTxBatch = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespSendTxBatch", ""
            ) as RespSendTxBatch;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to transferHistory
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async transferHistoryWithHttpInfo(response: ResponseContext): Promise<HttpInfo<TransferHistory >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: TransferHistory = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "TransferHistory", ""
            ) as TransferHistory;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: TransferHistory = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "TransferHistory", ""
            ) as TransferHistory;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to tx
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async txWithHttpInfo(response: ResponseContext): Promise<HttpInfo<EnrichedTx >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: EnrichedTx = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "EnrichedTx", ""
            ) as EnrichedTx;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: EnrichedTx = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "EnrichedTx", ""
            ) as EnrichedTx;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to txFromL1TxHash
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async txFromL1TxHashWithHttpInfo(response: ResponseContext): Promise<HttpInfo<EnrichedTx >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: EnrichedTx = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "EnrichedTx", ""
            ) as EnrichedTx;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: EnrichedTx = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "EnrichedTx", ""
            ) as EnrichedTx;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to txs
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async txsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Txs >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Txs = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Txs", ""
            ) as Txs;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Txs = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Txs", ""
            ) as Txs;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to withdrawHistory
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async withdrawHistoryWithHttpInfo(response: ResponseContext): Promise<HttpInfo<WithdrawHistory >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: WithdrawHistory = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "WithdrawHistory", ""
            ) as WithdrawHistory;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ResultCode = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ResultCode", ""
            ) as ResultCode;
            throw new ApiException<ResultCode>(response.httpStatusCode, "Bad request", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: WithdrawHistory = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "WithdrawHistory", ""
            ) as WithdrawHistory;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
