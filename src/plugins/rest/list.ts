import {ErrorToHttp, IQueryAdaptor, JuadzResource} from '@juadz/core';
import {SimpleObject} from '../../types';
import {FastifyInstance, RouteHandler} from 'fastify';
import {getActor, handleError} from './common';

function listParamsSchema(params: Array<string>): SimpleObject {
  const result: SimpleObject = {};
  params.forEach(p => {
    result[p] = {type: 'string'};
  });
  return result;
}

export function buildSchema(
  resource: JuadzResource,
  listAdaptor: IQueryAdaptor
) {
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
}

export function buildHandler(
  fastify: FastifyInstance,
  resource: JuadzResource,
  listAdaptor: IQueryAdaptor
): RouteHandler {
  return async (request, reply) => {
    try {
      if (!listAdaptor) {
        throw new ErrorToHttp('ListAdaptor not defined');
      }
      const params = listAdaptor.parser(
        resource.resourceName,
        request.query as object
      );
      const result = await resource.list(getActor(request), params);
      const response = listAdaptor.response(
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
  };
}
