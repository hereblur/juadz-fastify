import { FastifyInstance } from 'fastify';
import { OpenAPIV2 } from 'openapi-types';
export interface SwaggerConfig {
    title?: string;
    description?: string;
    version?: string;
    endpoint?: string;
    documentPath?: string;
    tags?: Array<string>;
    securityDefinitions?: OpenAPIV2.SecurityDefinitionsObject;
}
export default function useSwagger(config: SwaggerConfig): (fastify: FastifyInstance) => Promise<void>;
