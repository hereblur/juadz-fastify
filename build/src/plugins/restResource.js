"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@juadz/core");
const defaultRestResourceDefinitionsOptions = {
    prefix: '',
    routes: ['create', 'get', 'update', 'list'],
};
function handleError(error, reply) {
    const e = error;
    reply
        .status(e.statusCode || 500)
        .headers(e.headers || {})
        .send(e.body || { message: 'Internal server error' });
}
function getActor(request) {
    return request.user;
}
function getId(request) {
    return request.params.id;
}
function getPreValidate(fastify, authentication) {
    if (typeof authentication === 'string') {
        const exFastify = fastify;
        return exFastify[authentication];
    }
    if (!authentication) {
        return undefined;
    }
    return authentication;
}
function useRestResource(defaultDefinitions, resources) {
    return async (fastify) => {
        const getDefinitions = (resourceDef) => {
            return {
                ...defaultRestResourceDefinitionsOptions,
                ...defaultDefinitions,
                ...resourceDef,
            };
        };
        const makePath = (name, withId, resourceDef) => {
            const def = getDefinitions(resourceDef);
            if (def.path) {
                return `${def.path.replace(/\/+$/, '')}${withId ? '/:id' : ''}`;
            }
            return `${(def.prefix || '').replace(/\/+$/, '')}/${name}${withId ? '/:id' : ''}`;
        };
        resources.forEach(resourceDef => {
            const definitions = getDefinitions(resourceDef);
            const { resource, routes = [], authentication } = definitions;
            if (routes.includes('get')) {
                fastify.get(makePath(resource.resourceName, true, definitions), {
                    preValidation: getPreValidate(fastify, authentication),
                    schema: getSchema(resource),
                }, async (request, reply) => {
                    try {
                        const result = await resource.get(getActor(request), getId(request));
                        reply.send(result);
                    }
                    catch (error) {
                        fastify.log.error(error);
                        handleError(error, reply);
                    }
                });
            }
            if (routes.includes('update')) {
                fastify.patch(makePath(resource.resourceName, true, resourceDef), {
                    preValidation: getPreValidate(fastify, authentication),
                    schema: updateSchema(resource),
                }, async (request, reply) => {
                    try {
                        const result = await resource.update(getActor(request), getId(request), request.body);
                        reply.send(result);
                    }
                    catch (error) {
                        fastify.log.error(error);
                        handleError(error, reply);
                    }
                });
            }
            if (routes.includes('create')) {
                fastify.post(makePath(resource.resourceName, false, resourceDef), {
                    preValidation: getPreValidate(fastify, authentication),
                    schema: createSchema(resource),
                }, async (request, reply) => {
                    try {
                        const result = await resource.create(getActor(request), request.body);
                        reply.send(result);
                    }
                    catch (error) {
                        fastify.log.error(error);
                        handleError(error, reply);
                    }
                });
            }
            if (routes.includes('delete')) {
                fastify.delete(makePath(resource.resourceName, true, resourceDef), {
                    preValidation: getPreValidate(fastify, authentication),
                    schema: deleteSchema(resource),
                }, async (request, reply) => {
                    try {
                        const result = await resource.delete(getActor(request), getId(request));
                        reply.send(result);
                    }
                    catch (error) {
                        fastify.log.error(error);
                        handleError(error, reply);
                    }
                });
            }
            if (routes.includes('list') && definitions.listAdaptor) {
                fastify.get(makePath(resource.resourceName, false, resourceDef), {
                    preValidation: getPreValidate(fastify, authentication),
                    schema: listSchema(resource, definitions.listAdaptor),
                }, async (request, reply) => {
                    try {
                        if (!definitions.listAdaptor) {
                            throw new core_1.ErrorToHttp('ListAdaptor not defined');
                        }
                        const params = definitions.listAdaptor.parser(resource.resourceName, request.query);
                        const result = await resource.list(getActor(request), params);
                        const response = definitions.listAdaptor.response(result, params, resource.resourceName);
                        const headers = response.headers;
                        reply.headers(headers).send(response.body);
                    }
                    catch (error) {
                        fastify.log.error(error);
                        handleError(error, reply);
                    }
                });
            }
        });
    };
}
exports.default = useRestResource;
function listParamsSchema(params) {
    const result = {};
    params.forEach(p => {
        result[p] = { type: 'string' };
    });
    return result;
}
const listSchema = (resource, listAdaptor) => {
    return {
        description: `List ${resource.resourceName}`,
        tags: [resource.resourceName],
        querystring: {
            type: 'object',
            properties: listParamsSchema(listAdaptor.params),
        },
        response: {
            200: {
                type: 'array',
                item: {
                    type: 'object',
                    additionalProperties: false,
                    properties: resource.schema.viewSchema,
                },
            },
        },
    };
};
const getSchema = (resource) => {
    return {
        description: `Get ${resource.resourceName} by ID`,
        tags: [resource.resourceName],
        params: {
            type: 'object',
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: resource.schema.viewSchema,
            },
        },
    };
};
const createSchema = (resource) => {
    return {
        description: `Create ${resource.resourceName}`,
        tags: [resource.resourceName],
        body: {
            type: 'object',
            additionalProperties: false,
            properties: resource.schema.createSchema,
            required: resource.schema.requiredFields,
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: resource.schema.viewSchema,
            },
        },
    };
};
const updateSchema = (resource) => {
    return {
        description: `Update ${resource.resourceName} by ID`,
        tags: [resource.resourceName],
        params: {
            type: 'object',
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        },
        body: {
            type: 'object',
            additionalProperties: false,
            properties: resource.schema.updateSchema,
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: resource.schema.viewSchema,
            },
        },
    };
};
const deleteSchema = (resource) => {
    return {
        description: `Get ${resource.resourceName} by ID`,
        tags: [resource.resourceName],
        params: {
            type: 'object',
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        },
        response: {
            200: {
                type: 'object',
            },
        },
    };
};
//# sourceMappingURL=restResource.js.map