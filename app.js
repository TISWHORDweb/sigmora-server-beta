import express from 'express';
import cors from 'cors';
import connectDB from './lib/mongodb.js';
import { corsOptions, isAllowedOrigin } from './lib/cors.js';

import authRoutes from './routes/auth.routes.js';
import packageRoutes from './routes/package.routes.js';
import assetRoutes from './routes/asset.routes.js';
import tradeRoutes from './routes/trade.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import academyRoutes from './routes/academy.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

const API_ROOTS = new Set([
  'auth', 'packages', 'assets', 'trades', 'subscriptions',
  'payments', 'academy', 'notifications', 'health',
]);

// Vercel rewrite to /api may strip the prefix from req.url
app.use((req, res, next) => {
  const [pathOnly, query = ''] = (req.url || '').split('?');
  const segment = pathOnly.split('/').filter(Boolean)[0];
  if (segment && API_ROOTS.has(segment) && !pathOnly.startsWith('/api')) {
    req.url = `/api${pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`}${query ? `?${query}` : ''}`;
  }
  next();
});

app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure MongoDB is connected (skip OPTIONS preflight — must not block CORS)
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sigmora API is running' });
});

app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
