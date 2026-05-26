import Subscription from '../models/Subscription.model.js';
import Package from '../models/Package.model.js';
import User from '../models/User.model.js';
import { notifyCreatorAsync } from '../utils/notifications.js';

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

// @desc    Subscribe to a package (mock payment — no live gateway for now)
// @route   POST /api/subscriptions/subscribe
// @access  Private/Subscriber
export const subscribeToPackage = async (req, res) => {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      return res.status(400).json({ message: 'Package ID is required' });
    }

    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (!req.user.subscribedTo || packageData.creator.toString() !== req.user.subscribedTo.toString()) {
      return res.status(403).json({ message: 'Not authorized to subscribe to this package' });
    }

    const now = new Date();
    const existing = await Subscription.findOne({
      subscriber: req.user._id,
      package: packageId,
      status: 'active',
      expiryDate: { $gt: now },
    });

    if (existing) {
      const populated = await Subscription.findById(existing._id)
        .populate('package', 'name description price features')
        .populate('creator', 'creatorName email');
      return res.json({
        message: 'You are already subscribed to this package',
        subscription: populated,
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Live Flutterwave payment disabled — record subscription as paid on confirm
    const paymentReference = `mock_${Date.now()}_${req.user._id}`;

    const subscription = await Subscription.create({
      subscriber: req.user._id,
      creator: packageData.creator,
      package: packageId,
      status: 'active',
      startDate: now,
      expiryDate,
      paymentReference,
      amountPaid: packageData.price,
    });

    const populated = await Subscription.findById(subscription._id)
      .populate('package', 'name description price features')
      .populate('creator', 'creatorName email');

    notifyCreatorAsync({
      recipient: packageData.creator,
      type: 'package_subscribed',
      title: 'New package subscription',
      message: `${req.user.name} subscribed to ${packageData.name}`,
      meta: {
        subscriberId: req.user._id,
        packageId: packageData._id,
        subscriptionId: subscription._id,
      },
      link: '/creator/subscribers',
    });

    res.status(201).json({
      message: 'Subscription activated',
      subscription: populated,
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

