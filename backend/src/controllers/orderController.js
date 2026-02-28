// backend/src/controllers/orderController.js
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

const LOW_STOCK_THRESHOLD = 5;

function resolveBusinessId(req) {
  return req.businessId || req.user?.businessId || null;
}

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

function formatAmount(amount, currency = 'NGN') {
  return `${currency} ${Number(amount).toLocaleString()}`;
}

// ============================================================================
// CHECKOUT (Public)
// ============================================================================
async function checkout(req, res) {
  const { customerName, phone, address, email, message, items } = req.body;

  if (!customerName || !phone || !items || items.length === 0) {
    throw new Error('Missing required fields');
  }

  const businessId = req.businessId;
  if (!businessId) {
    throw new Error('Business context required. Please access via proper subdomain.');
  }

  const normalizedPhone = normalizePhone(phone);
  const productIds      = items.map(item => item.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId },
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  let totalAmount = 0;
  const orderItems    = [];
  const productUpdates = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product)                       throw new Error(`Product ${item.productId} not found or not available`);
    if (product.stock < item.quantity)  throw new Error(`Insufficient stock for ${product.name}`);

    totalAmount += product.price * item.quantity;
    orderItems.push({ productId: product.id, quantity: item.quantity, unitPrice: product.price });
    productUpdates.push({ id: product.id, quantity: item.quantity, newStock: product.stock - item.quantity, name: product.name });
  }

  const statusHistory = JSON.stringify([{
    status: 'PENDING', timestamp: new Date().toISOString(), notes: 'Order created',
  }]);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        customerName,
        phone:         normalizedPhone,
        address:       address || '',
        email:         email   || '',
        message:       message || '',
        totalAmount,
        currency:      'NGN',
        paymentStatus: 'PENDING',
        status:        'PENDING',
        statusHistory,
        businessId,
        items: { create: orderItems },
      },
    });

    await Promise.all(
      productUpdates.map(({ id, quantity }) =>
        tx.product.update({ where: { id }, data: { stock: { decrement: quantity } } })
      )
    );

    return newOrder;
  }, { maxWait: 10000, timeout: 15000 });

  const completeOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: { include: { product: true } } },
  });

  // New order notification
  await notify.order(businessId, order.id, customerName, formatAmount(totalAmount));

  // Low stock warnings for products that dropped below threshold
  for (const { id, name, newStock, businessId: bId } of productUpdates) {
    if (newStock <= LOW_STOCK_THRESHOLD && newStock > 0) {
      await notify.lowStock(businessId, id, name, newStock);
    }
  }

  console.log(`✅ Order created: ${completeOrder.id} for business ${businessId}`);

  res.status(201).json({
    success: true,
    order: { ...completeOrder, statusHistory: JSON.parse(completeOrder.statusHistory || '[]') },
  });
}

// ============================================================================
// CONFIRM PAYMENT
// ============================================================================
async function confirmPayment(req, res) {
  const { paymentMethod } = req.body;

  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) throw new Error('Order not found');

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && order.businessId !== resolvedBiz) {
    return res.status(403).json({ success: false, error: 'You cannot manage orders from another business' });
  }

  const history = order.statusHistory ? JSON.parse(order.statusHistory) : [];
  history.push({
    status: 'CONFIRMED',
    timestamp: new Date().toISOString(),
    notes: `Payment confirmed via ${paymentMethod || 'CASH'}`,
  });

  const updatedOrder = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: {
      paymentStatus:      'CONFIRMED',
      paymentMethod:      paymentMethod || 'CASH',
      paymentConfirmedAt: new Date(),
      paymentConfirmedBy: req.user.id,
      status:             'CONFIRMED',
      statusHistory:      JSON.stringify(history),
    },
    include: { items: { include: { product: true } } },
  });

  await notify.payment(
    order.businessId,
    order.id,
    order.customerName,
    formatAmount(order.totalAmount, order.currency)
  );

  console.log('💰 Payment confirmed for order:', updatedOrder.id);

  res.json({
    success: true,
    order: { ...updatedOrder, statusHistory: JSON.parse(updatedOrder.statusHistory) },
  });
}

// ============================================================================
// UPDATE ORDER STATUS
// ============================================================================
async function updateOrderStatus(req, res) {
  const { status, notes } = req.body;

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) throw new Error('Order not found');

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && order.businessId !== resolvedBiz) {
    return res.status(403).json({ success: false, error: 'You cannot manage orders from another business' });
  }

  const history = order.statusHistory ? JSON.parse(order.statusHistory) : [];
  history.push({ status, timestamp: new Date().toISOString(), notes: notes || `Status updated to ${status}` });

  const updatedOrder = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { status, statusHistory: JSON.stringify(history) },
    include: { items: { include: { product: true } } },
  });

  // Notify on meaningful status changes
  if (['DELIVERED', 'CANCELLED', 'OUT_FOR_DELIVERY'].includes(status)) {
    await notify.orderStatus(order.businessId, order.id, status, order.customerName);
  }

  console.log(`📦 Order ${updatedOrder.id} status updated to:`, status);

  res.json({
    success: true,
    order: { ...updatedOrder, statusHistory: JSON.parse(updatedOrder.statusHistory) },
  });
}

// ============================================================================
// GET ALL ORDERS
// ============================================================================
async function getAllOrders(req, res) {
  const { page = 1, limit = 50, status, paymentStatus, search } = req.query;
  const where = {};

  if (req.user.role === 'super-admin') {
    const subdomainBiz = req.businessId;
    if (subdomainBiz) where.businessId = subdomainBiz;
  } else {
    where.businessId = req.user.businessId;
  }

  if (status)        where.status        = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { phone:        { contains: normalizePhone(search) } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip:     (page - 1) * limit,
      take:     Number(limit),
      orderBy:  { createdAt: 'desc' },
      include:  { items: { include: { product: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    orders: orders.map(o => ({ ...o, statusHistory: o.statusHistory ? JSON.parse(o.statusHistory) : [] })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  });
}

// ============================================================================
// GET ORDER BY ID
// ============================================================================
async function getOrderById(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: { include: { product: true } } },
  });

  if (!order) throw new Error('Order not found');

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && order.businessId !== resolvedBiz) {
    return res.status(403).json({ success: false, error: 'You cannot view orders from another business' });
  }

  res.json({
    success: true,
    order: { ...order, statusHistory: order.statusHistory ? JSON.parse(order.statusHistory) : [] },
  });
}

// ============================================================================
// TRACK ORDER (Public)
// ============================================================================
async function trackOrder(req, res) {
  const { orderId } = req.params;
  const { phone }   = req.query;

  if (!phone) throw new Error('Phone number required');

  const where = { id: Number(orderId), phone: normalizePhone(phone) };
  if (req.businessId) where.businessId = req.businessId;

  const order = await prisma.order.findFirst({
    where,
    include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
  });

  if (!order) throw new Error('Order not found');

  res.json({
    success: true,
    order: { ...order, statusHistory: order.statusHistory ? JSON.parse(order.statusHistory) : [] },
  });
}

// ============================================================================
// DELETE ORDER
// ============================================================================
async function deleteOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: true },
  });

  if (!order) throw new Error('Order not found');

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && order.businessId !== resolvedBiz) {
    return res.status(403).json({ success: false, error: 'You cannot delete orders from another business' });
  }

  if (order.paymentStatus === 'PENDING') {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data:  { stock: { increment: item.quantity } },
      });
    }
  }

  await prisma.order.delete({ where: { id: Number(req.params.id) } });

  console.log('🗑️ Order deleted:', req.params.id);
  res.json({ success: true, message: 'Order deleted' });
}

module.exports = { checkout, getAllOrders, getOrderById, confirmPayment, updateOrderStatus, trackOrder, deleteOrder };