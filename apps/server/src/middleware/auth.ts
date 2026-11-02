import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { query } from '../db/index.js';

const SECRET_KEY = process.env.SECRET_KEY || 'dev-secret-key-super-secure-token-ss-journey-2026-production-grade';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateAccessToken(payload: { sub: string; role: string; email?: string }): string {
  const expiresInSeconds = (parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '1440', 10) || 1440) * 60;
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: expiresInSeconds,
  });
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    const userId = decoded.sub;

    const result = await query('SELECT id, email, role, full_name, phone, is_active FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated',
        timestamp: new Date().toISOString(),
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    const userId = decoded.sub;

    const result = await query('SELECT id, email, role, full_name, phone, is_active FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0 && result.rows[0].is_active) {
      req.user = result.rows[0];
    }
  } catch (e) {
    // Ignore invalid token for optional auth
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}
