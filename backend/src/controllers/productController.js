// backend/src/controllers/productController.js
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

const LOW_STOCK_THRESHOLD = 5;

function resolveBusinessId(req) {
  return req.businessId || req.user?.businessId || null;
}

// ============================================================================
// GET ALL PRODUCTS
// ============================================================================
async function getAllProducts(req, res) {
  const businessId = resolveBusinessId(req);
  if (!businessId) return res.status(400).json({ error: 'Business context required' });

  const products = await prisma.product.findMany({
    where:   { businessId },
    orderBy: { createdAt: 'desc' },
    include: {
      ratings: { select: { rating: true } },
      images:  { orderBy: { order: 'asc' } },
    },
  });

  const productsWithRatings = products.map(product => {
    const ratings      = product.ratings || [];
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;
    const { ratings: _, ...productData } = product;
    return { ...productData, averageRating: Math.round(averageRating * 10) / 10, totalRatings };
  });

  res.json({ products: productsWithRatings });
}

// ============================================================================
// GET PRODUCT BY ID
// ============================================================================
async function getProductById(req, res) {
  const businessId = resolveBusinessId(req);
  const product    = await prisma.product.findFirst({
    where: { id: Number(req.params.id), businessId },
    include: {
      ratings: { select: { rating: true, comment: true, createdAt: true, phone: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      images:  { orderBy: { order: 'asc' } },
    },
  });

  if (!product) throw new Error('Product not found');

  const ratings      = product.ratings || [];
  const totalRatings = ratings.length;
  const averageRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;

  const maskedRatings = ratings.map(r => ({
    ...r,
    phone: r.phone.slice(-4).padStart(r.phone.length, '*'),
  }));
  const { ratings: _, ...productData } = product;

  res.json({
    ...productData,
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings,
    recentRatings: maskedRatings,
  });
}

// ============================================================================
// CREATE PRODUCT
// ============================================================================
async function createProduct(req, res) {
  const { name, price, stock, description, imageUrl, images } = req.body;

  if (!name || !price || stock === undefined) throw new Error('Name, price, and stock are required');

  let businessId = req.body.businessId ? Number(req.body.businessId) : resolveBusinessId(req);
  if (!businessId) throw new Error('Business ID is required');

  const product = await prisma.product.create({
    data: {
      name:        name.trim(),
      price:       Number(price),
      stock:       Number(stock),
      description: description?.trim() || '',
      imageUrl:    imageUrl?.trim()    || '',
      businessId,
      images: images && images.length > 0 ? {
        create: images.map((img, index) => ({
          imageUrl:  img.imageUrl,
          order:     img.order !== undefined ? img.order : index,
          isPrimary: img.isPrimary || index === 0,
        })),
      } : undefined,
    },
    include: { images: true },
  });

  // Warn immediately if created with low stock
  if (Number(stock) <= LOW_STOCK_THRESHOLD && Number(stock) > 0) {
    await notify.lowStock(businessId, product.id, product.name, Number(stock));
  }

  res.status(201).json(product);
}

// ============================================================================
// UPDATE PRODUCT
// ============================================================================
async function updateProduct(req, res) {
  const { images, ...updateData } = req.body;
  const productId = Number(req.params.id);

  const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
  if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && existingProduct.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'You cannot manage products from another business' });
  }

  const newStock = updateData.stock !== undefined ? Number(updateData.stock) : existingProduct.stock;

  await prisma.product.update({
    where: { id: productId },
    data: {
      name:        updateData.name,
      price:       Number(updateData.price),
      stock:       newStock,
      description: updateData.description || '',
      imageUrl:    updateData.imageUrl    || '',
    },
  });

  if (images !== undefined && Array.isArray(images)) {
    await prisma.productImage.deleteMany({ where: { productId } });
    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map((img, index) => ({
          productId,
          imageUrl:  img.imageUrl,
          order:     img.order !== undefined ? img.order : index,
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
        })),
      });
    }
  }

  const updatedProduct = await prisma.product.findUnique({
    where:   { id: productId },
    include: { images: { orderBy: { order: 'asc' } } },
  });

  // Low stock warning if stock dropped below threshold
  const previousStock = existingProduct.stock;
  if (newStock <= LOW_STOCK_THRESHOLD && newStock > 0 && (previousStock > LOW_STOCK_THRESHOLD || previousStock === newStock)) {
    await notify.lowStock(existingProduct.businessId, productId, updatedProduct.name, newStock);
  }

  res.json(updatedProduct);
}

// ============================================================================
// DELETE PRODUCT
// ============================================================================
async function deleteProduct(req, res) {
  const productId = Number(req.params.id);

  const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
  if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && existingProduct.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'You cannot manage products from another business' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productRating.deleteMany({ where: { productId } });
    await tx.orderItem.deleteMany({ where: { productId } });
    await tx.product.delete({ where: { id: productId } });
  });

  console.log(`🗑️ Deleted product ${productId} and its related records`);
  res.json({ ok: true, message: 'Product deleted' });
}

// ============================================================================
// TOGGLE AVAILABILITY
// ============================================================================
async function toggleAvailability(req, res) {
  const productId = Number(req.params.id);

  const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
  if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && existingProduct.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'You cannot manage products from another business' });
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data:  { isAvailable: !existingProduct.isAvailable },
  });

  console.log(`👁️ Product ${productId} availability set to ${updated.isAvailable}`);
  res.json({ ok: true, isAvailable: updated.isAvailable, product: updated });
}

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================
async function addProductImage(req, res) {
  const { productId } = req.params;
  const { imageUrl, isPrimary } = req.body;

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && product.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const maxOrder = await prisma.productImage.findFirst({
    where:   { productId: Number(productId) },
    orderBy: { order: 'desc' },
    select:  { order: true },
  });

  const image = await prisma.productImage.create({
    data: { productId: Number(productId), imageUrl, order: (maxOrder?.order ?? 0) + 1, isPrimary: isPrimary || false },
  });

  res.json(image);
}

async function deleteProductImage(req, res) {
  const { imageId } = req.params;

  const image = await prisma.productImage.findUnique({
    where:   { id: Number(imageId) },
    include: { product: true },
  });
  if (!image) return res.status(404).json({ error: 'Image not found' });

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && image.product.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await prisma.productImage.delete({ where: { id: Number(imageId) } });
  res.json({ ok: true, message: 'Image deleted' });
}

async function reorderProductImages(req, res) {
  const { productId } = req.params;
  const { imageOrders } = req.body;

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && product.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'Access denied' });
  }

  for (const { id, order } of imageOrders) {
    await prisma.productImage.update({ where: { id }, data: { order } });
  }

  const images = await prisma.productImage.findMany({
    where:   { productId: Number(productId) },
    orderBy: { order: 'asc' },
  });

  res.json(images);
}

module.exports = {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  toggleAvailability, addProductImage, deleteProductImage, reorderProductImages,
};