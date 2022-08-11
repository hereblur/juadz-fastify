import {FastifyInstance} from 'fastify';
import FastifySwagger from '@fastify/swagger';
import {OpenAPIV2} from 'openapi-types';

export interface SwaggerConfig {
  title?: string;
  description?: string;
  version?: string;
  endpoint?: string;
  documentPath?: string;
  tags?: Array<string>;
  securityDefinitions?: OpenAPIV2.SecurityDefinitionsObject;
}

export default function useSwagger(config: SwaggerConfig) {
  return async (fastify: FastifyInstance) => {
    await fastify.register(FastifySwagger, {
      routePrefix: config.documentPath || '/documentations',
      swagger: {
        info: {
          title: config.title || 'Untitled document',
          description:
            config.description || config.title || 'Untitled document',
          version: config.version || '0.0.1',
        },
        host: config.endpoint || 'localhost',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [...(config.tags || []).map(name => ({name}))],
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
