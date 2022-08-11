"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("@fastify/auth");
function useBearer(authenticationName, authen) {
    return async (fastify) => {
        await fastify
            .decorate(authenticationName, async (request, reply) => {
            try {
                const payload = await authen.verify(`${request.headers['authorization']}`
                    .replace(/^Bearer /, '')
                    .trim());
                if (payload) {
                    request.user = payload;
                    return;
                }
                reply.status(401).send({ message: 'Session invalid or expired' });
            }
            catch (error) {
                reply.status(401).send({ message: 'Session check failed' });
            }
        })
            .register(auth_1.default);
    };
}
exports.default = useBearer;
//# sourceMappingURL=bearer.js.map