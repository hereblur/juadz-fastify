"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = require("@fastify/cors");
function useCors(domains, headers) {
    return async (fastify) => {
        fastify.register(cors_1.default, {
            origin: domains,
            methods: ['GET', 'PUT', 'POST', 'DELETE'],
            allowedHeaders: headers || [],
        });
    };
}
exports.default = useCors;
//# sourceMappingURL=cors.js.map