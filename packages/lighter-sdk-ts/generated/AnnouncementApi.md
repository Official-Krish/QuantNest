# .AnnouncementApi

All URIs are relative to *https://mainnet.zklighter.elliot.ai*

Method | HTTP request | Description
------------- | ------------- | -------------
[**announcement**](AnnouncementApi.md#announcement) | **GET** /api/v1/announcement | announcement


# **announcement**
> Announcements announcement()

Get announcement

### Example


```typescript
import { createConfiguration, AnnouncementApi } from '';

const configuration = createConfiguration();
const apiInstance = new AnnouncementApi(configuration);

const request = {};

const data = await apiInstance.announcement(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Announcements**

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


