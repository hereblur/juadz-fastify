"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRestResource = exports.useSwagger = exports.useLogin = exports.useCors = exports.useBearer = void 0;
const JuadzFastify_1 = require("./JuadzFastify");
const bearer_1 = require("./plugins/bearer");
exports.useBearer = bearer_1.default;
const cors_1 = require("./plugins/cors");
exports.useCors = cors_1.default;
const swagger_1 = require("./plugins/swagger");
exports.useSwagger = swagger_1.default;
const restResource_1 = require("./plugins/restResource");
exports.useRestResource = restResource_1.default;
const login_1 = require("./plugins/login");
exports.useLogin = login_1.default;
exports.default = JuadzFastify_1.default;
//# sourceMappingURL=index.js.map