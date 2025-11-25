import Asset from '../models/Asset.model.js';
import { validationResult } from 'express-validator';

// @desc    Create asset
// @route   POST /api/assets
// @access  Private/Creator
export const createAsset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symbol, pipValue, spread, margin } = req.body;

    const asset = await Asset.create({
      symbol: symbol.toUpperCase(),
      pipValue,
      spread,
      margin,
      creator: req.user._id
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all assets for creator
// @route   GET /api/assets
// @access  Private/Creator
export const getCreatorAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ creator: req.user._id }).sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
export const getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private/Creator
export const updateAsset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if creator owns this asset
    if (asset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { symbol, pipValue, spread, margin } = req.body;

    asset.symbol = symbol ? symbol.toUpperCase() : asset.symbol;
    asset.pipValue = pipValue !== undefined ? pipValue : asset.pipValue;
    asset.spread = spread !== undefined ? spread : asset.spread;
    asset.margin = margin !== undefined ? margin : asset.margin;

    const updatedAsset = await asset.save();
    res.json(updatedAsset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private/Creator
export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if creator owns this asset
    if (asset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Asset.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

