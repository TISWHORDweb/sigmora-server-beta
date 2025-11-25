import express from 'express';
import { body } from 'express-validator';
import {
  createTrade,
  getActiveTrades,
  getCompletedTrades,
  getSubscriberActiveTrades,
  getSubscriberCompletedTrades,
  closeTrade,
  getTrade
} from '../controllers/trade.controller.js';
import { protect, creatorOnly, subscriberOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation rules
const tradeValidation = [
  body('asset').isMongoId().withMessage('Valid asset ID is required'),
  body('type').isIn(['BUY', 'SELL']).withMessage('Trade type must be BUY or SELL'),
  body('pip').isFloat().withMessage('PIP must be a number'),
  body('spread').isFloat({ min: 0 }).withMessage('Spread must be a positive number'),
  body('takeProfit').isFloat().withMessage('Take Profit must be a number'),
  body('stopLoss').isFloat().withMessage('Stop Loss must be a number'),
  body('packages').isArray({ min: 1 }).withMessage('At least one package is required'),
  body('packages.*').isMongoId().withMessage('Invalid package ID')
];

const closeTradeValidation = [
  body('closeReason').isIn(['TP', 'SL', 'Manual']).withMessage('Close reason must be TP, SL, or Manual')
];

// Routes
router.post('/', protect, creatorOnly, tradeValidation, createTrade);
router.get('/active', protect, creatorOnly, getActiveTrades);
router.get('/completed', protect, creatorOnly, getCompletedTrades);
router.get('/subscriber/active', protect, subscriberOnly, getSubscriberActiveTrades);
router.get('/subscriber/completed', protect, subscriberOnly, getSubscriberCompletedTrades);
router.put('/:id/close', protect, creatorOnly, closeTradeValidation, closeTrade);
router.get('/:id', protect, getTrade);

export default router;

