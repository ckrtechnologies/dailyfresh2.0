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
  // If message itself is an Error object, normalize it
  if (message instanceof Error) {
    error = message;
    message = error.message || 'An unexpected error occurred';
  }

  // Extract cause or nested pg error
  const pgCause = error?.cause || error;
  const pgCode = pgCause?.code || error?.code;
  const pgDetail = pgCause?.detail || error?.detail;
  const pgTable = pgCause?.table || error?.table;
  const pgConstraint = pgCause?.constraint || error?.constraint;
  const causeMsg = pgDetail || pgCause?.message || error?.cause?.message;

  let displayMessage = typeof message === 'string' ? message : (message?.message || 'Error occurred');
  let finalStatus = statusCode;

  // Handle PostgreSQL foreign key violation (23503)
  if (pgCode === '23503' || displayMessage.includes('violates foreign key constraint') || (causeMsg && causeMsg.includes('is still referenced from table'))) {
    finalStatus = finalStatus === 500 ? 400 : finalStatus;
    const refTable = pgTable ? `in "${pgTable}"` : 'in related data';
    displayMessage = `Cannot delete or modify this record because related items still exist ${refTable}. ${pgDetail || 'Please remove or reassign dependent items first, or deactivate it instead.'}`;
  } else if (pgCode === '23505' || displayMessage.includes('duplicate key value')) {
    finalStatus = finalStatus === 500 ? 400 : finalStatus;
    displayMessage = `Duplicate entry: A record with this information already exists. ${pgDetail || ''}`.trim();
  } else if (pgCode === '23502') {
    finalStatus = finalStatus === 500 ? 400 : finalStatus;
    displayMessage = `Required field missing: ${pgCause?.column || 'Please fill in all required fields.'}`;
  } else if (displayMessage.startsWith('Failed query:')) {
    if (causeMsg) {
      displayMessage = `Database query failed: ${causeMsg}`;
    } else {
      displayMessage = displayMessage.replace(/^Failed query:\s*/, '');
    }
  } else if (causeMsg && !displayMessage.includes(causeMsg)) {
    displayMessage = `${displayMessage}: ${causeMsg}`;
  }

  return res.status(finalStatus).json({
    success: false,
    message: displayMessage,
    error: causeMsg || (error ? (error.message || String(error)) : null),
    code: pgCode || undefined,
  });
};
