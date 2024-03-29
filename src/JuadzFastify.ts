import { IACLActor, StringObject } from '@juadz/core';
import Fastify, {FastifyServerOptions, FastifyInstance, FastifyRequest} from 'fastify';
import { SecurityDefinition, SecurityDefinitionFunction } from './types';

interface PluginsInitFunction {
  (fastify: FastifyInstance): void | Promise<void>;
}


export function apiKey(index: string, headerOrQueryName: string, _in :  'header' | 'query', authenFunc: SecurityDefinitionFunction): SecurityDefinition {
  return {
    index,
    type: 'apiKey',
    name: headerOrQueryName,
    in: _in,
    func: authenFunc,
  }
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
  securityDefinitions?: Array<SecurityDefinition>;
}

export default async function JuadzFastify(options: JuadzFastifyOptions) {
  const fastify = Fastify(options.fastifyOptions || {logger: true});
  const port = options.port
    ? options.port
    : process.env.PORT
    ? parseInt(process.env.PORT)
    : 9000;

  fastify.decorateRequest('user', null);

  (options.securityDefinitions || []).forEach((def) => {
    fastify.decorate(def.index, def.func);
  });

  fastify.decorate('getSecurityDefinitions', () => options.securityDefinitions || []);

  for (const f of options.plugins || []) {
    await f(fastify);
  }

  fastify.listen({host: options.host || '0.0.0.0', port}, (err, address) => {
    if (err) {
      fastify.log.error(err);

      throw err;
    }

    fastify.log.info(address);
  });

  return fastify;
}
