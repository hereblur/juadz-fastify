import { FastifyInstance } from 'fastify';
export default function useCors(domains: Array<string | RegExp>, headers: Array<string>): (fastify: FastifyInstance) => Promise<void>;
