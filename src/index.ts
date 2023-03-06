import JuadzFastify from './JuadzFastify';
import useCors from './plugins/cors';
import useSwagger from './plugins/swagger';
import useRestResource from './plugins/restResource';

export default JuadzFastify;

export {useCors};
export {useSwagger};
export {useRestResource};

export * from './types';
