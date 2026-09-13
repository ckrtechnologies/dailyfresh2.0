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
  
  let displayMessage = message;
  if (typeof displayMessage === 'string' && displayMessage.startsWith('Failed query:')) {
    displayMessage = causeMsg ? `Database error: ${causeMsg}` : 'Database connection or query failed';
  } else if (causeMsg) {
    displayMessage = `${displayMessage}: ${causeMsg}`;
  }

  return res.status(statusCode).json({
    success: false,
    message: displayMessage,
    error: causeMsg || (error ? (error.message || error) : null),
  });
};
