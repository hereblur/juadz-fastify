import JuadzFastify from './JuadzFastify';
import useBearer from './plugins/bearer';
import useCors from './plugins/cors';
import useSwagger from './plugins/swagger';
import useRestResource from './plugins/restResource';
import useLogin from './plugins/login';

export default JuadzFastify;

export {useBearer};
export {useCors};
export {useLogin};
export {useSwagger};
export {useRestResource};

export * from './types';