import Subscription from '../models/Subscription.model.js';

export const checkSubscriptionExpiry = async () => {
  try {
    const now = new Date();
    const expiredSubscriptions = await Subscription.updateMany(
      {
        status: 'active',
        expiryDate: { $lt: now }
      },
      {
        $set: { status: 'expired' }
      }
    );

    console.log(`Updated ${expiredSubscriptions.modifiedCount} expired subscriptions`);
    return expiredSubscriptions;
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    throw error;
  }
};

