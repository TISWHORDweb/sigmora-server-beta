import jwt from 'jsonwebtoken';

// Generate JWT token with 5 hour expiration
export const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required but not set in environment variables. Please set it in your .env file.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '5h' // Token expires in 5 hours
  });
};

// Generate refresh token (longer expiration for refresh)
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d' // Refresh token expires in 7 days
  });
};

// Verify token and return decoded data
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

