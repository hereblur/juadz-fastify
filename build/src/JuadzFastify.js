"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
async function JuadzFastify(options) {
    const fastify = (0, fastify_1.default)(options.fastifyOptions || { logger: true });
    const port = options.port
        ? options.port
        : process.env.PORT
            ? parseInt(process.env.PORT)
            : 9000;
    fastify.decorateRequest('user', null);
    for (const f of options.plugins || []) {
        await f(fastify);
    }
    fastify.listen({ host: options.host || '0.0.0.0', port }, (err, address) => {
        if (err) {
            fastify.log.error(err);
            throw err;
        }
        fastify.log.info(address);
    });
    return fastify;
}
exports.default = JuadzFastify;
//# sourceMappingURL=JuadzFastify.js.map