import express from 'express';
import { body } from 'express-validator';
import {
  registerCreator,
  registerSubscriber,
  login,
  getMe
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
router.post('/login', registerValidation, login);
router.get('/me', protect, getMe);

export default router;

