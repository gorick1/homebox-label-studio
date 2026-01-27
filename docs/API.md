# API Documentation

## Base URLs

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3001`
- Homebox: `http://localhost:7745`

## Authentication

The backend API uses token-based authentication. Include the token in requests:

```http
Authorization: Bearer YOUR_TOKEN
X-Addon-Token: YOUR_TOKEN
```

## Template Endpoints

### List Templates

```http
GET /api/templates
```

**Response:**
```json
[
  {
    "id": "tpl_123",
    "name": "Default Item Label",
    "description": "Standard label for inventory items",
    "label": { },
    "isDefault": true,
    "isFavorite": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

## Available Placeholders

- `{item_name}` - Name of the item
- `{location}` - Location/shelf path
- `{quantity}` - Stock count
- `{item_id}` - UUID of the item
- `{asset_id}` - Asset identifier
- `{description}` - Item description
- `{notes}` - Item notes

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
