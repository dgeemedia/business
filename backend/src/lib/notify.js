// backend/src/lib/notify.js
// Usage in any controller:
//   const notify = require('../lib/notify');
//   await notify.order(businessId, orderId, customerName, total);
//   await notify.subscription(businessId, planName, expiresAt);
//   await notify.userCreated(businessId, email, role);
//   await notify.custom({ type, title, message, businessId });

const { createNotification } = require('../controllers/notificationController');

const notify = {
  // New order placed
  order: (businessId, orderId, customerName, total) =>
    createNotification({
      type:       'order',
      title:      'New Order Received',
      message:    `${customerName} placed an order worth ${total}.`,
      link:       `/dashboard/orders`,
      orderId,
      businessId,
    }),

  // Order status changed
  orderStatus: (businessId, orderId, status, customerName) =>
    createNotification({
      type:       'order',
      title:      `Order ${status}`,
      message:    `Order from ${customerName} has been marked as ${status}.`,
      link:       `/dashboard/orders`,
      orderId,
      businessId,
    }),

  // Payment confirmed
  payment: (businessId, orderId, customerName, amount) =>
    createNotification({
      type:       'order',
      title:      'Payment Confirmed',
      message:    `Payment of ${amount} from ${customerName} has been confirmed.`,
      link:       `/dashboard/orders`,
      orderId,
      businessId,
    }),

  // Subscription updated by super-admin
  subscription: (businessId, plan, expiresAt) =>
    createNotification({
      type:       'subscription',
      title:      'Subscription Updated',
      message:    `Your subscription plan is now "${plan}". ${expiresAt ? `Expires on ${new Date(expiresAt).toDateString()}.` : ''}`,
      link:       `/dashboard/subscription`,
      businessId,
    }),

  // Trial started
  trialStarted: (businessId, trialEndsAt) =>
    createNotification({
      type:       'subscription',
      title:      '🎁 Free Trial Started',
      message:    `Your 14-day free trial has started and runs until ${new Date(trialEndsAt).toDateString()}.`,
      link:       `/dashboard/subscription`,
      businessId,
    }),

  // Subscription expiring soon (called by cron)
  subscriptionExpiringSoon: (businessId, daysLeft) =>
    createNotification({
      type:       'alert',
      title:      '⚠️ Subscription Expiring Soon',
      message:    `Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to avoid interruption.`,
      link:       `/dashboard/subscription`,
      businessId,
    }),

  // Business suspended
  businessSuspended: (businessId, reason) =>
    createNotification({
      type:       'alert',
      title:      'Business Suspended',
      message:    `Your business has been suspended. Reason: ${reason || 'Subscription expired'}. Contact support to reactivate.`,
      businessId,
    }),

  // New user/staff added
  userCreated: (businessId, email, role) =>
    createNotification({
      type:       'user',
      title:      'New Team Member Added',
      message:    `${email} has been added as ${role}.`,
      link:       `/dashboard/users`,
      businessId,
    }),

  // Low stock alert
  lowStock: (businessId, productId, productName, stock) =>
    createNotification({
      type:       'product',
      title:      '📦 Low Stock Alert',
      message:    `${productName} is running low — only ${stock} left in stock.`,
      link:       `/dashboard/products`,
      productId,
      businessId,
    }),

  // New review
  review: (businessId, productName, rating) =>
    createNotification({
      type:       'review',
      title:      'New Review Received',
      message:    `Someone left a ${rating}★ review on ${productName}.`,
      link:       `/dashboard/reviews`,
      businessId,
    }),

  // Welcome / system message
  system: (businessId, title, message) =>
    createNotification({ type: 'system', title, message, businessId }),

  // Generic escape hatch
  custom: (opts) => createNotification(opts),
};

module.exports = notify;