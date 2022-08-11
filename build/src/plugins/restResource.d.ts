import { FastifyInstance, preValidationAsyncHookHandler } from 'fastify';
import { JuadzResource } from '@juadz/core';
import { IQueryAdaptor } from '@juadz/core';
declare type DefinitionRoutes = 'create' | 'get' | 'update' | 'delete' | 'list';
export interface RestResourceDefinitionsOptions {
    prefix?: string;
    routes?: Array<DefinitionRoutes>;
    listAdaptor?: IQueryAdaptor;
    authentication?: preValidationAsyncHookHandler | string | undefined;
}
export interface RestResourceDefinitions extends RestResourceDefinitionsOptions {
    resource: JuadzResource;
    path?: string;
}
export default function useRestResource(defaultDefinitions: RestResourceDefinitionsOptions, resources: Array<RestResourceDefinitions>): (fastify: FastifyInstance) => Promise<void>;
export {};
