import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';
import { verifyToken } from '../utils/generateToken.js';

// Enhanced authentication middleware with session and token validation
export const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        message: 'Not authorized, no token provided',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token signature and expiration
      const decoded = verifyToken(token);

      // Check if session exists and is active
      const session = await Session.findOne({ 
        token, 
        user: decoded.id,
        isActive: true 
      });

      if (!session) {
        return res.status(401).json({ 
          message: 'Session not found or inactive',
          code: 'INVALID_SESSION'
        });
      }

      // Check if session is expired
      if (session.isExpired()) {
        // Mark session as inactive
        session.isActive = false;
        await session.save();
        
        return res.status(401).json({ 
          message: 'Session expired. Please login again',
          code: 'SESSION_EXPIRED'
        });
      }

      // Update last activity
      session.lastActivity = new Date();
      await session.save();

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Attach user and session to request
      req.user = user;
      req.session = session;
      
      next();
    } catch (error) {
      // Handle specific JWT errors
      if (error.message === 'Token expired') {
        return res.status(401).json({ 
          message: 'Token expired. Please login again',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.message === 'Invalid token') {
        return res.status(401).json({ 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        message: 'Not authorized, token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication',
      code: 'SERVER_ERROR'
    });
  }
};

// Role-based middleware
export const creatorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'creator') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Creator role required.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
};

export const subscriberOnly = (req, res, next) => {
  if (req.user && req.user.role === 'subscriber') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Subscriber role required.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
};

