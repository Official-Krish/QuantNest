# .OrderApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**_export**](OrderApi.md#_export) | **GET** /api/v1/export | export
[**accountActiveOrders**](OrderApi.md#accountActiveOrders) | **GET** /api/v1/accountActiveOrders | accountActiveOrders
[**accountInactiveOrders**](OrderApi.md#accountInactiveOrders) | **GET** /api/v1/accountInactiveOrders | accountInactiveOrders
[**exchangeStats**](OrderApi.md#exchangeStats) | **GET** /api/v1/exchangeStats | exchangeStats
[**orderBookDetails**](OrderApi.md#orderBookDetails) | **GET** /api/v1/orderBookDetails | orderBookDetails
[**orderBookOrders**](OrderApi.md#orderBookOrders) | **GET** /api/v1/orderBookOrders | orderBookOrders
[**orderBooks**](OrderApi.md#orderBooks) | **GET** /api/v1/orderBooks | orderBooks
[**recentTrades**](OrderApi.md#recentTrades) | **GET** /api/v1/recentTrades | recentTrades
[**trades**](OrderApi.md#trades) | **GET** /api/v1/trades | trades


# **_export**
> ExportData _export()

Export data

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiExportRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiExportRequest = {
  
  type: "funding",
  
  authorization: "authorization_example",
  
  auth: "auth_example",
  
  accountIndex: -1,
  
  marketId: 255,
};

const data = await apiInstance._export(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**&#39;funding&#39; | &#39;trade&#39;**]**Array<&#39;funding&#39; &#124; &#39;trade&#39;>** |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined
 **accountIndex** | [**number**] |  | (optional) defaults to -1
 **marketId** | [**number**] |  | (optional) defaults to 255


### Return type

**ExportData**

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

# **accountActiveOrders**
> Orders accountActiveOrders()

Get account active orders. `auth` can be generated using the SDK.

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiAccountActiveOrdersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiAccountActiveOrdersRequest = {
  
  accountIndex: 1,
  
  marketId: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
};

const data = await apiInstance.accountActiveOrders(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **marketId** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined


### Return type

**Orders**

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

# **accountInactiveOrders**
> Orders accountInactiveOrders()

Get account inactive orders

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiAccountInactiveOrdersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiAccountInactiveOrdersRequest = {
  
  accountIndex: 1,
  
  limit: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
  
  marketId: 255,
  
  askFilter: -1,
  
  betweenTimestamps: "between_timestamps_example",
  
  cursor: "cursor_example",
};

const data = await apiInstance.accountInactiveOrders(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **limit** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined
 **marketId** | [**number**] |  | (optional) defaults to 255
 **askFilter** | [**number**] |  | (optional) defaults to -1
 **betweenTimestamps** | [**string**] |  | (optional) defaults to undefined
 **cursor** | [**string**] |  | (optional) defaults to undefined


### Return type

**Orders**

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

# **exchangeStats**
> ExchangeStats exchangeStats()

Get exchange stats

### Example


```typescript
import { createConfiguration, OrderApi } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request = {};

const data = await apiInstance.exchangeStats(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ExchangeStats**

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

# **orderBookDetails**
> OrderBookDetails orderBookDetails()

Get order books metadata

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiOrderBookDetailsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiOrderBookDetailsRequest = {
  
  marketId: 255,
};

const data = await apiInstance.orderBookDetails(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **marketId** | [**number**] |  | (optional) defaults to 255


### Return type

**OrderBookDetails**

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

# **orderBookOrders**
> OrderBookOrders orderBookOrders()

Get order book orders

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiOrderBookOrdersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiOrderBookOrdersRequest = {
  
  marketId: 1,
  
  limit: 1,
};

const data = await apiInstance.orderBookOrders(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **marketId** | [**number**] |  | defaults to undefined
 **limit** | [**number**] |  | defaults to undefined


### Return type

**OrderBookOrders**

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

# **orderBooks**
> OrderBooks orderBooks()

Get order books metadata.<hr>**Response Description:**<br><br>1) **Taker and maker fees** are in percentage.<br>2) **Min base amount:** The amount of base token that can be traded in a single order.<br>3) **Min quote amount:** The amount of quote token that can be traded in a single order.<br>4) **Supported size decimals:** The number of decimal places that can be used for the size of the order.<br>5) **Supported price decimals:** The number of decimal places that can be used for the price of the order.<br>6) **Supported quote decimals:** Size Decimals + Quote Decimals.

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiOrderBooksRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiOrderBooksRequest = {
  
  marketId: 255,
};

const data = await apiInstance.orderBooks(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **marketId** | [**number**] |  | (optional) defaults to 255


### Return type

**OrderBooks**

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

# **recentTrades**
> Trades recentTrades()

Get recent trades

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiRecentTradesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiRecentTradesRequest = {
  
  marketId: 1,
  
  limit: 1,
};

const data = await apiInstance.recentTrades(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **marketId** | [**number**] |  | defaults to undefined
 **limit** | [**number**] |  | defaults to undefined


### Return type

**Trades**

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

# **trades**
> Trades trades()

Get trades

### Example


```typescript
import { createConfiguration, OrderApi } from '';
import type { OrderApiTradesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrderApi(configuration);

const request: OrderApiTradesRequest = {
  
  sortBy: "block_height",
  
  limit: 1,
  
  authorization: "authorization_example",
  
  auth: "auth_example",
  
  marketId: 255,
  
  accountIndex: -1,
  
  orderIndex: 1,
  
  sortDir: "desc",
  
  cursor: "cursor_example",
  
  _from: -1,
  
  askFilter: -1,
};

const data = await apiInstance.trades(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sortBy** | [**&#39;block_height&#39; | &#39;timestamp&#39; | &#39;trade_id&#39;**]**Array<&#39;block_height&#39; &#124; &#39;timestamp&#39; &#124; &#39;trade_id&#39;>** |  | defaults to undefined
 **limit** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined
 **marketId** | [**number**] |  | (optional) defaults to 255
 **accountIndex** | [**number**] |  | (optional) defaults to -1
 **orderIndex** | [**number**] |  | (optional) defaults to undefined
 **sortDir** | [**&#39;desc&#39;**]**Array<&#39;desc&#39;>** |  | (optional) defaults to 'desc'
 **cursor** | [**string**] |  | (optional) defaults to undefined
 **_from** | [**number**] |  | (optional) defaults to -1
 **askFilter** | [**number**] |  | (optional) defaults to -1


### Return type

**Trades**

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


