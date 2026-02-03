# .InfoApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**transferFeeInfo**](InfoApi.md#transferFeeInfo) | **GET** /api/v1/transferFeeInfo | transferFeeInfo
[**withdrawalDelay**](InfoApi.md#withdrawalDelay) | **GET** /api/v1/withdrawalDelay | withdrawalDelay


# **transferFeeInfo**
> TransferFeeInfo transferFeeInfo()

Transfer fee info

### Example


```typescript
import { createConfiguration, InfoApi } from '';
import type { InfoApiTransferFeeInfoRequest } from '';

const configuration = createConfiguration();
const apiInstance = new InfoApi(configuration);

const request: InfoApiTransferFeeInfoRequest = {
  
  accountIndex: 1,
  
  authorization: "authorization_example",
  
  auth: "auth_example",
  
  toAccountIndex: -1,
};

const data = await apiInstance.transferFeeInfo(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined
 **toAccountIndex** | [**number**] |  | (optional) defaults to -1


### Return type

**TransferFeeInfo**

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

# **withdrawalDelay**
> RespWithdrawalDelay withdrawalDelay()

Withdrawal delay in seconds

### Example


```typescript
import { createConfiguration, InfoApi } from '';

const configuration = createConfiguration();
const apiInstance = new InfoApi(configuration);

const request = {};

const data = await apiInstance.withdrawalDelay(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**RespWithdrawalDelay**

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


