# .CandlestickApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**candlesticks**](CandlestickApi.md#candlesticks) | **GET** /api/v1/candlesticks | candlesticks
[**fundings**](CandlestickApi.md#fundings) | **GET** /api/v1/fundings | fundings


# **candlesticks**
> Candlesticks candlesticks()

Get candlesticks

### Example


```typescript
import { createConfiguration, CandlestickApi } from '';
import type { CandlestickApiCandlesticksRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CandlestickApi(configuration);

const request: CandlestickApiCandlesticksRequest = {
  
  marketId: 1,
  
  resolution: "1m",
  
  startTimestamp: 0,
  
  endTimestamp: 0,
  
  countBack: 1,
  
  setTimestampToEnd: false,
};

const data = await apiInstance.candlesticks(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **marketId** | [**number**] |  | defaults to undefined
 **resolution** | [**&#39;1m&#39; | &#39;5m&#39; | &#39;15m&#39; | &#39;1h&#39; | &#39;4h&#39; | &#39;1d&#39;**]**Array<&#39;1m&#39; &#124; &#39;5m&#39; &#124; &#39;15m&#39; &#124; &#39;1h&#39; &#124; &#39;4h&#39; &#124; &#39;1d&#39;>** |  | defaults to undefined
 **startTimestamp** | [**number**] |  | defaults to undefined
 **endTimestamp** | [**number**] |  | defaults to undefined
 **countBack** | [**number**] |  | defaults to undefined
 **setTimestampToEnd** | [**boolean**] |  | (optional) defaults to false


### Return type

**Candlesticks**

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

# **fundings**
> Fundings fundings()

Get fundings

### Example


```typescript
import { createConfiguration, CandlestickApi } from '';
import type { CandlestickApiFundingsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CandlestickApi(configuration);

const request: CandlestickApiFundingsRequest = {
  
  marketId: 1,
  
  resolution: "1h",
  
  startTimestamp: 0,
  
  endTimestamp: 0,
  
  countBack: 1,
};

const data = await apiInstance.fundings(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **marketId** | [**number**] |  | defaults to undefined
 **resolution** | [**&#39;1h&#39; | &#39;1d&#39;**]**Array<&#39;1h&#39; &#124; &#39;1d&#39;>** |  | defaults to undefined
 **startTimestamp** | [**number**] |  | defaults to undefined
 **endTimestamp** | [**number**] |  | defaults to undefined
 **countBack** | [**number**] |  | defaults to undefined


### Return type

**Fundings**

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


