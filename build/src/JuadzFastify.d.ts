/// <reference types="node" />
import { FastifyServerOptions, FastifyInstance } from 'fastify';
interface PluginsInitFunction {
    (fastify: FastifyInstance): void | Promise<void>;
}
interface JuadzFastifyOptions {
    name: string;
    url?: string;
    host?: string;
    port?: number;
    fastifyOptions?: FastifyServerOptions;
    corsDomains?: Array<string | RegExp>;
    corsHeaders?: Array<string>;
    plugins?: Array<PluginsInitFunction>;
}
export default function JuadzFastify(options: JuadzFastifyOptions): Promise<FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse, import("fastify").FastifyLoggerInstance, import("fastify").FastifyTypeProviderDefault>>;
export {};
