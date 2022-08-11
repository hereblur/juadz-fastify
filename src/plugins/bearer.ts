import {FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import FastifyAuth from '@fastify/auth';
import {IACLActor, Authentication} from '@juadz/core';
import {FastifyRequestWithAuth} from '../types';

export default function useBearer(
  authenticationName: string,
  authen: Authentication
) {
  return async (fastify: FastifyInstance) => {
    await fastify
      .decorate(
        authenticationName,
        async (request: FastifyRequest, reply: FastifyReply) => {
          try {
            const payload: IACLActor = await authen.verify(
              `${request.headers['authorization']}`
                .replace(/^Bearer /, '')
                .trim()
            );

            if (payload) {
              (request as FastifyRequestWithAuth).user = payload;
              return;
            }

            reply.status(401).send({message: 'Session invalid or expired'});
          } catch (error) {
            reply.status(401).send({message: 'Session check failed'});
          }
        }
      )
      .register(FastifyAuth);
  };
}
