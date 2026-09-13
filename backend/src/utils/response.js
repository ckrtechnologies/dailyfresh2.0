/**
 * Standard success response
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard error response
 */
export const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  const causeMsg = error?.cause?.message || error?.cause?.detail;
  const detailedMessage = causeMsg ? `${message}: ${causeMsg}` : message;

  return res.status(statusCode).json({
    success: false,
    message: detailedMessage,
    error: causeMsg || (error ? (error.message || error) : null),
  });
};
