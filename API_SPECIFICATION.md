# Dynamic Operations API Specification

This document outlines the API specification for the dynamic operations feature in the Serverless Workflow Builder. This feature allows the backend to define operation states/activities that can be dragged and dropped into workflows.

## Overview

The dynamic operations feature extends the existing workflow builder to support:
- **Backend-defined operations**: Operations are defined in the backend and fetched via API
- **Rich metadata**: Each operation includes description, tags, categories, and templates
- **Drag & Drop**: Operations can be dragged from the Operations palette to the workflow canvas
- **Pre-configured templates**: Operations come with pre-defined actions and parameters
- **Categorization**: Operations are organized by categories for better discoverability

## Frontend Implementation

### New Components Added

1. **OperationsPalette.js** - Fetches and displays operations from the backend
2. **Enhanced Sidebar.js** - Added tabs for "Basic Nodes" and "Operations"
3. **Enhanced WorkflowEditor.js** - Updated drag & drop to handle operation data
4. **Enhanced OperationNode.js** - Displays rich information for dynamic operations

### Integration Points

The frontend integrates with your existing workflow builder:
- Operations are fetched when the "Operations" tab is selected
- Drag & drop creates nodes with pre-configured data from the operation template
- The properties editor works with both static and dynamic operations

## API Endpoints

### 1. List Operations

```http
GET /api/v1/operations
```

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "notification", "data-processing")
- `tags` (optional): Comma-separated tags for filtering
- `search` (optional): Search in name/description/tags
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "operations": [
    {
      "id": "send-email-operation",
      "name": "Send Email",
      "description": "Send email notification with customizable template",
      "category": "notification",
      "tags": ["email", "notification", "communication"],
      "icon": "mail",
      "version": "1.0.0",
      "metadata": {
        "author": "System",
        "created": "2024-01-15T10:00:00Z",
        "lastModified": "2024-01-20T15:30:00Z"
      },
      "template": {
        "actions": [
          {
            "name": "sendEmailAction",
            "functionRef": {
              "refName": "sendEmail",
              "arguments": {
                "to": "{{ .recipient }}",
                "subject": "{{ .subject }}",
                "body": "{{ .message }}"
              }
            }
          }
        ],
        "parameters": [
          {
            "name": "recipient",
            "type": "string",
            "required": true,
            "description": "Email recipient address",
            "default": ""
          },
          {
            "name": "subject",
            "type": "string",
            "required": true,
            "description": "Email subject line",
            "default": "Notification"
          },
          {
            "name": "message",
            "type": "string",
            "required": true,
            "description": "Email body content",
            "default": ""
          }
        ],
        "stateDataFilter": {
          "input": "{{ . }}",
          "output": "{{ .emailResult }}"
        }
      },
      "errorHandling": [
        {
          "errorRef": "EmailDeliveryError",
          "retryPolicy": "exponential-backoff",
          "maxRetries": 3
        }
      ]
    }
  ],
  "categories": [
    {
      "id": "notification",
      "name": "Notification",
      "description": "Send notifications via various channels",
      "count": 5
    },
    {
      "id": "data-processing", 
      "name": "Data Processing",
      "description": "Transform, validate, and process data",
      "count": 12
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 2. Get Operation Details

```http
GET /api/v1/operations/{operationId}
```

**Response:**
```json
{
  "id": "send-email-operation",
  "name": "Send Email",
  "description": "Send email notification with customizable template",
  "category": "notification",
  "tags": ["email", "notification", "communication"],
  "icon": "mail",
  "version": "1.0.0",
  "documentation": {
    "usage": "Use this operation to send email notifications...",
    "examples": [
      {
        "name": "Basic Email",
        "description": "Send a simple notification email",
        "parameters": {
          "recipient": "user@example.com",
          "subject": "Welcome!",
          "message": "Welcome to our platform!"
        }
      }
    ]
  },
  "template": {
    "actions": [...],
    "parameters": [...],
    "stateDataFilter": {...}
  },
  "errorHandling": [...],
  "metadata": {...}
}
```

### 3. List Categories

```http
GET /api/v1/operations/categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": "notification",
      "name": "Notification",
      "description": "Send notifications via various channels",
      "icon": "bell",
      "count": 5,
      "subcategories": [
        {
          "id": "email",
          "name": "Email",
          "count": 3
        }
      ]
    }
  ]
}
```

### 4. Validate Operation Parameters

```http
POST /api/v1/operations/{operationId}/validate
Content-Type: application/json

{
  "parameters": {
    "recipient": "user@example.com",
    "subject": "Test",
    "message": "Hello World"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "field": "message",
      "message": "Message is quite short, consider adding more details"
    }
  ]
}
```

## Data Structures

### Operation Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the operation |
| `name` | string | Display name for the operation |
| `description` | string | Brief description of what the operation does |
| `category` | string | Category ID (e.g., "notification", "data-processing") |
| `tags` | string[] | Array of tags for filtering and search |
| `icon` | string | Icon identifier (maps to Lucide React icons) |
| `version` | string | Version of the operation |
| `template` | object | Template configuration for the operation |
| `errorHandling` | object[] | Default error handling configuration |
| `metadata` | object | Additional metadata (author, dates, etc.) |

### Template Object

| Field | Type | Description |
|-------|------|-------------|
| `actions` | object[] | Pre-configured actions for the operation |
| `parameters` | object[] | Parameter definitions with types and defaults |
| `stateDataFilter` | object | Input/output data filtering configuration |

### Parameter Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Parameter name |
| `type` | string | Parameter type (string, number, boolean, object, array) |
| `required` | boolean | Whether the parameter is required |
| `description` | string | Parameter description |
| `default` | any | Default value for the parameter |

## Icons

The frontend uses Lucide React icons. Supported icon names include:
- `mail` - Email operations
- `database` - Database operations  
- `zap` - Event/trigger operations
- `globe` - HTTP/API operations
- `settings` - Configuration operations
- `bell` - Notification operations

## Error Handling

### API Errors

The API should return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Operation not found
- `500` - Internal Server Error

### Frontend Error Handling

The frontend gracefully handles:
- Network errors (shows retry button)
- Empty results (shows empty state)
- Invalid operation data (falls back to default operation)

## Example Backend Implementation

Here's a simple example of how you might implement the operations API:

```javascript
// Node.js/Express example
const express = require('express');
const app = express();

// Sample operations data
const operations = [
  {
    id: 'send-email-operation',
    name: 'Send Email',
    description: 'Send email notification with customizable template',
    category: 'notification',
    tags: ['email', 'notification', 'communication'],
    icon: 'mail',
    version: '1.0.0',
    template: {
      actions: [
        {
          name: 'sendEmailAction',
          functionRef: {
            refName: 'sendEmail',
            arguments: {
              to: '{{ .recipient }}',
              subject: '{{ .subject }}',
              body: '{{ .message }}'
            }
          }
        }
      ],
      parameters: [
        {
          name: 'recipient',
          type: 'string',
          required: true,
          description: 'Email recipient address',
          default: ''
        },
        {
          name: 'subject',
          type: 'string', 
          required: true,
          description: 'Email subject line',
          default: 'Notification'
        },
        {
          name: 'message',
          type: 'string',
          required: true,
          description: 'Email body content',
          default: ''
        }
      ]
    },
    errorHandling: [
      {
        errorRef: 'EmailDeliveryError',
        retryPolicy: 'exponential-backoff',
        maxRetries: 3
      }
    ]
  }
];

// List operations endpoint
app.get('/api/v1/operations', (req, res) => {
  const { category, search, tags, limit = 50, offset = 0 } = req.query;
  
  let filtered = operations;
  
  // Apply filters
  if (category && category !== 'all') {
    filtered = filtered.filter(op => op.category === category);
  }
  
  if (search) {
    filtered = filtered.filter(op => 
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.description.toLowerCase().includes(search.toLowerCase()) ||
      op.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  if (tags) {
    const tagList = tags.split(',');
    filtered = filtered.filter(op => 
      tagList.some(tag => op.tags.includes(tag))
    );
  }
  
  // Pagination
  const paginatedOps = filtered.slice(offset, offset + limit);
  
  // Generate categories
  const categories = [...new Set(operations.map(op => op.category))]
    .map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      description: `${cat} operations`,
      count: operations.filter(op => op.category === cat).length
    }));
  
  res.json({
    operations: paginatedOps,
    categories,
    pagination: {
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: offset + limit < filtered.length
    }
  });
});

// Get operation details endpoint
app.get('/api/v1/operations/:id', (req, res) => {
  const operation = operations.find(op => op.id === req.params.id);
  
  if (!operation) {
    return res.status(404).json({ error: 'Operation not found' });
  }
  
  res.json(operation);
});

app.listen(3001, () => {
  console.log('Operations API server running on port 3001');
});
```

## Testing the Implementation

1. **Start your backend** with the operations API
2. **Update the API base URL** in `OperationsPalette.js` if needed
3. **Start the frontend** application
4. **Navigate to the Operations tab** in the sidebar
5. **Drag operations** from the palette to the workflow canvas
6. **Verify** that operations are created with the correct template data

## Next Steps

1. **Implement the backend API** according to this specification
2. **Add your specific operations** to the backend
3. **Test the integration** with your serverless workflow runtime
4. **Extend with additional features** like operation versioning, user-defined operations, etc.

This API specification provides a solid foundation for implementing dynamic operations in your serverless workflow builder. The frontend is now ready to consume operations from your backend and provide a rich drag-and-drop experience for workflow creation. 