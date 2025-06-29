# Mock Server Setup Guide

This mock server implements the complete Operations API specification, allowing you to test the dynamic operations feature immediately.

## 🚀 Quick Start

### 1. Setup the Mock Server

```bash
# Copy the package.json file
cp mock-server-package.json package.json

# Install dependencies
npm install

# Start the mock server
npm start
```

### 2. Start Your Frontend

In a separate terminal:

```bash
# Start your React app (if not already running)
npm start
```

### 3. Test the Integration

1. Open your browser to `http://localhost:3000`
2. Click on the **"Operations"** tab in the sidebar
3. You should see operations loading from the mock server!
4. Try searching, filtering by category, and dragging operations to the canvas

## 📊 Sample Data

The mock server includes **8 realistic operations** across **5 categories**:

### 📧 **Notification** (2 operations)
- **Send Email** - Email notifications with templates and attachments
- **Send SMS** - SMS notifications to mobile numbers

### 🔄 **Data Processing** (2 operations)  
- **Validate Data** - JSON schema validation with custom rules
- **Transform Data** - Data transformation using JSONPath

### 🔗 **Integration** (2 operations)
- **HTTP Request** - External API calls with authentication
- **Database Query** - SQL queries against various databases

### 💾 **Storage** (1 operation)
- **File Upload** - Upload files to cloud storage

### 📄 **Reporting** (1 operation)
- **Generate Report** - PDF report generation from templates

## 🛠 API Endpoints

The mock server implements all endpoints from the specification:

- **`GET /api/v1/operations`** - List operations with filtering
- **`GET /api/v1/operations/:id`** - Get operation details  
- **`GET /api/v1/operations/categories`** - List categories
- **`POST /api/v1/operations/:id/validate`** - Validate parameters
- **`GET /api/v1/operations/search`** - Search operations
- **`GET /health`** - Health check

## 🧪 Testing Features

### Search & Filter
- **Search**: Try searching for "email", "data", or "http"
- **Categories**: Filter by Notification, Data processing, Integration, etc.
- **Tags**: Operations are tagged for easy discovery

### Drag & Drop
- Drag operations from the palette to the workflow canvas
- Operations are created with pre-configured templates
- Dynamic operations show rich metadata (category, version, tags)

### Properties Editor
- Select a dynamic operation node to see enhanced properties
- All the template data is available for editing
- Parameters from the operation template are pre-populated

## 🔧 Customization

### Adding Your Own Operations

Edit `mock-server.js` and add operations to the `operations` array:

```javascript
{
  id: 'your-operation-id',
  name: 'Your Operation Name',
  description: 'What your operation does',
  category: 'your-category',
  tags: ['tag1', 'tag2'],
  icon: 'settings', // Lucide icon name
  version: '1.0.0',
  template: {
    actions: [
      {
        name: 'yourAction',
        functionRef: {
          refName: 'yourFunction',
          arguments: {
            param1: '{{ .param1 }}',
            param2: '{{ .param2 }}'
          }
        }
      }
    ],
    parameters: [
      {
        name: 'param1',
        type: 'string',
        required: true,
        description: 'Parameter description',
        default: 'default value'
      }
      // ... more parameters
    ]
  },
  errorHandling: [
    {
      errorRef: 'YourError',
      retryPolicy: 'exponential-backoff',
      maxRetries: 3
    }
  ]
}
```

### Changing the Port

Set the `PORT` environment variable:

```bash
PORT=3002 npm start
```

Or edit `mock-server.js` and change the default port.

## 🐛 Troubleshooting

### CORS Issues
The mock server includes CORS headers, but if you have issues:
- Make sure the mock server is running on `localhost:3001`
- Check browser console for CORS errors
- Ensure both frontend and backend are on `localhost`

### Port Conflicts
If port 3001 is in use:
- Change the port in `mock-server.js` (line: `const PORT = process.env.PORT || 3001;`)
- Or set environment variable: `PORT=3002 npm start`

### No Operations Loading
1. Check that the mock server is running (`http://localhost:3001/health`)  
2. Check browser network tab for API calls
3. Look at the mock server console for request logs

## 🎯 Next Steps

Once you've tested with the mock server:

1. **Implement your real backend** using the same API specification
2. **Replace the mock server** with your actual operations API
3. **Customize operations** to match your specific use cases
4. **Add authentication** if needed for your production API

The mock server provides a perfect testing environment to validate the frontend integration before building your production backend! 