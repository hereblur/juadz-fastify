"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_1 = require("@fastify/swagger");
function useSwagger(config) {
    return async (fastify) => {
        await fastify.register(swagger_1.default, {
            routePrefix: config.documentPath || '/documentations',
            swagger: {
                info: {
                    title: config.title || 'Untitled document',
                    description: config.description || config.title || 'Untitled document',
                    version: config.version || '0.0.1',
                },
                host: config.endpoint || 'localhost',
                schemes: ['http'],
                consumes: ['application/json'],
                produces: ['application/json'],
                tags: [...(config.tags || []).map(name => ({ name }))],
                definitions: {},
                securityDefinitions: config.securityDefinitions || {
                    apiKey: {
                        type: 'apiKey',
                        name: 'Authorization',
                        in: 'header',
                    },
                },
            },
            uiConfig: {
                // docExpansion: 'full',
                deepLinking: false,
            },
            // uiHooks: {
            //   onRequest: function (request, reply, next) {
            //     next();
            //   },
            //   preHandler: function (request, reply, next) {
            //     next();
            //   },
            // },
            staticCSP: true,
            transformStaticCSP: header => header,
            exposeRoute: true,
            hideUntagged: false,
        });
    };
}
exports.default = useSwagger;
//# sourceMappingURL=swagger.js.map