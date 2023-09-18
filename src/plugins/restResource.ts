import {
  FastifyInstance,
  preValidationAsyncHookHandler,
  RouteHandler,
  RouteHandlerMethod,
  // RouteShorthandMethod,
  RouteShorthandOptions,
} from 'fastify';

import { JuadzResource, IQueryAdaptor, ResourceHandler, IResourceEndpoint, StringObject, ErrorToHttp } from '@juadz/core';
import { getActor, getPreValidate } from './rest/common';

export interface RestResourceDefinitionsOptions {
  prefix?: string;
  listAdaptor?: IQueryAdaptor;
  authentication?: preValidationAsyncHookHandler | string | undefined;
}

export interface RestResourceDefinitions
  extends RestResourceDefinitionsOptions {
  resource: JuadzResource;
  path?: string;
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

        let authentication_ = authentication;
        if (endpoint.authentication) {
          authentication_ = endpoint.authentication;
        }

        makeRoute(
          endpoint.method,
          makePath(definitions, endpoint.path),
          {
            preValidation: getPreValidate(fastify, authentication_),
            schema: {
              tags: [resource.resourceName],
              description: `${endpoint.method} ${resource.resourceName} [@juadz]`,
              querystring: endpoint.querySchema,
              params: endpoint.paramsSchema,
              body: endpoint.bodySchema,
              response: {
                200: endpoint.responseSchema,
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