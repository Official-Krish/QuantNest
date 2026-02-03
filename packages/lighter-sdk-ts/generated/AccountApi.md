# .AccountApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**account**](AccountApi.md#account) | **GET** /api/v1/account | account
[**accountLimits**](AccountApi.md#accountLimits) | **GET** /api/v1/accountLimits | accountLimits
[**accountMetadata**](AccountApi.md#accountMetadata) | **GET** /api/v1/accountMetadata | accountMetadata
[**accountsByL1Address**](AccountApi.md#accountsByL1Address) | **GET** /api/v1/accountsByL1Address | accountsByL1Address
[**apikeys**](AccountApi.md#apikeys) | **GET** /api/v1/apikeys | apikeys
[**changeAccountTier**](AccountApi.md#changeAccountTier) | **POST** /api/v1/changeAccountTier | changeAccountTier
[**l1Metadata**](AccountApi.md#l1Metadata) | **GET** /api/v1/l1Metadata | l1Metadata
[**liquidations**](AccountApi.md#liquidations) | **GET** /api/v1/liquidations | liquidations
[**pnl**](AccountApi.md#pnl) | **GET** /api/v1/pnl | pnl
[**positionFunding**](AccountApi.md#positionFunding) | **GET** /api/v1/positionFunding | positionFunding
[**publicPools**](AccountApi.md#publicPools) | **GET** /api/v1/publicPools | publicPools
[**publicPoolsMetadata**](AccountApi.md#publicPoolsMetadata) | **GET** /api/v1/publicPoolsMetadata | publicPoolsMetadata


# **account**
> DetailedAccounts account()

Get account by account\'s index. <br>More details about account index: [Account Index](https://apidocs.lighter.xyz/docs/account-index)<hr>**Response Description:**<br><br>1) **Status:** 1 is active 0 is inactive.<br>2) **Collateral:** The amount of collateral in the account.<hr>**Position Details Description:**<br>1) **OOC:** Open order count in that market.<br>2) **Sign:** 1 for Long, -1 for Short.<br>3) **Position:** The amount of position in that market.<br>4) **Avg Entry Price:** The average entry price of the position.<br>5) **Position Value:** The value of the position.<br>6) **Unrealized PnL:** The unrealized profit and loss of the position.<br>7) **Realized PnL:** The realized profit and loss of the position.

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiAccountRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiAccountRequest = {
  
  by: "index",
  
  value: "value_example",
};

const data = await apiInstance.account(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **by** | [**&#39;index&#39; | &#39;l1_address&#39;**]**Array<&#39;index&#39; &#124; &#39;l1_address&#39;>** |  | defaults to undefined
 **value** | [**string**] |  | defaults to undefined


### Return type

**DetailedAccounts**

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

# **accountLimits**
> AccountLimits accountLimits()

Get account limits

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiAccountLimitsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiAccountLimitsRequest = {
  
  accountIndex: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
};

const data = await apiInstance.accountLimits(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined


### Return type

**AccountLimits**

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

# **accountMetadata**
> AccountMetadatas accountMetadata()

Get account metadatas

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiAccountMetadataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiAccountMetadataRequest = {
  
  by: "index",
  
  value: "value_example",
  
  authorization: "authorization_example",
  
  auth: "auth_example",
};

const data = await apiInstance.accountMetadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **by** | [**&#39;index&#39; | &#39;l1_address&#39;**]**Array<&#39;index&#39; &#124; &#39;l1_address&#39;>** |  | defaults to undefined
 **value** | [**string**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined


### Return type

**AccountMetadatas**

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

# **accountsByL1Address**
> SubAccounts accountsByL1Address()

Get accounts by l1_address returns all accounts associated with the given L1 address

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiAccountsByL1AddressRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiAccountsByL1AddressRequest = {
  
  l1Address: "l1_address_example",
};

const data = await apiInstance.accountsByL1Address(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **l1Address** | [**string**] |  | defaults to undefined


### Return type

**SubAccounts**

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

# **apikeys**
> AccountApiKeys apikeys()

Get account api key. Set `api_key_index` to 255 to retrieve all api keys associated with the account.

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiApikeysRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiApikeysRequest = {
  
  accountIndex: 1,
  
  apiKeyIndex: 255,
};

const data = await apiInstance.apikeys(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **apiKeyIndex** | [**number**] |  | (optional) defaults to 255


### Return type

**AccountApiKeys**

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

# **changeAccountTier**
> RespChangeAccountTier changeAccountTier()

Change account tier

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiChangeAccountTierRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiChangeAccountTierRequest = {
  
  accountIndex: 1,
  
  newTier: "newTier_example",
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
};

const data = await apiInstance.changeAccountTier(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **newTier** | [**string**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined


### Return type

**RespChangeAccountTier**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | A successful response. |  -  |
**400** | Bad request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **l1Metadata**
> L1Metadata l1Metadata()

Get L1 metadata

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiL1MetadataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiL1MetadataRequest = {
  
  l1Address: "l1_address_example",
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
};

const data = await apiInstance.l1Metadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **l1Address** | [**string**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined


### Return type

**L1Metadata**

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

# **liquidations**
> LiquidationInfos liquidations()

Get liquidation infos

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiLiquidationsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiLiquidationsRequest = {
  
  accountIndex: 1,
  
  limit: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
  
  marketId: 255,
  
  cursor: "cursor_example",
};

const data = await apiInstance.liquidations(request);
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
 **cursor** | [**string**] |  | (optional) defaults to undefined


### Return type

**LiquidationInfos**

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

# **pnl**
> AccountPnL pnl()

Get account PnL chart

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiPnlRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiPnlRequest = {
  
  by: "index",
  
  value: "value_example",
  
  resolution: "1m",
  
  startTimestamp: 0,
  
  endTimestamp: 0,
  
  countBack: 1,
  
  authorization: "authorization_example",
  
  auth: "auth_example",
  
  ignoreTransfers: false,
};

const data = await apiInstance.pnl(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **by** | [**&#39;index&#39;**]**Array<&#39;index&#39;>** |  | defaults to undefined
 **value** | [**string**] |  | defaults to undefined
 **resolution** | [**&#39;1m&#39; | &#39;5m&#39; | &#39;15m&#39; | &#39;1h&#39; | &#39;4h&#39; | &#39;1d&#39;**]**Array<&#39;1m&#39; &#124; &#39;5m&#39; &#124; &#39;15m&#39; &#124; &#39;1h&#39; &#124; &#39;4h&#39; &#124; &#39;1d&#39;>** |  | defaults to undefined
 **startTimestamp** | [**number**] |  | defaults to undefined
 **endTimestamp** | [**number**] |  | defaults to undefined
 **countBack** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined
 **ignoreTransfers** | [**boolean**] |  | (optional) defaults to false


### Return type

**AccountPnL**

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

# **positionFunding**
> PositionFundings positionFunding()

Get accounts position fundings

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiPositionFundingRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiPositionFundingRequest = {
  
  accountIndex: 1,
  
  limit: 1,
  
  authorization: "authorization_example",
  
  auth: "auth_example",
  
  marketId: 255,
  
  cursor: "cursor_example",
  
  side: "all",
};

const data = await apiInstance.positionFunding(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **limit** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined
 **marketId** | [**number**] |  | (optional) defaults to 255
 **cursor** | [**string**] |  | (optional) defaults to undefined
 **side** | [**&#39;long&#39; | &#39;short&#39; | &#39;all&#39;**]**Array<&#39;long&#39; &#124; &#39;short&#39; &#124; &#39;all&#39;>** |  | (optional) defaults to 'all'


### Return type

**PositionFundings**

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

# **publicPools**
> PublicPools publicPools()

Get public pools

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiPublicPoolsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiPublicPoolsRequest = {
  
  index: 1,
  
  limit: 1,
  
  authorization: "authorization_example",
  
  auth: "auth_example",
  
  filter: "all",
  
  accountIndex: 1,
};

const data = await apiInstance.publicPools(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **index** | [**number**] |  | defaults to undefined
 **limit** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined
 **filter** | [**&#39;all&#39; | &#39;user&#39; | &#39;protocol&#39; | &#39;account_index&#39;**]**Array<&#39;all&#39; &#124; &#39;user&#39; &#124; &#39;protocol&#39; &#124; &#39;account_index&#39;>** |  | (optional) defaults to undefined
 **accountIndex** | [**number**] |  | (optional) defaults to undefined


### Return type

**PublicPools**

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

# **publicPoolsMetadata**
> RespPublicPoolsMetadata publicPoolsMetadata()

Get public pools metadata

### Example


```typescript
import { createConfiguration, AccountApi } from '';
import type { AccountApiPublicPoolsMetadataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AccountApi(configuration);

const request: AccountApiPublicPoolsMetadataRequest = {
  
  index: 1,
  
  limit: 1,
  
  authorization: "authorization_example",
  
  auth: "auth_example",
  
  filter: "all",
  
  accountIndex: 1,
};

const data = await apiInstance.publicPoolsMetadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **index** | [**number**] |  | defaults to undefined
 **limit** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined
 **filter** | [**&#39;all&#39; | &#39;user&#39; | &#39;protocol&#39; | &#39;account_index&#39;**]**Array<&#39;all&#39; &#124; &#39;user&#39; &#124; &#39;protocol&#39; &#124; &#39;account_index&#39;>** |  | (optional) defaults to undefined
 **accountIndex** | [**number**] |  | (optional) defaults to undefined


### Return type

**RespPublicPoolsMetadata**

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


