import Subscription from '../models/Subscription.model.js';
import User from '../models/User.model.js';

// @desc    Get subscriber's subscriptions
// @route   GET /api/subscriptions
// @access  Private/Subscriber
export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      subscriber: req.user._id
    })
      .populate('package', 'name description price features')
      .populate('creator', 'creatorName email')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subscription status
// @route   GET /api/subscriptions/status
// @access  Private/Subscriber
export const getSubscriptionStatus = async (req, res) => {
  try {
    const activeSubscriptions = await Subscription.find({
      subscriber: req.user._id,
      status: 'active'
    });

    const hasActiveSubscription = activeSubscriptions.length > 0;
    const nearestExpiry = activeSubscriptions.length > 0
      ? Math.min(...activeSubscriptions.map(sub => new Date(sub.expiryDate).getTime()))
      : null;

    res.json({
      hasActiveSubscription,
      activeCount: activeSubscriptions.length,
      nearestExpiry: nearestExpiry ? new Date(nearestExpiry) : null,
      subscriptions: activeSubscriptions.map(sub => ({
        package: sub.package,
        expiryDate: sub.expiryDate,
        status: sub.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all subscriptions for creator (analytics)
// @route   GET /api/subscriptions/creator
// @access  Private/Creator
export const getCreatorSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      creator: req.user._id
    })
      .populate('subscriber', 'name email')
      .populate('package', 'name price')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

