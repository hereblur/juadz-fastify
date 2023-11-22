import { IACLActor, StringObject } from '@juadz/core';
import {FastifyRequest} from 'fastify';
import { OpenAPIV2 } from 'openapi-types';

export interface FastifyRequestWithAuth extends FastifyRequest {
  user?: unknown;
}

export interface SimpleObject extends Object {
  [key: string]: unknown;
}

export interface SecurityDefinitionFunction {
  (request: FastifyRequest): Promise<IACLActor>;
}

export type SecurityDefinition =  OpenAPIV2.SecuritySchemeObject & {
  index: string;
  func: SecurityDefinitionFunction;
}
