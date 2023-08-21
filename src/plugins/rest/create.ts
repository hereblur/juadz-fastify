import {IDataRecord, JuadzResource} from '@juadz/core';
import {FastifyInstance, RouteHandler} from 'fastify';
import {getActor, handleError} from './common';

export function buildSchema(resource: JuadzResource) {
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
}

export function buildHandler(
  fastify: FastifyInstance,
  resource: JuadzResource
): RouteHandler {
  return async (request, reply) => {
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
  };
}
