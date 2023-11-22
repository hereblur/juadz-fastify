import {
  FastifyInstance,
  RouteHandler,
  RouteHandlerMethod,
  RouteShorthandOptions
} from 'fastify';

import { JuadzResource, IQueryAdaptor, ResourceHandler, IResourceEndpoint, StringObject, ErrorToHttp, JuadzSchema } from '@juadz/core';
import { getActor, getPreValidate } from './rest/common';
import { ExtendedPropertiesSchema } from '@juadz/core/build/src/schema/types';

export interface RestResourceDefinitionsOptions {
  prefix?: string;
  listAdaptor?: IQueryAdaptor;
  authentication?: string | undefined;
}

export interface RestResourceDefinitions
  extends RestResourceDefinitionsOptions {
  resource: JuadzResource;
  path?: string;
}

const makeParamSchemaFromPath = (path: string) => {
  const pathParts = path.split('/');
  const paramsSchema: ExtendedPropertiesSchema = {};
  pathParts.forEach((p) => {
    if (p.charAt(0) === ':') {
      const paramName = p.substring(1);
      paramsSchema[paramName] = {
        type: 'string',
      };
    }
  });

  if (Object.keys(paramsSchema).length === 0) {
    return undefined;
  }

  // console.log(paramsSchema, JuadzSchema.toJsonSchema(paramsSchema));

  return JuadzSchema.toJsonSchema(paramsSchema);
}

export default function useRestResource(
  defaultDefinitions: RestResourceDefinitionsOptions,
  resources: Array<RestResourceDefinitions>
) {
  return async (fastify: FastifyInstance) => {
    const getDefinitions = (
      resourceDef: RestResourceDefinitions
    ): RestResourceDefinitions => {
      const prefix = (resourceDef.prefix || defaultDefinitions.prefix || '').replace(/\/+$/, '');
      return {
        path: `${prefix}/${resourceDef.resource.resourceName}`,
        ...defaultDefinitions,
        ...resourceDef,
      };
    };

    const makePath = (      
      resourceDef: RestResourceDefinitions,
      endpointPath: string,
    ) => {
      const def = getDefinitions(resourceDef);

      if (endpointPath && endpointPath.length) {
        if (endpointPath.charAt(0) === '/') {
          return endpointPath
        }
        return [def.path, endpointPath].join('/');
      }

      return `${def.path}`;
    }
 
    const makeRoute = (
      method: string,
      path: string,
      schema: RouteShorthandOptions,
      handler: RouteHandler
    ): void => {

      // if (path === '/api/sso-v2/agents/:id') {
      //   console.log('login', method, path, JSON.stringify(schema, null, 2))
      // }

      switch (method.toLowerCase()) {
        case 'get':
          fastify.get(path, schema, handler);
          break;
        case 'post':
          fastify.post(path, schema, handler);
          break;
        case 'put':
          fastify.put(path, schema, handler);
          break;
        case 'patch':
          fastify.patch(path, schema, handler);
          break;
        case 'delete':
          fastify.delete(path, schema, handler);
          break;
        case 'head':
          fastify.head(path, schema, handler);
          break;
      }

      // throw new Error(`HTTP method ${method} is not supported.`)
    };

    resources.forEach(resourceDef => {
      const definitions = getDefinitions(resourceDef);
      const {resource, authentication} = definitions;
 
      resource.getEndpoints(definitions.listAdaptor).forEach((endpoint: IResourceEndpoint) => {

        let authenticationName: string = endpoint.authentication || definitions.authentication || '';
        if (authenticationName == 'none') {
          authenticationName = '';
        }

        makeRoute(
          endpoint.method,
          makePath(definitions, endpoint.path),
          {
            preValidation: getPreValidate(fastify, endpoint.authentication || authentication),
            schema: {
              tags: endpoint.tags,
              summary: endpoint.description,
              description: `permission: ${endpoint.action}.${resource.permissionName}`,
              querystring: endpoint.querySchema ?  JuadzSchema.toJsonSchema(endpoint.querySchema) : undefined,
              params: endpoint.paramsSchema ? JuadzSchema.toJsonSchema(endpoint.paramsSchema) : makeParamSchemaFromPath(endpoint.path),
              body: endpoint.bodySchema ? endpoint.bodySchema : undefined,
              security: authenticationName ? [{[authenticationName]: []}] : undefined,
              response: {
                200: endpoint.responseSchema ? 
                      JuadzSchema.toJsonSchema(endpoint.responseSchema) : 
                      { "type": "object", "additionalProperties": true } 
              },

            },
          },
          fastifyHandlerAdaptor(fastify, endpoint.handler),
        );
      });

    });
  };
}

function fastifyHandlerAdaptor(fastify: FastifyInstance, resourceHandler: ResourceHandler): RouteHandlerMethod {
  return async (request, reply) => {
    try{
      const result = await resourceHandler({
        method: request.method,
        path: request.url,
        query: request.query as StringObject,
        params: request.params as StringObject,
        body: request.body as object,
        headers: request.headers as StringObject,
        actor: getActor(request),
        request: request,
      });
      reply.headers(result.headers || {} ).send(result.body );
    } catch(error) {
      fastify.log.error(error);
      const e = error as ErrorToHttp;

      reply
        .status(e.statusCode || 500)
        .headers(e.headers || {})
        .send(e.body || {message: 'Internal server error'});    
    }
  }
}