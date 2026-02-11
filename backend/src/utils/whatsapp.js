// backend/src/utils/whatsapp.js
function formatOrderMessage(order) {
  const items = order.items
    .map(item => `${item.product.name} x${item.quantity} - ₦${(item.unitPrice * item.quantity).toLocaleString()}`)
    .join('\n');

  return `
🛒 *New Order #${order.id}*

*Customer Details:*
Name: ${order.customerName}
Phone: ${order.phone}
${order.email ? `Email: ${order.email}` : ''}
${order.address ? `Address: ${order.address}` : ''}
${order.message ? `Message: ${order.message}` : ''}

*Items:*
${items}

*Total: ₦${order.totalAmount.toLocaleString()}*

Order Date: ${new Date(order.createdAt).toLocaleString()}
  `.trim();
}

module.exports = { formatOrderMessage };