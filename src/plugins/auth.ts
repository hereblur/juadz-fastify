import {FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import FastifyAuth from '@fastify/auth';
import {IACLActor, IAuthentication} from '@juadz/core';
import {FastifyRequestWithAuth} from '../types';
import Debug from 'debug';

const debug = Debug('juadz/fastify');

export default function useBearer(
  authenticationName: string,
  authen: IAuthentication
) {
  return async (fastify: FastifyInstance) => {
    await fastify
      .decorate(
        authenticationName,
        async (request: FastifyRequest, reply: FastifyReply) => {
          debug(`${authenticationName}: ${request.headers['authorization'] || 'empty'}`)
          try {
            const payload: IACLActor = await authen.verify(
              `${request.headers['authorization']}`
                .replace(/^Bearer /, '')
                .trim()
            );

            if (payload) {
              debug(`${authenticationName}: pass`, JSON.stringify(payload));
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
