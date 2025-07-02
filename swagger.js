const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Matcha API',
      version: '1.0.0',
      description: 'Dating app API documentation',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-url.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            gender: { type: 'string', enum: ['male', 'female', 'non-binary'] },
            sexual_interest: { type: 'string', enum: ['male', 'female', 'non-binary', 'Any'] },
            birthdate: { type: 'string', format: 'date' },
            rating: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'validation', 'step_one', 'complete'] },
            bio: { type: 'string' },
            age: { type: 'integer' },
            interests: {
              type: 'array',
              items: { $ref: '#/components/schemas/Interest' }
            },
            pictures: {
              type: 'array',
              items: { $ref: '#/components/schemas/Picture' }
            },
            location: { $ref: '#/components/schemas/Location' },
            like_count: { type: 'integer' }
          }
        },
        Interest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        },
        Picture: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            url: { type: 'string' },
            is_profile: { type: 'boolean' }
          }
        },
        Location: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            sender_id: { type: 'integer' },
            receiver_id: { type: 'integer' },
            content: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            is_read: { type: 'boolean' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            seen: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            status: { type: 'integer' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes.js', './controllers/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);
module.exports = specs;