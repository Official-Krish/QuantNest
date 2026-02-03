// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ReferralPoints } from '../models/ReferralPoints';
import { ResultCode } from '../models/ResultCode';

/**
 * no description
 */
export class ReferralApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get referral points
     * referral_points
     * @param accountIndex 
     * @param authorization  make required after integ is done
     * @param auth  made optional to support header auth clients
     */
    public async referralPoints(accountIndex: number, authorization?: string, auth?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'accountIndex' is not null or undefined
        if (accountIndex === null || accountIndex === undefined) {
            throw new RequiredError("ReferralApi", "referralPoints", "accountIndex");
        }




        // Path Params
        const localVarPath = '/api/v1/referral/points';

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

        // Header Params
        requestContext.setHeaderParam("authorization", ObjectSerializer.serialize(authorization, "string", ""));


        
        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class ReferralApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to referralPoints
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async referralPointsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ReferralPoints >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ReferralPoints = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ReferralPoints", ""
            ) as ReferralPoints;
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
            const body: ReferralPoints = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ReferralPoints", ""
            ) as ReferralPoints;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
