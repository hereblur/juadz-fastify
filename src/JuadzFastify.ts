import Fastify, {FastifyServerOptions, FastifyInstance} from 'fastify';

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

export default async function JuadzFastify(options: JuadzFastifyOptions) {
  const fastify = Fastify(options.fastifyOptions || {logger: true});
  const port = options.port
    ? options.port
    : process.env.PORT
    ? parseInt(process.env.PORT)
    : 9000;

  fastify.decorateRequest('user', null);

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
