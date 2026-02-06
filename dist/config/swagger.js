import swaggerJsdoc from 'swagger-jsdoc';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Health Recipe Extractor API',
            version: '1.0.0',
            description: 'API for extracting healthy recipe details from URLs',
        },
        servers: [
            {
                url: process.env.BASE_URL || 'http://localhost:3000',
                description: 'API Server',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};
export const specs = swaggerJsdoc(options);
