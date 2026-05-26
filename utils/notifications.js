import Notification from '../models/Notification.model.js';
import Subscription from '../models/Subscription.model.js';
import Trade from '../models/Trade.model.js';

export async function createNotification({ recipient, type, title, message, meta = {}, link = null }) {
  return Notification.create({
    recipient,
    type,
    title,
    message,
    meta,
    link,
  });
}

export async function createNotificationsBulk(items) {
  if (!items.length) return [];
  return Notification.insertMany(items);
}

/** Notify subscribers with active package access when a trade is created or closed */
export async function notifySubscribersForTrade(tradeId, event) {
  const trade = await Trade.findById(tradeId)
    .populate('asset', 'symbol')
    .populate('packages', 'name');

  if (!trade) return;

  const packageIds = trade.packages.map((p) => p._id || p);
  const now = new Date();

  const subscriberIds = await Subscription.find({
    package: { $in: packageIds },
    status: 'active',
    expiryDate: { $gt: now },
  }).distinct('subscriber');

  if (!subscriberIds.length) return;

  const symbol = trade.asset?.symbol || 'Asset';
  const pkgLabel =
    trade.packages?.map((p) => p.name).filter(Boolean).join(', ') || 'your package';

  let title;
  let message;
  let type;
  let link;

  if (event === 'created') {
    type = 'trade_created';
    title = `New ${trade.type} signal`;
    message = `${symbol} — ${trade.type} signal for ${pkgLabel}`;
    link = '/subscriber/trades/active';
  } else {
    type = 'trade_closed';
    title = `Trade closed (${trade.closeReason || 'Closed'})`;
    message = `${symbol} was closed as ${trade.closeReason || 'Closed'}`;
    link = '/subscriber/trades/completed';
  }

  await createNotificationsBulk(
    subscriberIds.map((recipient) => ({
      recipient,
      type,
      title,
      message,
      meta: {
        tradeId: trade._id,
        closeReason: trade.closeReason,
        tradeType: trade.type,
        symbol,
      },
      link,
    }))
  );
}

export function notifyCreatorAsync(payload) {
  createNotification(payload).catch((err) => {
    console.error('Failed to create creator notification:', err.message);
  });
}

export function notifyTradeSubscribersAsync(tradeId, event) {
  notifySubscribersForTrade(tradeId, event).catch((err) => {
    console.error('Failed to notify subscribers for trade:', err.message);
  });
}
