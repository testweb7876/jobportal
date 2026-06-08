const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Portal API',
      version: '1.0.0',
      description: 'Enterprise-grade Job Portal SaaS API — complete documentation',
      contact: { name: 'API Support', email: 'support@jobportal.com' },
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5000}/api/v1`, description: 'Development' },
      { url: 'https://api.jobportal.com/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        cookieAuth:  { type: 'apiKey', in: 'cookie', name: 'accessToken' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

module.exports = swaggerJsdoc(options);
