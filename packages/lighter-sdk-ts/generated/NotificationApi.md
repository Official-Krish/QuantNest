# .NotificationApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**notificationAck**](NotificationApi.md#notificationAck) | **POST** /api/v1/notification/ack | notification_ack


# **notificationAck**
> ResultCode notificationAck()

Ack notification

### Example


```typescript
import { createConfiguration, NotificationApi } from '';
import type { NotificationApiNotificationAckRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationApi(configuration);

const request: NotificationApiNotificationAckRequest = {
  
  notifId: 'liq:17:5898',
  
  accountIndex: 1,
    //  make required after integ is done (optional)
  authorization: "authorization_example",
    //  made optional to support header auth clients (optional)
  auth: "auth_example",
};

const data = await apiInstance.notificationAck(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **notifId** | [**string**] |  | defaults to undefined
 **accountIndex** | [**number**] |  | defaults to undefined
 **authorization** | [**string**] |  make required after integ is done | (optional) defaults to undefined
 **auth** | [**string**] |  made optional to support header auth clients | (optional) defaults to undefined


### Return type

**ResultCode**

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


