import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preValidationAsyncHookHandler,
} from 'fastify';
import {FastifyRequestWithAuth, SimpleObject} from '../../types';
import {ErrorToHttp, IACLActor} from '@juadz/core';

export function handleError(error: unknown, reply: FastifyReply) {
  const e = error as ErrorToHttp;

  reply
    .status(e.statusCode || 500)
    .headers(e.headers || {})
    .send(e.body || {message: 'Internal server error'});
}

export function getActor(request: FastifyRequest): IACLActor {
  return (request as FastifyRequestWithAuth).user as IACLActor;
}

export function getId(request: FastifyRequest): string {
  return (request.params as SimpleObject).id as string;
}

export function getPreValidate(
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
