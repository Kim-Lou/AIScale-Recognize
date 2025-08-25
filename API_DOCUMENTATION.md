# ScaleSense AI - External API Documentation

This document provides comprehensive documentation for the external API interfaces of the ScaleSense AI system. These APIs allow external systems to interact with the weight management data.

## Authentication

All external API endpoints require API key authentication.

### API Key Authentication

- **Type**: API Key
- **Header Name**: `X-API-KEY`
- **Format**: String
- **Location**: HTTP Header

Example:
```
X-API-KEY: ss-api-2023-external-system-key
```

### Obtaining an API Key

API keys are generated and managed by the ScaleSense AI system administrators. Contact your system administrator to obtain a valid API key for your integration.

### Security Considerations

- API keys should be kept secure and never exposed in client-side code
- Use HTTPS for all API requests to ensure the API key is transmitted securely
- Each external system should have its own unique API key
- API keys can be revoked if they are compromised

## API Endpoints

### 1. Create Weight Record (POST)

Creates a new weight record with data from an external system.

**Endpoint**: `POST /api/external/weight-records`

**Content-Type**: `multipart/form-data` (if sending an image) or `application/json` (if no image)

**Authentication**: Required (API Key)

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customer_id | String | Yes | The customer ID |
| total_weight | Number | Yes | The total weight in kg |
| weighing_time | String | No | ISO datetime string (defaults to current time) |
| image | File | No | Image file of the weighing process |

**Example Request**:
```bash
curl -X POST \
  -H "X-API-KEY: your-api-key" \
  -F "customer_id=C001" \
  -F "total_weight=125.5" \
  -F "weighing_time=2023-06-15T10:30:00Z" \
  -F "image=@/path/to/image.jpg" \
  http://localhost:5000/api/external/weight-records
```

**Response (Success - 201 Created)**:
```json
{
  "id": 123,
  "weighRecordId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "customer_id": "C001",
  "customer_name": "ABC Corp",
  "waste_type": "Unclassified",
  "bin_type": "Unknown",
  "total_weight": 125.5,
  "bin_weight": 0,
  "net_weight": 125.5,
  "weighing_time": "2023-06-15T10:30:00Z",
  "image_url": "/uploads/weight-1623760200000-123456789.jpg"
}
```

**Response (Error - 400 Bad Request)**:
```json
{
  "error": "Missing required fields",
  "required": ["customer_id", "total_weight"]
}
```

### 2. Get Weight Record (GET)

Retrieves a specific weight record by its weighRecordId.

**Endpoint**: `GET /api/external/weight-records/:weighRecordId`

**Authentication**: Required (API Key)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| weighRecordId | String | Yes | The unique identifier of the weight record |

**Example Request**:
```bash
curl -X GET \
  -H "X-API-KEY: your-api-key" \
  http://localhost:5000/api/external/weight-records/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response (Success - 200 OK)**:
```json
{
  "weighRecordId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "image_url": "http://localhost:5000/uploads/weight-1623760200000-123456789.jpg",
  "customer_id": "C001",
  "customer_name": "ABC Corp",
  "waste_type": "Paper",
  "bin_type": "240L",
  "total_weight": 125.5,
  "bin_weight": 5.5,
  "net_weight": 120.0,
  "weighing_time": "2023-06-15T10:30:00Z"
}
```

**Response (Error - 404 Not Found)**:
```json
{
  "error": "Weight record not found"
}
```

### 3. Update Weight Record (PATCH)

Updates specific fields of a weight record.

**Endpoint**: `PATCH /api/external/weight-records/:weighRecordId`

**Content-Type**: `application/json`

**Authentication**: Required (API Key)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| weighRecordId | String | Yes | The unique identifier of the weight record |

**Request Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| waste_type | String | No | The waste type |
| bin_type | String | No | The bin type |
| bin_weight | Number | No | The bin weight in kg |
| net_weight | Number | No | The net weight in kg |

**Example Request**:
```bash
curl -X PATCH \
  -H "X-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "waste_type": "Paper",
    "bin_type": "240L",
    "bin_weight": 5.5
  }' \
  http://localhost:5000/api/external/weight-records/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response (Success - 200 OK)**:
```json
{
  "id": 123,
  "weighRecordId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "customer_id": "C001",
  "customer_name": "ABC Corp",
  "waste_type": "Paper",
  "bin_type": "240L",
  "total_weight": 125.5,
  "bin_weight": 5.5,
  "net_weight": 120.0,
  "weighing_time": "2023-06-15T10:30:00Z",
  "image_url": "/uploads/weight-1623760200000-123456789.jpg"
}
```

**Response (Error - 400 Bad Request)**:
```json
{
  "error": "At least one field to update is required",
  "allowed": ["waste_type", "bin_type", "bin_weight", "net_weight"]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK**: The request was successful
- **201 Created**: A new resource was successfully created
- **400 Bad Request**: The request was malformed or had invalid parameters
- **401 Unauthorized**: No API key was provided
- **403 Forbidden**: The API key is invalid or has insufficient permissions
- **404 Not Found**: The requested resource was not found
- **500 Internal Server Error**: An error occurred on the server

Error responses include a JSON object with an `error` field describing the error.

## Rate Limiting

To ensure system stability, API requests are subject to rate limiting:

- 100 requests per minute per API key
- 1000 requests per hour per API key

Exceeding these limits will result in HTTP 429 (Too Many Requests) responses.

## Implementation Guidelines

### Image Handling

- Images should be submitted as multipart form data
- Supported formats: JPG, JPEG, PNG, GIF, WebP
- Maximum file size: 10MB
- Images are stored on the server and a relative URL path is returned

### Weight Values

- All weight values are in kilograms (kg)
- Decimal values are supported (up to 1 decimal place recommended)
- Negative weights are not allowed

### DateTime Format

- All date/time values should be in ISO 8601 format (e.g., "2023-06-15T10:30:00Z")
- If not provided, the current server time will be used

## Integration Flow Examples

### Example 1: Initial Weighing at Collection Point

1. External system collects weight data and customer information
2. POST request to `/api/external/weight-records` with customer_id, total_weight and image
3. System creates a new weight record with a unique weighRecordId
4. External system stores the weighRecordId for future reference

### Example 2: Waste Classification at Processing Center

1. External system retrieves the weight record using the weighRecordId
2. Waste is classified and bin information is determined
3. PATCH request to update the waste_type, bin_type, and bin_weight
4. System recalculates the net_weight based on the updated bin_weight

### Example 3: Data Verification and Retrieval

1. External system needs to verify weight record data
2. GET request with the weighRecordId
3. System returns the complete weight record information including image URL
