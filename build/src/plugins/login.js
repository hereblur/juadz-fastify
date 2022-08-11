"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@juadz/core");
function useLogin(loginFunc, auth, options = {}) {
    return async (fastify) => {
        fastify.route({
            method: options.method || 'POST',
            url: options.path || '/login',
            schema: loginSchema(options.fields || ['username', 'password']),
            handler: async function (request, reply) {
                try {
                    const result = await loginFunc(request.body, auth);
                    if (result && result.body) {
                        reply
                            .status(200)
                            .headers(result.headers || {})
                            .send(result.body);
                        return;
                    }
                    throw new core_1.ErrorToHttp('Empty login reponse');
                }
                catch (error) {
                    fastify.log.error(error);
                    reply.status(401).send({ message: 'Login failed' });
                }
            },
        });
    };
}
exports.default = useLogin;
const loginSchema = (fields) => {
    return {
        description: 'Login',
        tags: ['login'],
        body: {
            type: 'object',
            additionalProperties: false,
            properties: fields.reduce((o, f) => ({
                ...o,
                [f]: {
                    type: ['string'],
                },
            }), {}),
            required: fields,
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: true,
            },
        },
    };
};
//# sourceMappingURL=login.js.map