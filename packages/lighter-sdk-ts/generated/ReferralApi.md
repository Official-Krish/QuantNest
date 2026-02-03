# .ReferralApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**referralPoints**](ReferralApi.md#referralPoints) | **GET** /api/v1/referral/points | referral_points


# **referralPoints**
> ReferralPoints referralPoints()

Get referral points

### Example


```typescript
import { createConfiguration, ReferralApi } from '';
import type { ReferralApiReferralPointsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ReferralApi(configuration);

const request: ReferralApiReferralPointsRequest = {
  
  accountIndex: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
};

const data = await apiInstance.referralPoints(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined


### Return type

**ReferralPoints**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | A successful response. |  -  |
**400** | Bad request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


