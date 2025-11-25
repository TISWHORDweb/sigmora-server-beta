import express from 'express';
import { body } from 'express-validator';
import {
  createAsset,
  getCreatorAssets,
  getAsset,
  updateAsset,
  deleteAsset
} from '../controllers/asset.controller.js';
import { protect, creatorOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation rules
const assetValidation = [
  body('symbol').trim().notEmpty().withMessage('Symbol is required'),
  body('pipValue').isFloat({ min: 0 }).withMessage('PIP value must be a positive number'),
  body('spread').isFloat({ min: 0 }).withMessage('Spread must be a positive number'),
  body('margin').isFloat({ min: 0 }).withMessage('Margin must be a positive number')
];

// Routes
router.post('/', protect, creatorOnly, assetValidation, createAsset);
router.get('/', protect, creatorOnly, getCreatorAssets);
router.get('/:id', protect, getAsset);
router.put('/:id', protect, creatorOnly, assetValidation, updateAsset);
router.delete('/:id', protect, creatorOnly, deleteAsset);

export default router;

