import {JuadzResource} from '@juadz/core';
import {FastifyInstance, RouteHandler} from 'fastify';
import {getActor, getId, handleError} from './common';

export function buildSchema(resource: JuadzResource) {
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
}

export function buildHandler(
  fastify: FastifyInstance,
  resource: JuadzResource
): RouteHandler {
  return async (request, reply) => {
    try {
      const result = await resource.get(getActor(request), getId(request));
      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      handleError(error, reply);
    }
  };
}
