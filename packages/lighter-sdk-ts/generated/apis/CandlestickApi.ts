// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { Candlesticks } from '../models/Candlesticks';
import { Fundings } from '../models/Fundings';
import { ResultCode } from '../models/ResultCode';

/**
 * no description
 */
export class CandlestickApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get candlesticks
     * candlesticks
     * @param marketId 
     * @param resolution 
     * @param startTimestamp 
     * @param endTimestamp 
     * @param countBack 
     * @param setTimestampToEnd 
     */
    public async candlesticks(marketId: number, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, setTimestampToEnd?: boolean, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'marketId' is not null or undefined
        if (marketId === null || marketId === undefined) {
            throw new RequiredError("CandlestickApi", "candlesticks", "marketId");
        }


        // verify required parameter 'resolution' is not null or undefined
        if (resolution === null || resolution === undefined) {
            throw new RequiredError("CandlestickApi", "candlesticks", "resolution");
        }


        // verify required parameter 'startTimestamp' is not null or undefined
        if (startTimestamp === null || startTimestamp === undefined) {
            throw new RequiredError("CandlestickApi", "candlesticks", "startTimestamp");
        }


        // verify required parameter 'endTimestamp' is not null or undefined
        if (endTimestamp === null || endTimestamp === undefined) {
            throw new RequiredError("CandlestickApi", "candlesticks", "endTimestamp");
        }


        // verify required parameter 'countBack' is not null or undefined
        if (countBack === null || countBack === undefined) {
            throw new RequiredError("CandlestickApi", "candlesticks", "countBack");
        }



        // Path Params
        const localVarPath = '/api/v1/candlesticks';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
        }

        // Query Params
        if (resolution !== undefined) {
            requestContext.setQueryParam("resolution", ObjectSerializer.serialize(resolution, "'1m' | '5m' | '15m' | '1h' | '4h' | '1d'", ""));
        }

        // Query Params
        if (startTimestamp !== undefined) {
            requestContext.setQueryParam("start_timestamp", ObjectSerializer.serialize(startTimestamp, "number", "int64"));
        }

        // Query Params
        if (endTimestamp !== undefined) {
            requestContext.setQueryParam("end_timestamp", ObjectSerializer.serialize(endTimestamp, "number", "int64"));
        }

        // Query Params
        if (countBack !== undefined) {
            requestContext.setQueryParam("count_back", ObjectSerializer.serialize(countBack, "number", "int64"));
        }

        // Query Params
        if (setTimestampToEnd !== undefined) {
            requestContext.setQueryParam("set_timestamp_to_end", ObjectSerializer.serialize(setTimestampToEnd, "boolean", "boolean"));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
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
    public async fundings(marketId: number, resolution: '1h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'marketId' is not null or undefined
        if (marketId === null || marketId === undefined) {
            throw new RequiredError("CandlestickApi", "fundings", "marketId");
        }


        // verify required parameter 'resolution' is not null or undefined
        if (resolution === null || resolution === undefined) {
            throw new RequiredError("CandlestickApi", "fundings", "resolution");
        }


        // verify required parameter 'startTimestamp' is not null or undefined
        if (startTimestamp === null || startTimestamp === undefined) {
            throw new RequiredError("CandlestickApi", "fundings", "startTimestamp");
        }


        // verify required parameter 'endTimestamp' is not null or undefined
        if (endTimestamp === null || endTimestamp === undefined) {
            throw new RequiredError("CandlestickApi", "fundings", "endTimestamp");
        }


        // verify required parameter 'countBack' is not null or undefined
        if (countBack === null || countBack === undefined) {
            throw new RequiredError("CandlestickApi", "fundings", "countBack");
        }


        // Path Params
        const localVarPath = '/api/v1/fundings';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
        }

        // Query Params
        if (resolution !== undefined) {
            requestContext.setQueryParam("resolution", ObjectSerializer.serialize(resolution, "'1h' | '1d'", ""));
        }

        // Query Params
        if (startTimestamp !== undefined) {
            requestContext.setQueryParam("start_timestamp", ObjectSerializer.serialize(startTimestamp, "number", "int64"));
        }

        // Query Params
        if (endTimestamp !== undefined) {
            requestContext.setQueryParam("end_timestamp", ObjectSerializer.serialize(endTimestamp, "number", "int64"));
        }

        // Query Params
        if (countBack !== undefined) {
            requestContext.setQueryParam("count_back", ObjectSerializer.serialize(countBack, "number", "int64"));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class CandlestickApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to candlesticks
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async candlesticksWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Candlesticks >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Candlesticks = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Candlesticks", ""
            ) as Candlesticks;
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
            const body: Candlesticks = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Candlesticks", ""
            ) as Candlesticks;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to fundings
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async fundingsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Fundings >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Fundings = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Fundings", ""
            ) as Fundings;
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
            const body: Fundings = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Fundings", ""
            ) as Fundings;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
