import express from 'express';
import { body } from 'express-validator';
import {
  registerCreator,
  registerSubscriber,
  forgotPassword,
  resetPassword,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  logoutAll,
  refreshToken
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const creatorValidation = [
  ...registerValidation,
  body('name').trim().notEmpty().withMessage('Name is required')
];

const subscriberValidation = [
  ...registerValidation,
  body('academyCode').trim().notEmpty().withMessage('Academy code is required')
];

// Routes
router.post('/register/creator', creatorValidation, registerCreator);
router.post('/register/subscriber', subscriberValidation, registerSubscriber);
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  forgotPassword
);
router.post(
  '/reset-password',
  [
    body('token').trim().notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  resetPassword
);
router.post('/login', registerValidation, login);
router.get('/me', protect, getMe);
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('creatorName').optional().trim().notEmpty().withMessage('Creator name cannot be empty'),
  ],
  updateProfile
);
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  changePassword
);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.post('/refresh', protect, refreshToken);

export default router;

