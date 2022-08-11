import { FastifyRequest } from 'fastify';
export interface FastifyRequestWithAuth extends FastifyRequest {
    user?: unknown;
}
