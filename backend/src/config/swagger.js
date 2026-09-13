import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Daily Fresh API Documentation',
      version: '1.0.0',
      description: 'Definitive API guide for Daily Fresh Customer, Rider, and Admin applications.',
      contact: {
        name: 'API Support',
        url: 'https://dailyfreshkolkata.in',
      },
    },
    servers: [
      {
        url: 'https://api.dailyfreshkolkata.in/api/v1',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development',
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/domains/**/*.js', './src/shared/**/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
