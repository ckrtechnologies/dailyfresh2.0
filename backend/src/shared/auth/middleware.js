import jwt from 'jsonwebtoken';
import * as authRepo from './repository.js';
import { errorResponse } from '../../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dailyfresh_jwt_secret_key_2026_super_secure_isolated';

/**
 * Primary Authentication Middleware
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authorization token missing or malformed', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await authRepo.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, 'User account not found', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    let storeId = null;
    if (user.role === 'store_manager') {
      const store = await authRepo.findStoreByManagerUserId(user.id);
      if (store) storeId = store.id;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      storeId
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) Guard
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 'Unauthorized: Identity not verified', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]`, 403);
    }

    next();
  };
};
