import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { store } from '../services/storage.js';

export interface AuthenticatedUser {
  userId: string;
  farmerId: string;
  mobile: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For local dev and demo convenience, fallback to demo farmer if none passed
    const demoProfile = Array.from(store.profiles.values())[0];
    if (demoProfile) {
      req.user = {
        userId: demoProfile.userId,
        farmerId: demoProfile.id,
        mobile: demoProfile.mobile,
        role: 'FARMER'
      };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};
