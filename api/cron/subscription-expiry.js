import '../../config/env.js';
import connectDB from '../../lib/mongodb.js';
import { checkSubscriptionExpiry } from '../../jobs/subscriptionExpiry.job.js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await connectDB();
    await checkSubscriptionExpiry();
    res.json({ ok: true });
  } catch (error) {
    console.error('Cron subscription-expiry error:', error);
    res.status(500).json({ message: error.message });
  }
}
