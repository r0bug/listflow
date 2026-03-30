import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    locationId: string | null;
  };
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }

  if (!secret) {
    console.warn('WARNING: Using default JWT secret. Set JWT_SECRET in .env for security.');
    return 'dev-secret-change-in-production';
  }

  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  return secret;
};

const JWT_SECRET = getJwtSecret();

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};
