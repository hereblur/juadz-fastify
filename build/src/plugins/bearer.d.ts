import { FastifyInstance } from 'fastify';
import { Authentication } from '@juadz/core';
export default function useBearer(authenticationName: string, authen: Authentication): (fastify: FastifyInstance) => Promise<void>;
