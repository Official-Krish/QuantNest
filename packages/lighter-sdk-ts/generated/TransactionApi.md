# .TransactionApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**accountTxs**](TransactionApi.md#accountTxs) | **GET** /api/v1/accountTxs | accountTxs
[**blockTxs**](TransactionApi.md#blockTxs) | **GET** /api/v1/blockTxs | blockTxs
[**depositHistory**](TransactionApi.md#depositHistory) | **GET** /api/v1/deposit/history | deposit_history
[**nextNonce**](TransactionApi.md#nextNonce) | **GET** /api/v1/nextNonce | nextNonce
[**sendTx**](TransactionApi.md#sendTx) | **POST** /api/v1/sendTx | sendTx
[**sendTxBatch**](TransactionApi.md#sendTxBatch) | **POST** /api/v1/sendTxBatch | sendTxBatch
[**transferHistory**](TransactionApi.md#transferHistory) | **GET** /api/v1/transfer/history | transfer_history
[**tx**](TransactionApi.md#tx) | **GET** /api/v1/tx | tx
[**txFromL1TxHash**](TransactionApi.md#txFromL1TxHash) | **GET** /api/v1/txFromL1TxHash | txFromL1TxHash
[**txs**](TransactionApi.md#txs) | **GET** /api/v1/txs | txs
[**withdrawHistory**](TransactionApi.md#withdrawHistory) | **GET** /api/v1/withdraw/history | withdraw_history


# **accountTxs**
> Txs accountTxs()

Get transactions of a specific account

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiAccountTxsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiAccountTxsRequest = {
  
  limit: 1,
  
  by: "account_index",
  
  value: "value_example",
  
  authorization: "authorization_example",
  
  index: 1,
  
  types: [
    1,
  ],
  
  auth: "auth_example",
};

const data = await apiInstance.accountTxs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] |  | defaults to undefined
 **by** | [**&#39;account_index&#39;**]**Array<&#39;account_index&#39;>** |  | defaults to undefined
 **value** | [**string**] |  | defaults to undefined
 **authorization** | [**string**] |  | (optional) defaults to undefined
 **index** | [**number**] |  | (optional) defaults to undefined
 **types** | **Array&lt;number&gt;** |  | (optional) defaults to undefined
 **auth** | [**string**] |  | (optional) defaults to undefined


### Return type

**Txs**

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

# **blockTxs**
> Txs blockTxs()

Get transactions in a block

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiBlockTxsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiBlockTxsRequest = {
  
  by: "block_height",
  
  value: "value_example",
};

const data = await apiInstance.blockTxs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **by** | [**&#39;block_height&#39; | &#39;block_commitment&#39;**]**Array<&#39;block_height&#39; &#124; &#39;block_commitment&#39;>** |  | defaults to undefined
 **value** | [**string**] |  | defaults to undefined


### Return type

**Txs**

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

# **depositHistory**
> DepositHistory depositHistory()

Get deposit history

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiDepositHistoryRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiDepositHistoryRequest = {
  
  accountIndex: 1,
  
  l1Address: "l1_address_example",
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
  
  cursor: "cursor_example",
  
  filter: "all",
};

const data = await apiInstance.depositHistory(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **l1Address** | [**string**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined
 **cursor** | [**string**] |  | (optional) defaults to undefined
 **filter** | [**&#39;all&#39; | &#39;pending&#39; | &#39;claimable&#39;**]**Array<&#39;all&#39; &#124; &#39;pending&#39; &#124; &#39;claimable&#39;>** |  | (optional) defaults to undefined


### Return type

**DepositHistory**

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

# **nextNonce**
> NextNonce nextNonce()

Get next nonce for a specific account and api key

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiNextNonceRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiNextNonceRequest = {
  
  accountIndex: 1,
  
  apiKeyIndex: 1,
};

const data = await apiInstance.nextNonce(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **apiKeyIndex** | [**number**] |  | defaults to undefined


### Return type

**NextNonce**

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

# **sendTx**
> RespSendTx sendTx()

You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiSendTxRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiSendTxRequest = {
  
  txType: 1,
  
  txInfo: "txInfo_example",
  
  priceProtection: true,
};

const data = await apiInstance.sendTx(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **txType** | [**number**] |  | defaults to undefined
 **txInfo** | [**string**] |  | defaults to undefined
 **priceProtection** | [**boolean**] |  | (optional) defaults to true


### Return type

**RespSendTx**

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

# **sendTxBatch**
> RespSendTxBatch sendTxBatch()

You need to sign the transaction body before sending it to the server. More details can be found in the Get Started docs: [Get Started For Programmers](https://apidocs.lighter.xyz/docs/get-started-for-programmers)

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiSendTxBatchRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiSendTxBatchRequest = {
  
  txTypes: "txTypes_example",
  
  txInfos: "txInfos_example",
};

const data = await apiInstance.sendTxBatch(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **txTypes** | [**string**] |  | defaults to undefined
 **txInfos** | [**string**] |  | defaults to undefined


### Return type

**RespSendTxBatch**

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

# **transferHistory**
> TransferHistory transferHistory()

Get transfer history

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiTransferHistoryRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiTransferHistoryRequest = {
  
  accountIndex: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
  
  cursor: "cursor_example",
};

const data = await apiInstance.transferHistory(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined
 **cursor** | [**string**] |  | (optional) defaults to undefined


### Return type

**TransferHistory**

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

# **tx**
> EnrichedTx tx()

Get transaction by hash or sequence index

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiTxRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiTxRequest = {
  
  by: "hash",
  
  value: "value_example",
};

const data = await apiInstance.tx(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **by** | [**&#39;hash&#39; | &#39;sequence_index&#39;**]**Array<&#39;hash&#39; &#124; &#39;sequence_index&#39;>** |  | defaults to undefined
 **value** | [**string**] |  | defaults to undefined


### Return type

**EnrichedTx**

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

# **txFromL1TxHash**
> EnrichedTx txFromL1TxHash()

Get L1 transaction by L1 transaction hash

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiTxFromL1TxHashRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiTxFromL1TxHashRequest = {
  
  hash: "hash_example",
};

const data = await apiInstance.txFromL1TxHash(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **hash** | [**string**] |  | defaults to undefined


### Return type

**EnrichedTx**

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

# **txs**
> Txs txs()

Get transactions which are already packed into blocks

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiTxsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiTxsRequest = {
  
  limit: 1,
  
  index: 1,
};

const data = await apiInstance.txs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] |  | defaults to undefined
 **index** | [**number**] |  | (optional) defaults to undefined


### Return type

**Txs**

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

# **withdrawHistory**
> WithdrawHistory withdrawHistory()

Get withdraw history

### Example


```typescript
import { createConfiguration, TransactionApi } from '';
import type { TransactionApiWithdrawHistoryRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionApi(configuration);

const request: TransactionApiWithdrawHistoryRequest = {
  
  accountIndex: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
  
  cursor: "cursor_example",
  
  filter: "all",
};

const data = await apiInstance.withdrawHistory(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **accountIndex** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined
 **cursor** | [**string**] |  | (optional) defaults to undefined
 **filter** | [**&#39;all&#39; | &#39;pending&#39; | &#39;claimable&#39;**]**Array<&#39;all&#39; &#124; &#39;pending&#39; &#124; &#39;claimable&#39;>** |  | (optional) defaults to undefined


### Return type

**WithdrawHistory**

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


