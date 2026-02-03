// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ExchangeStats } from '../models/ExchangeStats';
import { ExportData } from '../models/ExportData';
import { OrderBookDetails } from '../models/OrderBookDetails';
import { OrderBookOrders } from '../models/OrderBookOrders';
import { OrderBooks } from '../models/OrderBooks';
import { Orders } from '../models/Orders';
import { ResultCode } from '../models/ResultCode';
import { Trades } from '../models/Trades';

/**
 * no description
 */
export class OrderApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Export data
     * export
     * @param type 
     * @param authorization 
     * @param auth 
     * @param accountIndex 
     * @param marketId 
     */
    public async _export(type: 'funding' | 'trade', authorization?: string, auth?: string, accountIndex?: number, marketId?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'type' is not null or undefined
        if (type === null || type === undefined) {
            throw new RequiredError("OrderApi", "_export", "type");
        }






        // Path Params
        const localVarPath = '/api/v1/export';

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
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
        }

        // Query Params
        if (type !== undefined) {
            requestContext.setQueryParam("type", ObjectSerializer.serialize(type, "'funding' | 'trade'", ""));
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
     * Get account active orders. `auth` can be generated using the SDK.
     * accountActiveOrders
     * @param accountIndex 
     * @param marketId 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     */
    public async accountActiveOrders(accountIndex: number, marketId: number, authorization?: string, auth?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("OrderApi", "accountActiveOrders", "accountIndex");
        }


        // verify required parameter 'marketId' is not null or undefined
        if (marketId === null || marketId === undefined) {
            throw new RequiredError("OrderApi", "accountActiveOrders", "marketId");
        }




        // Path Params
        const localVarPath = '/api/v1/accountActiveOrders';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
        }

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
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
     * Get account inactive orders
     * accountInactiveOrders
     * @param accountIndex 
     * @param limit 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     * @param marketId 
     * @param askFilter 
     * @param betweenTimestamps 
     * @param cursor 
     */
    public async accountInactiveOrders(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, askFilter?: number, betweenTimestamps?: string, cursor?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("OrderApi", "accountInactiveOrders", "accountIndex");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("OrderApi", "accountInactiveOrders", "limit");
        }








        // Path Params
        const localVarPath = '/api/v1/accountInactiveOrders';

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
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
        }

        // Query Params
        if (askFilter !== undefined) {
            requestContext.setQueryParam("ask_filter", ObjectSerializer.serialize(askFilter, "number", "int8"));
        }

        // Query Params
        if (betweenTimestamps !== undefined) {
            requestContext.setQueryParam("between_timestamps", ObjectSerializer.serialize(betweenTimestamps, "string", ""));
        }

        // Query Params
        if (cursor !== undefined) {
            requestContext.setQueryParam("cursor", ObjectSerializer.serialize(cursor, "string", ""));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
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
     * Get exchange stats
     * exchangeStats
     */
    public async exchangeStats(_options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // Path Params
        const localVarPath = '/api/v1/exchangeStats';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get order books metadata
     * orderBookDetails
     * @param marketId 
     */
    public async orderBookDetails(marketId?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;


        // Path Params
        const localVarPath = '/api/v1/orderBookDetails';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get order book orders
     * orderBookOrders
     * @param marketId 
     * @param limit 
     */
    public async orderBookOrders(marketId: number, limit: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'marketId' is not null or undefined
        if (marketId === null || marketId === undefined) {
            throw new RequiredError("OrderApi", "orderBookOrders", "marketId");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("OrderApi", "orderBookOrders", "limit");
        }


        // Path Params
        const localVarPath = '/api/v1/orderBookOrders';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
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
     * Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.
     * orderBooks
     * @param marketId 
     */
    public async orderBooks(marketId?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;


        // Path Params
        const localVarPath = '/api/v1/orderBooks';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get recent trades
     * recentTrades
     * @param marketId 
     * @param limit 
     */
    public async recentTrades(marketId: number, limit: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'marketId' is not null or undefined
        if (marketId === null || marketId === undefined) {
            throw new RequiredError("OrderApi", "recentTrades", "marketId");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("OrderApi", "recentTrades", "limit");
        }


        // Path Params
        const localVarPath = '/api/v1/recentTrades';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
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
     * Get trades
     * trades
     * @param sortBy 
     * @param limit 
     * @param authorization 
     * @param auth 
     * @param marketId 
     * @param accountIndex 
     * @param orderIndex 
     * @param sortDir 
     * @param cursor 
     * @param _from 
     * @param askFilter 
     */
    public async trades(sortBy: 'block_height' | 'timestamp' | 'trade_id', limit: number, authorization?: string, auth?: string, marketId?: number, accountIndex?: number, orderIndex?: number, sortDir?: 'desc', cursor?: string, _from?: number, askFilter?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'sortBy' is not null or undefined
        if (sortBy === null || sortBy === undefined) {
            throw new RequiredError("OrderApi", "trades", "sortBy");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("OrderApi", "trades", "limit");
        }











        // Path Params
        const localVarPath = '/api/v1/trades';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (marketId !== undefined) {
            requestContext.setQueryParam("market_id", ObjectSerializer.serialize(marketId, "number", "uint8"));
        }

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
        }

        // Query Params
        if (orderIndex !== undefined) {
            requestContext.setQueryParam("order_index", ObjectSerializer.serialize(orderIndex, "number", "int64"));
        }

        // Query Params
        if (sortBy !== undefined) {
            requestContext.setQueryParam("sort_by", ObjectSerializer.serialize(sortBy, "'block_height' | 'timestamp' | 'trade_id'", ""));
        }

        // Query Params
        if (sortDir !== undefined) {
            requestContext.setQueryParam("sort_dir", ObjectSerializer.serialize(sortDir, "'desc'", ""));
        }

        // Query Params
        if (cursor !== undefined) {
            requestContext.setQueryParam("cursor", ObjectSerializer.serialize(cursor, "string", ""));
        }

        // Query Params
        if (_from !== undefined) {
            requestContext.setQueryParam("from", ObjectSerializer.serialize(_from, "number", "int64"));
        }

        // Query Params
        if (askFilter !== undefined) {
            requestContext.setQueryParam("ask_filter", ObjectSerializer.serialize(askFilter, "number", "int8"));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
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

export class OrderApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to _export
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async _exportWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ExportData >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ExportData = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ExportData", ""
            ) as ExportData;
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
            const body: ExportData = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ExportData", ""
            ) as ExportData;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to accountActiveOrders
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async accountActiveOrdersWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Orders >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Orders = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Orders", ""
            ) as Orders;
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
            const body: Orders = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Orders", ""
            ) as Orders;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to accountInactiveOrders
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async accountInactiveOrdersWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Orders >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Orders = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Orders", ""
            ) as Orders;
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
            const body: Orders = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Orders", ""
            ) as Orders;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to exchangeStats
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async exchangeStatsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ExchangeStats >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ExchangeStats = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ExchangeStats", ""
            ) as ExchangeStats;
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
            const body: ExchangeStats = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ExchangeStats", ""
            ) as ExchangeStats;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to orderBookDetails
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async orderBookDetailsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<OrderBookDetails >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: OrderBookDetails = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "OrderBookDetails", ""
            ) as OrderBookDetails;
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
            const body: OrderBookDetails = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "OrderBookDetails", ""
            ) as OrderBookDetails;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to orderBookOrders
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async orderBookOrdersWithHttpInfo(response: ResponseContext): Promise<HttpInfo<OrderBookOrders >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: OrderBookOrders = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "OrderBookOrders", ""
            ) as OrderBookOrders;
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
            const body: OrderBookOrders = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "OrderBookOrders", ""
            ) as OrderBookOrders;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to orderBooks
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async orderBooksWithHttpInfo(response: ResponseContext): Promise<HttpInfo<OrderBooks >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: OrderBooks = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "OrderBooks", ""
            ) as OrderBooks;
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
            const body: OrderBooks = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "OrderBooks", ""
            ) as OrderBooks;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to recentTrades
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async recentTradesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Trades >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Trades = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Trades", ""
            ) as Trades;
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
            const body: Trades = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Trades", ""
            ) as Trades;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to trades
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async tradesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Trades >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Trades = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Trades", ""
            ) as Trades;
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
            const body: Trades = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Trades", ""
            ) as Trades;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
