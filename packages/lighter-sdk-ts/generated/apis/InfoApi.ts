// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { RespWithdrawalDelay } from '../models/RespWithdrawalDelay';
import { ResultCode } from '../models/ResultCode';
import { TransferFeeInfo } from '../models/TransferFeeInfo';

/**
 * no description
 */
export class InfoApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Transfer fee info
     * transferFeeInfo
     * @param accountIndex 
     * @param authorization 
     * @param auth 
     * @param toAccountIndex 
     */
    public async transferFeeInfo(accountIndex: number, authorization?: string, auth?: string, toAccountIndex?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("InfoApi", "transferFeeInfo", "accountIndex");
        }





        // Path Params
        const localVarPath = '/api/v1/transferFeeInfo';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
        }

        // Query Params
        if (toAccountIndex !== undefined) {
            requestContext.setQueryParam("to_account_index", ObjectSerializer.serialize(toAccountIndex, "number", "int64"));
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
     * Withdrawal delay in seconds
     * withdrawalDelay
     */
    public async withdrawalDelay(_options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // Path Params
        const localVarPath = '/api/v1/withdrawalDelay';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class InfoApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to transferFeeInfo
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async transferFeeInfoWithHttpInfo(response: ResponseContext): Promise<HttpInfo<TransferFeeInfo >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: TransferFeeInfo = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "TransferFeeInfo", ""
            ) as TransferFeeInfo;
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
            const body: TransferFeeInfo = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "TransferFeeInfo", ""
            ) as TransferFeeInfo;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to withdrawalDelay
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async withdrawalDelayWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RespWithdrawalDelay >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RespWithdrawalDelay = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespWithdrawalDelay", ""
            ) as RespWithdrawalDelay;
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
            const body: RespWithdrawalDelay = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespWithdrawalDelay", ""
            ) as RespWithdrawalDelay;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
