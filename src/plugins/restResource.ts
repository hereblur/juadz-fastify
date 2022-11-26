import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preValidationAsyncHookHandler,
  RouteHandler,
  RouteShorthandMethod,
  RouteShorthandOptions,
} from 'fastify';
import {ErrorToHttp, JuadzResource} from '@juadz/core';
import {IACLActor, IDataRecord, IQueryAdaptor} from '@juadz/core';
import {FastifyRequestWithAuth} from '../types';

type DefinitionRoutes = 'create' | 'get' | 'update' | 'delete' | 'list';

export interface RestResourceHttpMethods {
  get?: string,
  list?: string,
  update?: string,
  create?: string,
  delete?: string,
}

export interface RestResourceDefinitionsOptions {
  prefix?: string;
  routes?: Array<DefinitionRoutes>;
  listAdaptor?: IQueryAdaptor;
  httpMethods?: RestResourceHttpMethods;
  authentication?: preValidationAsyncHookHandler | string | undefined;
}

export interface RestResourceDefinitions
  extends RestResourceDefinitionsOptions {
  resource: JuadzResource;
  path?: string;
}

const defaultRestResourceDefinitionsOptions = {
  prefix: '',
  routes: ['create', 'get', 'update', 'list'] as Array<DefinitionRoutes>,
};

interface SimpleObject extends Object {
  [key: string]: unknown;
}

function handleError(error: unknown, reply: FastifyReply) {
  const e = error as ErrorToHttp;

  reply
    .status(e.statusCode || 500)
    .headers(e.headers || {})
    .send(e.body || {message: 'Internal server error'});
}

function getActor(request: FastifyRequest): IACLActor {
  return (request as FastifyRequestWithAuth).user as IACLActor;
}

function getId(request: FastifyRequest): string {
  return (request.params as SimpleObject).id as string;
}

function getPreValidate(
  fastify: FastifyInstance,
  authentication: preValidationAsyncHookHandler | string | undefined
): preValidationAsyncHookHandler | undefined {
  if (typeof authentication === 'string') {
    const exFastify = fastify as unknown;
    return (exFastify as SimpleObject)[
      authentication
    ] as preValidationAsyncHookHandler;
  }
  if (!authentication) {
    return undefined;
  }
  return authentication;
}


export default function useRestResource(
  defaultDefinitions: RestResourceDefinitionsOptions,
  resources: Array<RestResourceDefinitions>
) {
  return async (fastify: FastifyInstance) => {
    const getDefinitions = (
      resourceDef: RestResourceDefinitions
    ): RestResourceDefinitions => {
      return {
        ...defaultRestResourceDefinitionsOptions,
        ...defaultDefinitions,
        ...resourceDef,
      };
    };

    const makePath = (
      name: string,
      withId: boolean,
      resourceDef: RestResourceDefinitions
    ) => {
      const def = getDefinitions(resourceDef);
      if (def.path) {
        return `${def.path.replace(/\/+$/, '')}${withId ? '/:id' : ''}`;
      }

      return `${(def.prefix || '').replace(/\/+$/, '')}/${name}${
        withId ? '/:id' : ''
      }`;
    };

    const makeRoute = (method: string, path: string, schema: RouteShorthandOptions, handler: RouteHandler): void => {
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
    }

    resources.forEach(resourceDef => {
      const definitions = getDefinitions(resourceDef);
      const {resource, routes = [], authentication} = definitions;

      if (routes.includes('get')) {
        makeRoute(definitions.httpMethods?.get || 'GET',
          makePath(resource.resourceName, true, definitions),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: getSchema(resource),
          },
          async (request, reply) => {
            try {
              const result = await resource.get(
                getActor(request),
                getId(request)
              );
              reply.send(result);
            } catch (error) {
              fastify.log.error(error);
              handleError(error, reply);
            }
          }
        );
      }

      if (routes.includes('update')) {
        makeRoute(definitions.httpMethods?.update || 'PATCH',
          makePath(resource.resourceName, true, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: updateSchema(resource),
          },
          async (request, reply) => {
            try {
              const result = await resource.update(
                getActor(request),
                getId(request),
                request.body as IDataRecord
              );
              reply.send(result);
            } catch (error) {
              fastify.log.error(error);
              handleError(error, reply);
            }
          }
        );
      }

      if (routes.includes('create')) {
        makeRoute(definitions.httpMethods?.create || 'POST',
          makePath(resource.resourceName, false, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: createSchema(resource),
          },
          async (request, reply) => {
            try {
              const result = await resource.create(
                getActor(request),
                request.body as IDataRecord
              );
              reply.send(result);
            } catch (error) {
              fastify.log.error(error);
              handleError(error, reply);
            }
          }
        );
      }

      if (routes.includes('delete')) {
        makeRoute(definitions.httpMethods?.delete || 'DELETE',
          makePath(resource.resourceName, true, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: deleteSchema(resource),
          },
          async (request, reply) => {
            try {
              const result = await resource.delete(
                getActor(request),
                getId(request)
              );
              reply.send(result);
            } catch (error) {
              fastify.log.error(error);
              handleError(error, reply);
            }
          }
        );
      }

      if (routes.includes('list') && definitions.listAdaptor) {
        makeRoute(definitions.httpMethods?.list || 'GET',
          makePath(resource.resourceName, false, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: listSchema(resource, definitions.listAdaptor),
          },
          async (request, reply) => {
            try {
              if (!definitions.listAdaptor) {
                throw new ErrorToHttp('ListAdaptor not defined');
              }
              const params = definitions.listAdaptor.parser(
                resource.resourceName,
                request.query as object
              );
              const result = await resource.list(getActor(request), params);
              const response = definitions.listAdaptor.response(
                result,
                params,
                resource.resourceName
              );
              const headers = response.headers as unknown;
              reply.headers(headers as object).send(response.body);
            } catch (error) {
              fastify.log.error(error);
              handleError(error, reply);
            }
          }
        );
      }
    });
  };
}

function listParamsSchema(params: Array<string>): SimpleObject {
  const result: SimpleObject = {};
  params.forEach(p => {
    result[p] = {type: 'string'};
  });
  return result;
}
const listSchema = (resource: JuadzResource, listAdaptor: IQueryAdaptor) => {
  return {
    description: `List ${resource.resourceName}`,
    tags: [resource.resourceName],
    querystring: {
      type: 'object',
      properties: listParamsSchema(listAdaptor.params),
    },
    response: {
      200: {
        type: 'array',
        item: {
          type: 'object',
          additionalProperties: false,
          properties: resource.schema.viewSchema,
        },
      },
    },
  };
};

const getSchema = (resource: JuadzResource) => {
  return {
    description: `Get ${resource.resourceName} by ID`,
    tags: [resource.resourceName],
    params: {
      type: 'object',
      properties: {
        id: {type: 'string'},
      },
      required: ['id'],
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: false,
        properties: resource.schema.viewSchema,
      },
    },
  };
};

const createSchema = (resource: JuadzResource) => {
  return {
    description: `Create ${resource.resourceName}`,
    tags: [resource.resourceName],
    body: {
      type: 'object',
      additionalProperties: false,
      properties: resource.schema.createSchema,
      required: resource.schema.requiredFields,
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: false,
        properties: resource.schema.viewSchema,
      },
    },
  };
};

const updateSchema = (resource: JuadzResource) => {
  return {
    description: `Update ${resource.resourceName} by ID`,
    tags: [resource.resourceName],
    params: {
      type: 'object',
      properties: {
        id: {type: 'string'},
      },
      required: ['id'],
    },
    body: {
      type: 'object',
      additionalProperties: false,
      properties: resource.schema.updateSchema,
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: false,
        properties: resource.schema.viewSchema,
      },
    },
  };
};

const deleteSchema = (resource: JuadzResource) => {
  return {
    description: `Get ${resource.resourceName} by ID`,
    tags: [resource.resourceName],
    params: {
      type: 'object',
      properties: {
        id: {type: 'string'},
      },
      required: ['id'],
    },
    response: {
      200: {
        type: 'object',
      },
    },
  };
};
