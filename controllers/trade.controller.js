import Trade from '../models/Trade.model.js';
import Subscription from '../models/Subscription.model.js';
import { validationResult } from 'express-validator';
import { notifyTradeSubscribersAsync } from '../utils/notifications.js';

async function getSubscribedPackageIds(subscriberId, { activeOnly = false } = {}) {
  const query = { subscriber: subscriberId };
  if (activeOnly) {
    query.status = 'active';
    query.expiryDate = { $gt: new Date() };
  }
  const subscriptions = await Subscription.find(query);
  return [...new Set(subscriptions.map((s) => s.package.toString()))];
}

// @desc    Create trade
// @route   POST /api/trades
// @access  Private/Creator
export const createTrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { asset, type, pip, spread, takeProfit, stopLoss, packages } = req.body;

    const trade = await Trade.create({
      asset,
      type,
      pip,
      spread,
      takeProfit,
      stopLoss,
      packages,
      creator: req.user._id
    });

    const populatedTrade = await Trade.findById(trade._id)
      .populate('asset', 'symbol pipValue spread margin')
      .populate('packages', 'name price');

    notifyTradeSubscribersAsync(trade._id, 'created');

    res.status(201).json(populatedTrade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active trades for creator
// @route   GET /api/trades/active
// @access  Private/Creator
export const getActiveTrades = async (req, res) => {
  try {
    const trades = await Trade.find({
      creator: req.user._id,
      status: 'active'
    })
      .populate('asset', 'symbol pipValue spread margin')
      .populate('packages', 'name price')
      .sort({ createdAt: -1 });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get completed trades for creator
// @route   GET /api/trades/completed
// @access  Private/Creator
export const getCompletedTrades = async (req, res) => {
  try {
    const trades = await Trade.find({
      creator: req.user._id,
      status: 'closed'
    })
      .populate('asset', 'symbol pipValue spread margin')
      .populate('packages', 'name price')
      .sort({ closedAt: -1 });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active trades for subscriber
// @route   GET /api/trades/subscriber/active
// @access  Private/Subscriber
export const getSubscriberActiveTrades = async (req, res) => {
  try {
    if (!req.user.subscribedTo) {
      return res.json([]);
    }

    const packageIds = await getSubscribedPackageIds(req.user._id, { activeOnly: true });
    if (packageIds.length === 0) {
      return res.json([]);
    }

    const trades = await Trade.find({
      status: 'active',
      creator: req.user.subscribedTo,
      packages: { $in: packageIds },
    })
      .populate('asset', 'symbol pipValue spread margin')
      .populate('packages', 'name price')
      .populate('creator', 'creatorName')
      .sort({ createdAt: -1 });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get completed trades for subscriber
// @route   GET /api/trades/subscriber/completed
// @access  Private/Subscriber
export const getSubscriberCompletedTrades = async (req, res) => {
  try {
    if (!req.user.subscribedTo) {
      return res.json([]);
    }

    const packageIds = await getSubscribedPackageIds(req.user._id, { activeOnly: false });
    if (packageIds.length === 0) {
      return res.json([]);
    }

    const trades = await Trade.find({
      status: 'closed',
      creator: req.user.subscribedTo,
      packages: { $in: packageIds },
    })
      .populate('asset', 'symbol pipValue spread margin')
      .populate('packages', 'name price')
      .populate('creator', 'creatorName')
      .sort({ closedAt: -1 });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Close trade
// @route   PUT /api/trades/:id/close
// @access  Private/Creator
export const closeTrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { closeReason } = req.body;

    if (!['TP', 'SL', 'Manual'].includes(closeReason)) {
      return res.status(400).json({ message: 'Invalid close reason' });
    }

    const trade = await Trade.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    // Check if creator owns this trade
    if (trade.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if trade is already closed
    if (trade.status === 'closed') {
      return res.status(400).json({ message: 'Trade is already closed' });
    }

    trade.status = 'closed';
    trade.closeReason = closeReason;
    trade.closedAt = new Date();

    const updatedTrade = await trade.save();
    const populatedTrade = await Trade.findById(updatedTrade._id)
      .populate('asset', 'symbol pipValue spread margin')
      .populate('packages', 'name price');

    notifyTradeSubscribersAsync(updatedTrade._id, 'closed');

    res.json(populatedTrade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single trade
// @route   GET /api/trades/:id
// @access  Private
export const getTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('asset', 'symbol pipValue spread margin')
      .populate('packages', 'name price')
      .populate('creator', 'creatorName email');

    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json(trade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

