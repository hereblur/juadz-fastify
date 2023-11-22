import {FastifyInstance} from 'fastify';
import FastifySwagger from '@fastify/swagger';
import {OpenAPIV2} from 'openapi-types';
import { SecurityDefinition } from '../types';

export interface SwaggerConfig {
  title?: string;
  description?: string;
  version?: string;
  endpoint?: string;
  protocol?: string;
  documentPath?: string;
  tags?: Array<string>;
}

interface FastifyEx extends FastifyInstance {
  getSecurityDefinitions: () => Array<SecurityDefinition>
}

function makeSecurityDefinitions(fastify: FastifyEx): OpenAPIV2.SecurityDefinitionsObject {
  const result: OpenAPIV2.SecurityDefinitionsObject = {};
  const defs = fastify.getSecurityDefinitions();
  if (defs && defs.length > 0) {
    
    defs.forEach(def => {
      const { index, func, ...rest } = def;
      result[index] = rest;
    })
  }

  return result;
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
        schemes: [config.protocol || 'http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [...(config.tags || []).map(name => ({name}))],
        definitions: {},
        securityDefinitions: makeSecurityDefinitions(fastify as FastifyEx),
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
