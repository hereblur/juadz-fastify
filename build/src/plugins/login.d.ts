import { FastifyInstance } from 'fastify';
import { Authentication, IHttpJsonResponse } from '@juadz/core';
interface LoginHandler {
    (reqBody: unknown, auth: Authentication): Promise<IHttpJsonResponse>;
}
interface LoginOptions {
    path?: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    fields?: Array<string>;
}
export default function useLogin(loginFunc: LoginHandler, auth: Authentication, options?: LoginOptions): (fastify: FastifyInstance) => Promise<void>;
export {};
