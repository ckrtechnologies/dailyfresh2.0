import { errorResponse } from '../utils/response.js';

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.stack}`);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode, err);
};

export default errorHandler;
