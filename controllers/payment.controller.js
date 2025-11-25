import axios from 'axios';
import Subscription from '../models/Subscription.model.js';
import User from '../models/User.model.js';
import Package from '../models/Package.model.js';

// @desc    Initialize payment
// @route   POST /api/payments/initialize
// @access  Private/Subscriber
export const initializePayment = async (req, res) => {
  try {
    const { packageId } = req.body;

    // Get package
    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Get creator
    const creator = await User.findById(packageData.creator);
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Verify subscriber is subscribed to this creator
    if (req.user.subscribedTo?.toString() !== creator._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to subscribe to this package' });
    }

    // Initialize Flutterwave payment
    const paymentData = {
      tx_ref: `sigmora_${Date.now()}_${req.user._id}`,
      amount: packageData.price,
      currency: 'NGN', // Change to your preferred currency
      redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
      payment_options: 'card,account,ussd',
      customer: {
        email: req.user.email,
        name: req.user.name
      },
      customizations: {
        title: `Sigmora - ${packageData.name}`,
        description: packageData.description
      },
      meta: {
        subscriberId: req.user._id.toString(),
        packageId: packageId,
        creatorId: creator._id.toString()
      }
    };

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      paymentLink: response.data.data.link,
      tx_ref: paymentData.tx_ref
    });
  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Payment initialization failed',
      error: error.response?.data?.message || error.message 
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Public (Flutterwave webhook)
export const verifyPayment = async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.body;

    // Verify transaction with Flutterwave
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
      }
    );

    const transaction = response.data.data;

    // Check if transaction is successful
    if (transaction.status !== 'successful') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Extract metadata
    const { subscriberId, packageId, creatorId } = transaction.meta || {};

    if (!subscriberId || !packageId || !creatorId) {
      return res.status(400).json({ message: 'Invalid payment metadata' });
    }

    // Check if subscription already exists for this transaction
    const existingSubscription = await Subscription.findOne({
      paymentReference: transaction.tx_ref
    });

    if (existingSubscription) {
      return res.json({ 
        message: 'Payment already processed',
        subscription: existingSubscription 
      });
    }

    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Create subscription
    const subscription = await Subscription.create({
      subscriber: subscriberId,
      creator: creatorId,
      package: packageId,
      status: 'active',
      startDate: new Date(),
      expiryDate,
      paymentReference: transaction.tx_ref,
      amountPaid: transaction.amount
    });

    res.json({
      message: 'Payment verified and subscription activated',
      subscription
    });
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Payment verification failed',
      error: error.response?.data?.message || error.message 
    });
  }
};

// @desc    Payment callback (for redirect)
// @route   GET /api/payments/callback
// @access  Public
export const paymentCallback = async (req, res) => {
  try {
    const { status, tx_ref, transaction_id } = req.query;

    if (status === 'successful' && transaction_id) {
      // Verify the payment
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
          }
        }
      );

      const transaction = response.data.data;

      if (transaction.status === 'successful') {
        const { subscriberId, packageId, creatorId } = transaction.meta || {};

        if (subscriberId && packageId && creatorId) {
          // Check if subscription already exists
          const existingSubscription = await Subscription.findOne({
            paymentReference: transaction.tx_ref
          });

          if (!existingSubscription) {
            // Calculate expiry date (30 days from now)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            // Create subscription
            await Subscription.create({
              subscriber: subscriberId,
              creator: creatorId,
              package: packageId,
              status: 'active',
              startDate: new Date(),
              expiryDate,
              paymentReference: transaction.tx_ref,
              amountPaid: transaction.amount
            });
          }
        }
      }
    }

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/callback?status=${status}&tx_ref=${tx_ref}`);
  } catch (error) {
    console.error('Payment callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/callback?status=failed`);
  }
};

