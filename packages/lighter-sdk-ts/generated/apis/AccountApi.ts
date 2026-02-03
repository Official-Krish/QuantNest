// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { AccountApiKeys } from '../models/AccountApiKeys';
import { AccountLimits } from '../models/AccountLimits';
import { AccountMetadatas } from '../models/AccountMetadatas';
import { AccountPnL } from '../models/AccountPnL';
import { DetailedAccounts } from '../models/DetailedAccounts';
import { L1Metadata } from '../models/L1Metadata';
import { LiquidationInfos } from '../models/LiquidationInfos';
import { PositionFundings } from '../models/PositionFundings';
import { PublicPools } from '../models/PublicPools';
import { RespChangeAccountTier } from '../models/RespChangeAccountTier';
import { RespPublicPoolsMetadata } from '../models/RespPublicPoolsMetadata';
import { ResultCode } from '../models/ResultCode';
import { SubAccounts } from '../models/SubAccounts';

/**
 * no description
 */
export class AccountApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.
     * account
     * @param by 
     * @param value 
     */
    public async account(by: 'index' | 'l1_address', value: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'by' is not null or undefined
        if (by === null || by === undefined) {
            throw new RequiredError("AccountApi", "account", "by");
        }


        // verify required parameter 'value' is not null or undefined
        if (value === null || value === undefined) {
            throw new RequiredError("AccountApi", "account", "value");
        }


        // Path Params
        const localVarPath = '/api/v1/account';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (by !== undefined) {
            requestContext.setQueryParam("by", ObjectSerializer.serialize(by, "'index' | 'l1_address'", ""));
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
     * Get account limits
     * accountLimits
     * @param accountIndex 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     */
    public async accountLimits(accountIndex: number, authorization?: string, auth?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("AccountApi", "accountLimits", "accountIndex");
        }




        // Path Params
        const localVarPath = '/api/v1/accountLimits';

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

        // Header Params
        requestContext.setHeaderParam("authorization", ObjectSerializer.serialize(authorization, "string", ""));


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get account metadatas
     * accountMetadata
     * @param by 
     * @param value 
     * @param authorization 
     * @param auth 
     */
    public async accountMetadata(by: 'index' | 'l1_address', value: string, authorization?: string, auth?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'by' is not null or undefined
        if (by === null || by === undefined) {
            throw new RequiredError("AccountApi", "accountMetadata", "by");
        }


        // verify required parameter 'value' is not null or undefined
        if (value === null || value === undefined) {
            throw new RequiredError("AccountApi", "accountMetadata", "value");
        }




        // Path Params
        const localVarPath = '/api/v1/accountMetadata';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (by !== undefined) {
            requestContext.setQueryParam("by", ObjectSerializer.serialize(by, "'index' | 'l1_address'", ""));
        }

        // Query Params
        if (value !== undefined) {
            requestContext.setQueryParam("value", ObjectSerializer.serialize(value, "string", ""));
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
     * Get accounts by l1_address returns all accounts associated with the given L1 address
     * accountsByL1Address
     * @param l1Address 
     */
    public async accountsByL1Address(l1Address: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'l1Address' is not null or undefined
        if (l1Address === null || l1Address === undefined) {
            throw new RequiredError("AccountApi", "accountsByL1Address", "l1Address");
        }


        // Path Params
        const localVarPath = '/api/v1/accountsByL1Address';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (l1Address !== undefined) {
            requestContext.setQueryParam("l1_address", ObjectSerializer.serialize(l1Address, "string", ""));
        }


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.
     * apikeys
     * @param accountIndex 
     * @param apiKeyIndex 
     */
    public async apikeys(accountIndex: number, apiKeyIndex?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("AccountApi", "apikeys", "accountIndex");
        }



        // Path Params
        const localVarPath = '/api/v1/apikeys';

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
     * Change account tier
     * changeAccountTier
     * @param accountIndex 
     * @param newTier 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     */
    public async changeAccountTier(accountIndex: number, newTier: string, authorization?: string, auth?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("AccountApi", "changeAccountTier", "accountIndex");
        }


        // verify required parameter 'newTier' is not null or undefined
        if (newTier === null || newTier === undefined) {
            throw new RequiredError("AccountApi", "changeAccountTier", "newTier");
        }




        // Path Params
        const localVarPath = '/api/v1/changeAccountTier';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Header Params
        requestContext.setHeaderParam("authorization", ObjectSerializer.serialize(authorization, "string", ""));

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

        if (auth !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('auth', auth as any);
        }
        if (accountIndex !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('account_index', accountIndex as any);
        }
        if (newTier !== undefined) {
             // TODO: replace .append with .set
             localVarFormParams.append('new_tier', newTier as any);
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
     * Get L1 metadata
     * l1Metadata
     * @param l1Address 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     */
    public async l1Metadata(l1Address: string, authorization?: string, auth?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'l1Address' is not null or undefined
        if (l1Address === null || l1Address === undefined) {
            throw new RequiredError("AccountApi", "l1Metadata", "l1Address");
        }




        // Path Params
        const localVarPath = '/api/v1/l1Metadata';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (l1Address !== undefined) {
            requestContext.setQueryParam("l1_address", ObjectSerializer.serialize(l1Address, "string", ""));
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
     * Get liquidation infos
     * liquidations
     * @param accountIndex 
     * @param limit 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     * @param marketId 
     * @param cursor 
     */
    public async liquidations(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("AccountApi", "liquidations", "accountIndex");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("AccountApi", "liquidations", "limit");
        }






        // Path Params
        const localVarPath = '/api/v1/liquidations';

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
     * Get account PnL chart
     * pnl
     * @param by 
     * @param value 
     * @param resolution 
     * @param startTimestamp 
     * @param endTimestamp 
     * @param countBack 
     * @param authorization 
     * @param auth 
     * @param ignoreTransfers 
     */
    public async pnl(by: 'index', value: string, resolution: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', startTimestamp: number, endTimestamp: number, countBack: number, authorization?: string, auth?: string, ignoreTransfers?: boolean, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'by' is not null or undefined
        if (by === null || by === undefined) {
            throw new RequiredError("AccountApi", "pnl", "by");
        }


        // verify required parameter 'value' is not null or undefined
        if (value === null || value === undefined) {
            throw new RequiredError("AccountApi", "pnl", "value");
        }


        // verify required parameter 'resolution' is not null or undefined
        if (resolution === null || resolution === undefined) {
            throw new RequiredError("AccountApi", "pnl", "resolution");
        }


        // verify required parameter 'startTimestamp' is not null or undefined
        if (startTimestamp === null || startTimestamp === undefined) {
            throw new RequiredError("AccountApi", "pnl", "startTimestamp");
        }


        // verify required parameter 'endTimestamp' is not null or undefined
        if (endTimestamp === null || endTimestamp === undefined) {
            throw new RequiredError("AccountApi", "pnl", "endTimestamp");
        }


        // verify required parameter 'countBack' is not null or undefined
        if (countBack === null || countBack === undefined) {
            throw new RequiredError("AccountApi", "pnl", "countBack");
        }





        // Path Params
        const localVarPath = '/api/v1/pnl';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (by !== undefined) {
            requestContext.setQueryParam("by", ObjectSerializer.serialize(by, "'index'", ""));
        }

        // Query Params
        if (value !== undefined) {
            requestContext.setQueryParam("value", ObjectSerializer.serialize(value, "string", ""));
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
        if (ignoreTransfers !== undefined) {
            requestContext.setQueryParam("ignore_transfers", ObjectSerializer.serialize(ignoreTransfers, "boolean", "boolean"));
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
     * Get accounts position fundings
     * positionFunding
     * @param accountIndex 
     * @param limit 
     * @param authorization 
     * @param auth 
     * @param marketId 
     * @param cursor 
     * @param side 
     */
    public async positionFunding(accountIndex: number, limit: number, authorization?: string, auth?: string, marketId?: number, cursor?: string, side?: 'long' | 'short' | 'all', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("AccountApi", "positionFunding", "accountIndex");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("AccountApi", "positionFunding", "limit");
        }







        // Path Params
        const localVarPath = '/api/v1/positionFunding';

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
        if (cursor !== undefined) {
            requestContext.setQueryParam("cursor", ObjectSerializer.serialize(cursor, "string", ""));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }

        // Query Params
        if (side !== undefined) {
            requestContext.setQueryParam("side", ObjectSerializer.serialize(side, "'long' | 'short' | 'all'", ""));
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
     * Get public pools
     * publicPools
     * @param index 
     * @param limit 
     * @param authorization 
     * @param auth 
     * @param filter 
     * @param accountIndex 
     */
    public async publicPools(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'index' is not null or undefined
        if (index === null || index === undefined) {
            throw new RequiredError("AccountApi", "publicPools", "index");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("AccountApi", "publicPools", "limit");
        }






        // Path Params
        const localVarPath = '/api/v1/publicPools';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (filter !== undefined) {
            requestContext.setQueryParam("filter", ObjectSerializer.serialize(filter, "'all' | 'user' | 'protocol' | 'account_index'", ""));
        }

        // Query Params
        if (index !== undefined) {
            requestContext.setQueryParam("index", ObjectSerializer.serialize(index, "number", "int64"));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
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
     * Get public pools metadata
     * publicPoolsMetadata
     * @param index 
     * @param limit 
     * @param authorization 
     * @param auth 
     * @param filter 
     * @param accountIndex 
     */
    public async publicPoolsMetadata(index: number, limit: number, authorization?: string, auth?: string, filter?: 'all' | 'user' | 'protocol' | 'account_index', accountIndex?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'index' is not null or undefined
        if (index === null || index === undefined) {
            throw new RequiredError("AccountApi", "publicPoolsMetadata", "index");
        }


        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("AccountApi", "publicPoolsMetadata", "limit");
        }






        // Path Params
        const localVarPath = '/api/v1/publicPoolsMetadata';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (auth !== undefined) {
            requestContext.setQueryParam("auth", ObjectSerializer.serialize(auth, "string", ""));
        }

        // Query Params
        if (filter !== undefined) {
            requestContext.setQueryParam("filter", ObjectSerializer.serialize(filter, "'all' | 'user' | 'protocol' | 'account_index'", ""));
        }

        // Query Params
        if (index !== undefined) {
            requestContext.setQueryParam("index", ObjectSerializer.serialize(index, "number", "int64"));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }

        // Query Params
        if (accountIndex !== undefined) {
            requestContext.setQueryParam("account_index", ObjectSerializer.serialize(accountIndex, "number", "int64"));
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

export class AccountApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to account
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async accountWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DetailedAccounts >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: DetailedAccounts = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DetailedAccounts", ""
            ) as DetailedAccounts;
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
            const body: DetailedAccounts = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DetailedAccounts", ""
            ) as DetailedAccounts;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to accountLimits
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async accountLimitsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<AccountLimits >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: AccountLimits = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountLimits", ""
            ) as AccountLimits;
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
            const body: AccountLimits = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountLimits", ""
            ) as AccountLimits;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to accountMetadata
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async accountMetadataWithHttpInfo(response: ResponseContext): Promise<HttpInfo<AccountMetadatas >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: AccountMetadatas = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountMetadatas", ""
            ) as AccountMetadatas;
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
            const body: AccountMetadatas = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountMetadatas", ""
            ) as AccountMetadatas;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to accountsByL1Address
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async accountsByL1AddressWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubAccounts >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: SubAccounts = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubAccounts", ""
            ) as SubAccounts;
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
            const body: SubAccounts = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubAccounts", ""
            ) as SubAccounts;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to apikeys
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async apikeysWithHttpInfo(response: ResponseContext): Promise<HttpInfo<AccountApiKeys >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: AccountApiKeys = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountApiKeys", ""
            ) as AccountApiKeys;
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
            const body: AccountApiKeys = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountApiKeys", ""
            ) as AccountApiKeys;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to changeAccountTier
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async changeAccountTierWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RespChangeAccountTier >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RespChangeAccountTier = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespChangeAccountTier", ""
            ) as RespChangeAccountTier;
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
            const body: RespChangeAccountTier = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespChangeAccountTier", ""
            ) as RespChangeAccountTier;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to l1Metadata
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async l1MetadataWithHttpInfo(response: ResponseContext): Promise<HttpInfo<L1Metadata >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: L1Metadata = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "L1Metadata", ""
            ) as L1Metadata;
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
            const body: L1Metadata = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "L1Metadata", ""
            ) as L1Metadata;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to liquidations
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async liquidationsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<LiquidationInfos >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: LiquidationInfos = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "LiquidationInfos", ""
            ) as LiquidationInfos;
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
            const body: LiquidationInfos = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "LiquidationInfos", ""
            ) as LiquidationInfos;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to pnl
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async pnlWithHttpInfo(response: ResponseContext): Promise<HttpInfo<AccountPnL >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: AccountPnL = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountPnL", ""
            ) as AccountPnL;
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
            const body: AccountPnL = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AccountPnL", ""
            ) as AccountPnL;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to positionFunding
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async positionFundingWithHttpInfo(response: ResponseContext): Promise<HttpInfo<PositionFundings >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: PositionFundings = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PositionFundings", ""
            ) as PositionFundings;
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
            const body: PositionFundings = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PositionFundings", ""
            ) as PositionFundings;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to publicPools
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async publicPoolsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<PublicPools >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: PublicPools = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PublicPools", ""
            ) as PublicPools;
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
            const body: PublicPools = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "PublicPools", ""
            ) as PublicPools;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to publicPoolsMetadata
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async publicPoolsMetadataWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RespPublicPoolsMetadata >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RespPublicPoolsMetadata = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespPublicPoolsMetadata", ""
            ) as RespPublicPoolsMetadata;
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
            const body: RespPublicPoolsMetadata = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RespPublicPoolsMetadata", ""
            ) as RespPublicPoolsMetadata;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
