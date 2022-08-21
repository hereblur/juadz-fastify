import {FastifyInstance, RouteOptions} from 'fastify';
import {IAuthentication, ErrorToHttp, IHttpJsonResponse} from '@juadz/core';

interface LoginHandler {
  (reqBody: unknown, auth: IAuthentication): Promise<IHttpJsonResponse>;
}

interface LoginOptions {
  path?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  fields?: Array<string>;
}

export default function useLogin(
  loginFunc: LoginHandler,
  auth: IAuthentication,
  options: LoginOptions = {}
) {
  return async (fastify: FastifyInstance) => {
    fastify.route({
      method: options.method || 'POST',
      url: options.path || '/login',
      schema: loginSchema(options.fields || ['username', 'password']),
      handler: async function (request, reply) {
        try {
          const result = await loginFunc(request.body, auth);
          if (result && result.body) {
            reply
              .status(200)
              .headers(result.headers || {})
              .send(result.body);
            return;
          }
          throw new ErrorToHttp('Empty login reponse');
        } catch (error) {
          fastify.log.error(error);
          reply.status(401).send({message: 'Login failed'});
        }
      },
    } as RouteOptions);
  };
}

const loginSchema = (fields: Array<string>) => {
  return {
    description: 'Login',
    tags: ['login'],
    body: {
      type: 'object',
      additionalProperties: false,
      properties: fields.reduce(
        (o, f) => ({
          ...o,
          [f]: {
            type: ['string'],
          },
        }),
        {}
      ),
      required: fields,
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: true,
      },
    },
  };
};
