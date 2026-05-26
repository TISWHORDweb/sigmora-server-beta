// Local development entry — Vercel uses api/[[...path]].js instead
import './config/env.js';

import connectDB from './lib/mongodb.js';
import app from './app.js';
import cron from 'node-cron';
import { checkSubscriptionExpiry } from './jobs/subscriptionExpiry.job.js';

const start = async () => {
  await connectDB();
  console.log('Connected to MongoDB');

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  cron.schedule('0 0 * * *', () => {
    console.log('Running subscription expiry check...');
    checkSubscriptionExpiry();
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
