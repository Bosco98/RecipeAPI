import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Recipe Extractor API',
            version: '1.0.0',
            description: 'API for extracting recipe details',
        },
        servers: [
            {
                url: process.env.BASE_URL || 'http://localhost:8080',
                description: 'API Server',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
