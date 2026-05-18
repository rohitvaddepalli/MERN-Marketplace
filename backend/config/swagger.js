import swaggerJsdoc from 'swagger-jsdoc';

// Build server list dynamically so production API docs point to the right host
const servers = [{ url: 'http://localhost:5000', description: 'Development server' }];

if (process.env.RENDER_EXTERNAL_URL) {
    servers.unshift({
        url: `https://${process.env.RENDER_EXTERNAL_URL}`,
        description: 'Production server (Render)',
    });
} else if (process.env.PRODUCTION_API_URL) {
    servers.unshift({
        url: process.env.PRODUCTION_API_URL,
        description: 'Production server',
    });
}

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Marketplace API',
            version: '1.0.0',
            description:
                'REST API for the Marketplace platform — products, orders, auth, stores, analytics, and chat.',
        },
        servers,
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'access_token',
                },
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
