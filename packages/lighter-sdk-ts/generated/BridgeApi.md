# .BridgeApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**fastbridgeInfo**](BridgeApi.md#fastbridgeInfo) | **GET** /api/v1/fastbridge/info | fastbridge_info


# **fastbridgeInfo**
> RespGetFastBridgeInfo fastbridgeInfo()

Get fast bridge info

### Example


```typescript
import { createConfiguration, BridgeApi } from '';

const configuration = createConfiguration();
const apiInstance = new BridgeApi(configuration);

const request = {};

const data = await apiInstance.fastbridgeInfo(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**RespGetFastBridgeInfo**

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


