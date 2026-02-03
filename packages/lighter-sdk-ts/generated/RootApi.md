# .RootApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**info**](RootApi.md#info) | **GET** /info | info
[**status**](RootApi.md#status) | **GET** / | status


# **info**
> ZkLighterInfo info()

Get info of zklighter

### Example


```typescript
import { createConfiguration, RootApi } from '';

const configuration = createConfiguration();
const apiInstance = new RootApi(configuration);

const request = {};

const data = await apiInstance.info(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ZkLighterInfo**

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

# **status**
> Status status()

Get status of zklighter

### Example


```typescript
import { createConfiguration, RootApi } from '';

const configuration = createConfiguration();
const apiInstance = new RootApi(configuration);

const request = {};

const data = await apiInstance.status(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Status**

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


