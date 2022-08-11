import {FastifyInstance} from 'fastify';
import FastifyCors from '@fastify/cors';

export default function useCors(
  domains: Array<string | RegExp>,
  headers: Array<string>
) {
  return async (fastify: FastifyInstance) => {
    fastify.register(FastifyCors, {
      origin: domains,
      methods: ['GET', 'PUT', 'POST', 'DELETE'],
      allowedHeaders: headers || [],
    });
  };
}
