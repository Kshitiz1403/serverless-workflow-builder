const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());

// Sample operations data
const operations = [
 {
  id: 'send-email-operation',
  name: 'Send Email',
  description: 'Send email notification with customizable template and attachments',
  category: 'notification',
  tags: ['email', 'notification', 'communication'],
  icon: 'mail',
  version: '1.2.0',
  metadata: {
   author: 'System',
   created: '2024-01-15T10:00:00Z',
   lastModified: '2024-01-20T15:30:00Z'
  },
  template: {
   actions: [
    {
     name: 'sendEmailAction',
     functionRef: {
      refName: 'sendEmail',
      arguments: {
       to: '{{ .recipient }}',
       subject: '{{ .subject }}',
       body: '{{ .message }}',
       attachments: '{{ .attachments }}'
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
    },
    {
     name: 'attachments',
     type: 'array',
     required: false,
     description: 'List of file attachments',
     default: []
    }
   ],
   stateDataFilter: {
    input: '{{ . }}',
    output: '{{ .emailResult }}'
   }
  },
  errorHandling: [
   {
    errorRef: 'EmailDeliveryError',
    retryPolicy: 'exponential-backoff',
    maxRetries: 3
   }
  ]
 },
 {
  id: 'send-sms-operation',
  name: 'Send SMS',
  description: 'Send SMS notification to mobile phone numbers',
  category: 'notification',
  tags: ['sms', 'notification', 'mobile'],
  icon: 'zap',
  version: '1.0.0',
  metadata: {
   author: 'System',
   created: '2024-01-10T08:00:00Z',
   lastModified: '2024-01-18T12:00:00Z'
  },
  template: {
   actions: [
    {
     name: 'sendSMSAction',
     functionRef: {
      refName: 'sendSMS',
      arguments: {
       to: '{{ .phoneNumber }}',
       message: '{{ .message }}'
      }
     }
    }
   ],
   parameters: [
    {
     name: 'phoneNumber',
     type: 'string',
     required: true,
     description: 'Phone number in international format',
     default: ''
    },
    {
     name: 'message',
     type: 'string',
     required: true,
     description: 'SMS message content (max 160 chars)',
     default: ''
    }
   ]
  },
  errorHandling: [
   {
    errorRef: 'SMSDeliveryError',
    retryPolicy: 'linear-backoff',
    maxRetries: 2
   }
  ]
 },
 {
  id: 'validate-data-operation',
  name: 'Validate Data',
  description: 'Validate input data against JSON schema with custom rules',
  category: 'data-processing',
  tags: ['validation', 'data', 'schema', 'quality'],
  icon: 'database',
  version: '2.1.0',
  metadata: {
   author: 'Data Team',
   created: '2024-01-05T14:00:00Z',
   lastModified: '2024-01-22T09:15:00Z'
  },
  template: {
   actions: [
    {
     name: 'validateDataAction',
     functionRef: {
      refName: 'validateInputData',
      arguments: {
       schema: '{{ .validationSchema }}',
       data: '{{ .inputData }}',
       strict: '{{ .strictMode }}'
      }
     }
    }
   ],
   parameters: [
    {
     name: 'validationSchema',
     type: 'object',
     required: true,
     description: 'JSON schema for data validation'
    },
    {
     name: 'inputData',
     type: 'any',
     required: true,
     description: 'Input data to validate'
    },
    {
     name: 'strictMode',
     type: 'boolean',
     required: false,
     description: 'Enable strict validation mode',
     default: false
    }
   ]
  },
  errorHandling: [
   {
    errorRef: 'ValidationError',
    retryPolicy: 'none',
    maxRetries: 0
   }
  ]
 },
 {
  id: 'transform-data-operation',
  name: 'Transform Data',
  description: 'Transform and manipulate data using JSONPath and custom functions',
  category: 'data-processing',
  tags: ['transform', 'data', 'jsonpath', 'mapping'],
  icon: 'database',
  version: '1.5.0',
  metadata: {
   author: 'Data Team',
   created: '2024-01-08T11:30:00Z',
   lastModified: '2024-01-25T16:45:00Z'
  },
  template: {
   actions: [
    {
     name: 'transformAction',
     functionRef: {
      refName: 'transformData',
      arguments: {
       transformation: '{{ .transformationRules }}',
       input: '{{ .inputData }}',
       outputFormat: '{{ .outputFormat }}'
      }
     }
    }
   ],
   parameters: [
    {
     name: 'transformationRules',
     type: 'object',
     required: true,
     description: 'Data transformation rules and mappings'
    },
    {
     name: 'inputData',
     type: 'any',
     required: true,
     description: 'Input data to transform'
    },
    {
     name: 'outputFormat',
     type: 'string',
     required: false,
     description: 'Output format (json, xml, csv)',
     default: 'json'
    }
   ]
  },
  errorHandling: [
   {
    errorRef: 'TransformationError',
    retryPolicy: 'exponential-backoff',
    maxRetries: 2
   }
  ]
 },
 {
  id: 'http-request-operation',
  name: 'HTTP Request',
  description: 'Make HTTP requests to external APIs with authentication and retry logic',
  category: 'integration',
  tags: ['http', 'api', 'rest', 'webhook'],
  icon: 'globe',
  version: '3.0.0',
  metadata: {
   author: 'Integration Team',
   created: '2024-01-12T09:00:00Z',
   lastModified: '2024-01-28T14:20:00Z'
  },
  template: {
   actions: [
    {
     name: 'httpRequestAction',
     functionRef: {
      refName: 'makeHTTPRequest',
      arguments: {
       url: '{{ .url }}',
       method: '{{ .method }}',
       headers: '{{ .headers }}',
       body: '{{ .requestBody }}',
       timeout: '{{ .timeout }}'
      }
     }
    }
   ],
   parameters: [
    {
     name: 'url',
     type: 'string',
     required: true,
     description: 'Target URL for the HTTP request'
    },
    {
     name: 'method',
     type: 'string',
     required: false,
     description: 'HTTP method (GET, POST, PUT, DELETE)',
     default: 'GET'
    },
    {
     name: 'headers',
     type: 'object',
     required: false,
     description: 'HTTP headers as key-value pairs',
     default: {}
    },
    {
     name: 'requestBody',
     type: 'any',
     required: false,
     description: 'Request body for POST/PUT requests'
    },
    {
     name: 'timeout',
     type: 'number',
     required: false,
     description: 'Request timeout in seconds',
     default: 30
    }
   ]
  },
  errorHandling: [
   {
    errorRef: 'HTTPError',
    retryPolicy: 'exponential-backoff',
    maxRetries: 3
   },
   {
    errorRef: 'TimeoutError',
    retryPolicy: 'linear-backoff',
    maxRetries: 2
   }
  ]
 },
 {
  id: 'database-query-operation',
  name: 'Database Query',
  description: 'Execute SQL queries against various database systems',
  category: 'integration',
  tags: ['database', 'sql', 'query', 'data'],
  icon: 'database',
  version: '2.3.0',
  metadata: {
   author: 'Database Team',
   created: '2024-01-20T10:15:00Z',
   lastModified: '2024-01-30T13:40:00Z'
  },
  template: {
   actions: [
    {
     name: 'queryDatabaseAction',
     functionRef: {
      refName: 'executeQuery',
      arguments: {
       connectionString: '{{ .connectionString }}',
       query: '{{ .sqlQuery }}',
       parameters: '{{ .queryParameters }}'
      }
     }
    }
   ],
   parameters: [
    {
     name: 'connectionString',
     type: 'string',
     required: true,
     description: 'Database connection string'
    },
    {
     name: 'sqlQuery',
     type: 'string',
     required: true,
     description: 'SQL query to execute'
    },
    {
     name: 'queryParameters',
     type: 'object',
     required: false,
     description: 'Query parameters for prepared statements',
     default: {}
    }
   ]
  },
  errorHandling: [
   {
    errorRef: 'DatabaseError',
    retryPolicy: 'exponential-backoff',
    maxRetries: 2
   }
  ]
 },
 {
  id: 'file-upload-operation',
  name: 'File Upload',
  description: 'Upload files to cloud storage with progress tracking',
  category: 'storage',
  tags: ['file', 'upload', 'storage', 'cloud'],
  icon: 'database',
  version: '1.8.0',
  metadata: {
   author: 'Storage Team',
   created: '2024-01-14T16:00:00Z',
   lastModified: '2024-01-26T11:30:00Z'
  },
  template: {
   actions: [
    {
     name: 'uploadFileAction',
     functionRef: {
      refName: 'uploadFile',
      arguments: {
       filePath: '{{ .filePath }}',
       destination: '{{ .destination }}',
       bucket: '{{ .bucket }}',
       metadata: '{{ .fileMetadata }}'
      }
     }
    }
   ],
   parameters: [
    {
     name: 'filePath',
     type: 'string',
     required: true,
     description: 'Local file path to upload'
    },
    {
     name: 'destination',
     type: 'string',
     required: true,
     description: 'Destination path in storage'
    },
    {
     name: 'bucket',
     type: 'string',
     required: false,
     description: 'Storage bucket name',
     default: 'default-bucket'
    },
    {
     name: 'fileMetadata',
     type: 'object',
     required: false,
     description: 'Additional file metadata',
     default: {}
    }
   ]
  },
  errorHandling: [
   {
    errorRef: 'UploadError',
    retryPolicy: 'exponential-backoff',
    maxRetries: 3
   }
  ]
 },
 {
  id: 'generate-report-operation',
  name: 'Generate Report',
  description: 'Generate PDF reports from templates with dynamic data',
  category: 'reporting',
  tags: ['report', 'pdf', 'template', 'generation'],
  icon: 'settings',
  version: '1.4.0',
  metadata: {
   author: 'Reporting Team',
   created: '2024-01-18T13:45:00Z',
   lastModified: '2024-01-29T10:20:00Z'
  },
  template: {
   actions: [
    {
     name: 'generateReportAction',
     functionRef: {
      refName: 'generatePDFReport',
      arguments: {
       template: '{{ .reportTemplate }}',
       data: '{{ .reportData }}',
       outputPath: '{{ .outputPath }}'
      }
     }
    }
   ],
   parameters: [
    {
     name: 'reportTemplate',
     type: 'string',
     required: true,
     description: 'Report template identifier'
    },
    {
     name: 'reportData',
     type: 'object',
     required: true,
     description: 'Data to populate in the report'
    },
    {
     name: 'outputPath',
     type: 'string',
     required: false,
     description: 'Output file path for generated report',
     default: '/tmp/report.pdf'
    }
   ]
  },
  errorHandling: [
   {
    errorRef: 'ReportGenerationError',
    retryPolicy: 'linear-backoff',
    maxRetries: 2
   }
  ]
 }
];

// Generate categories from operations
const generateCategories = () => {
 const categoryMap = new Map();

 operations.forEach(op => {
  if (!categoryMap.has(op.category)) {
   categoryMap.set(op.category, {
    id: op.category,
    name: op.category.charAt(0).toUpperCase() + op.category.slice(1).replace('-', ' '),
    description: `${op.category.replace('-', ' ')} operations`,
    count: 0
   });
  }
  categoryMap.get(op.category).count++;
 });

 return Array.from(categoryMap.values());
};

// Helper function to filter operations
const filterOperations = (ops, { category, search, tags }) => {
 let filtered = ops;

 if (category && category !== 'all') {
  filtered = filtered.filter(op => op.category === category);
 }

 if (search) {
  const searchLower = search.toLowerCase();
  filtered = filtered.filter(op =>
   op.name.toLowerCase().includes(searchLower) ||
   op.description.toLowerCase().includes(searchLower) ||
   op.tags.some(tag => tag.toLowerCase().includes(searchLower))
  );
 }

 if (tags) {
  const tagList = tags.split(',').map(t => t.trim());
  filtered = filtered.filter(op =>
   tagList.some(tag => op.tags.includes(tag))
  );
 }

 return filtered;
};

// API Routes

// List operations endpoint
app.get('/api/v1/operations', (req, res) => {
 const { category, search, tags, limit = 50, offset = 0 } = req.query;

 console.log('📋 GET /api/v1/operations', { category, search, tags, limit, offset });

 const filtered = filterOperations(operations, { category, search, tags });

 // Pagination
 const limitNum = parseInt(limit);
 const offsetNum = parseInt(offset);
 const paginatedOps = filtered.slice(offsetNum, offsetNum + limitNum);

 const categories = generateCategories();

 const response = {
  operations: paginatedOps,
  categories,
  pagination: {
   total: filtered.length,
   limit: limitNum,
   offset: offsetNum,
   hasMore: offsetNum + limitNum < filtered.length
  }
 };

 console.log(`✅ Returning ${paginatedOps.length} operations (${filtered.length} total)`);
 res.json(response);
});

// Get operation details endpoint
app.get('/api/v1/operations/:id', (req, res) => {
 console.log('🔍 GET /api/v1/operations/' + req.params.id);

 const operation = operations.find(op => op.id === req.params.id);

 if (!operation) {
  console.log('❌ Operation not found');
  return res.status(404).json({ error: 'Operation not found' });
 }

 // Add documentation for detailed view
 const detailedOperation = {
  ...operation,
  documentation: {
   usage: `Use this operation to ${operation.description.toLowerCase()}`,
   examples: [
    {
     name: 'Basic Usage',
     description: `Basic example of using ${operation.name}`,
     parameters: operation.template.parameters.reduce((acc, param) => {
      acc[param.name] = param.default !== undefined ? param.default :
       param.type === 'string' ? 'example value' :
        param.type === 'number' ? 123 :
         param.type === 'boolean' ? true :
          param.type === 'object' ? {} : [];
      return acc;
     }, {})
    }
   ]
  }
 };

 console.log('✅ Returning operation details');
 res.json(detailedOperation);
});

// List categories endpoint
app.get('/api/v1/operations/categories', (req, res) => {
 console.log('📂 GET /api/v1/operations/categories');

 const categories = generateCategories().map(cat => ({
  ...cat,
  icon: cat.id === 'notification' ? 'bell' :
   cat.id === 'data-processing' ? 'database' :
    cat.id === 'integration' ? 'globe' :
     cat.id === 'storage' ? 'database' :
      cat.id === 'reporting' ? 'settings' : 'settings'
 }));

 console.log(`✅ Returning ${categories.length} categories`);
 res.json({ categories });
});

// Validate operation parameters endpoint
app.post('/api/v1/operations/:id/validate', (req, res) => {
 console.log('✅ POST /api/v1/operations/' + req.params.id + '/validate');

 const operation = operations.find(op => op.id === req.params.id);

 if (!operation) {
  return res.status(404).json({ error: 'Operation not found' });
 }

 const { parameters } = req.body;
 const errors = [];
 const warnings = [];

 // Validate required parameters
 operation.template.parameters.forEach(param => {
  if (param.required && (!parameters || !parameters[param.name])) {
   errors.push({
    field: param.name,
    message: `${param.name} is required`
   });
  }

  // Add some mock warnings
  if (param.name === 'message' && parameters && parameters[param.name] && parameters[param.name].length < 10) {
   warnings.push({
    field: param.name,
    message: 'Message is quite short, consider adding more details'
   });
  }
 });

 console.log(`✅ Validation complete - ${errors.length} errors, ${warnings.length} warnings`);

 res.json({
  valid: errors.length === 0,
  errors,
  warnings
 });
});

// Search operations endpoint
app.get('/api/v1/operations/search', (req, res) => {
 const { q } = req.query;
 console.log('🔍 GET /api/v1/operations/search?q=' + q);

 if (!q) {
  return res.json({ operations: [] });
 }

 const filtered = filterOperations(operations, { search: q });

 console.log(`✅ Search returned ${filtered.length} results`);
 res.json({ operations: filtered });
});

// Health check endpoint
app.get('/health', (req, res) => {
 res.json({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  operationsCount: operations.length,
  version: '1.0.0',
  message: 'Operations API is running successfully'
 });
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
 console.log('\n🚀 Mock Operations API Server started!');
 console.log(`📍 Server running on http://localhost:${PORT}`);
 console.log(`📊 Loaded ${operations.length} sample operations`);
 console.log(`📂 Available categories: ${generateCategories().map(c => c.name).join(', ')}`);
 console.log('\n📋 Available endpoints:');
 console.log(`   GET  /api/v1/operations - List operations`);
 console.log(`   GET  /api/v1/operations/:id - Get operation details`);
 console.log(`   GET  /api/v1/operations/categories - List categories`);
 console.log(`   POST /api/v1/operations/:id/validate - Validate parameters`);
 console.log(`   GET  /api/v1/operations/search - Search operations`);
 console.log(`   GET  /health - Health check`);
 console.log('\n💡 Try opening http://localhost:3000 and go to the Operations tab!');
});

// Graceful shutdown
process.on('SIGINT', () => {
 console.log('\n👋 Shutting down mock server...');
 process.exit(0);
}); 