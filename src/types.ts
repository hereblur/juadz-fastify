import {FastifyRequest} from 'fastify';

export interface FastifyRequestWithAuth extends FastifyRequest {
  user?: unknown;
}

export interface SimpleObject extends Object {
  [key: string]: unknown;
}
