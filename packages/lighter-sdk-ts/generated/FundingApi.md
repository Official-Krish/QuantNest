# .FundingApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**fundingRates**](FundingApi.md#fundingRates) | **GET** /api/v1/funding-rates | funding-rates


# **fundingRates**
> FundingRates fundingRates()

Get funding rates

### Example


```typescript
import { createConfiguration, FundingApi } from '';

const configuration = createConfiguration();
const apiInstance = new FundingApi(configuration);

const request = {};

const data = await apiInstance.fundingRates(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**FundingRates**

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


