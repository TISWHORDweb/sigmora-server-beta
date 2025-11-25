import express from 'express';
import { body } from 'express-validator';
import {
  initializePayment,
  verifyPayment,
  paymentCallback
} from '../controllers/payment.controller.js';
import { protect, subscriberOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation rules
const paymentValidation = [
  body('packageId').isMongoId().withMessage('Valid package ID is required')
];

// Routes
router.post('/initialize', protect, subscriberOnly, paymentValidation, initializePayment);
router.post('/verify', verifyPayment);
router.get('/callback', paymentCallback);

export default router;

