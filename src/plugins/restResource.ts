import {
  FastifyInstance,
  preValidationAsyncHookHandler,
  RouteHandler,
  // RouteShorthandMethod,
  RouteShorthandOptions,
} from 'fastify';
import {JuadzResource} from '@juadz/core';
import {IQueryAdaptor} from '@juadz/core';
import * as restGet from './rest/get';
import * as restUpdate from './rest/update';
import * as restCreate from './rest/create';
import * as restReplace from './rest/replace';
import * as restDelete from './rest/delete';
import * as restList from './rest/list';
import {getPreValidate} from './rest/common';

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
      return {
        prefix: '',
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
      const methodsMapping = resource.methodsMapping;

      if (methodsMapping.view) {
        makeRoute(
          methodsMapping.view,
          makePath(resource.resourceName, true, definitions),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: restGet.buildSchema(resource),
          },
          restGet.buildHandler(fastify, resource)
        );
      }

      if (methodsMapping.update) {
        makeRoute(
          methodsMapping.update,
          makePath(resource.resourceName, true, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: restUpdate.buildSchema(resource),
          },
          restUpdate.buildHandler(fastify, resource)
        );
      }

      if (methodsMapping.create) {
        makeRoute(
          methodsMapping.create,
          makePath(resource.resourceName, false, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: restCreate.buildSchema(resource),
          },
          restCreate.buildHandler(fastify, resource)
        );
      }

      if (methodsMapping.replace) {
        makeRoute(
          methodsMapping.replace,
          makePath(resource.resourceName, false, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: restReplace.buildSchema(resource),
          },
          restReplace.buildHandler(fastify, resource)
        );
      }

      if (methodsMapping.delete) {
        makeRoute(
          methodsMapping.delete,
          makePath(resource.resourceName, true, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: restDelete.buildSchema(resource),
          },
          restDelete.buildHandler(fastify, resource)
        );
      }

      if (methodsMapping.list && definitions.listAdaptor) {
        makeRoute(
          methodsMapping.list,
          makePath(resource.resourceName, false, resourceDef),
          {
            preValidation: getPreValidate(fastify, authentication),
            schema: restList.buildSchema(resource, definitions.listAdaptor),
          },
          restList.buildHandler(fastify, resource, definitions.listAdaptor)
        );
      }
    });
  };
}
