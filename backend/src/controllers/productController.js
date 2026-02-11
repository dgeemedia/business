// backend/src/controllers/productController.js
const prisma = require('../lib/prisma');

/**
 * Resolve businessId with the same priority used everywhere else:
 *   1. req.businessId        – subdomain middleware (most reliable)
 *   2. req.user?.businessId  – logged-in user's own business
 */
function resolveBusinessId(req) {
  return req.businessId || req.user?.businessId || null;
}

// ============================================================================
// GET ALL PRODUCTS - WITH TENANT ISOLATION
// ============================================================================
async function getAllProducts(req, res) {
  const businessId = resolveBusinessId(req);

  if (!businessId) {
    return res.status(400).json({ error: 'Business context required' });
  }

  const products = await prisma.product.findMany({
    where: { businessId },                          // 🔥 TENANT FILTER
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
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    const { ratings: _, ...productData } = product;

    return {
      ...productData,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
    };
  });

  console.log(`📦 Fetched ${productsWithRatings.length} products for business ${businessId}`);
  res.json(productsWithRatings);
}

// ============================================================================
// GET PRODUCT BY ID - WITH TENANT SECURITY
// ============================================================================
async function getProductById(req, res) {
  const businessId = resolveBusinessId(req);

  const product = await prisma.product.findFirst({
    where: {
      id: Number(req.params.id),
      businessId,                                   // 🔥 TENANT FILTER
    },
    include: {
      ratings: {
        select:  { rating: true, comment: true, createdAt: true, phone: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      images: { orderBy: { order: 'asc' } },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const ratings      = product.ratings || [];
  const totalRatings = ratings.length;
  const averageRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    : 0;

  const maskedRatings = ratings.map(r => ({
    ...r,
    phone: r.phone.slice(-4).padStart(r.phone.length, '*'),
  }));

  const { ratings: _, ...productData } = product;

  console.log(`📦 Fetched product ${product.id} from business ${businessId}`);

  res.json({
    ...productData,
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings,
    recentRatings: maskedRatings,
  });
}

// ============================================================================
// CREATE PRODUCT - WITH BUSINESS ASSIGNMENT
// ============================================================================
async function createProduct(req, res) {
  const { name, price, stock, description, imageUrl, images } = req.body;

  if (!name || !price || stock === undefined) {
    throw new Error('Name, price, and stock are required');
  }

  // Priority: explicit body > subdomain > user > error
  let businessId = req.body.businessId
    ? Number(req.body.businessId)
    : resolveBusinessId(req);

  if (!businessId) {
    throw new Error('Business ID is required');
  }

  const product = await prisma.product.create({
    data: {
      name:        name.trim(),
      price:       Number(price),
      stock:       Number(stock),
      description: description?.trim() || '',
      imageUrl:    imageUrl?.trim() || '',
      businessId,                                   // 🔥 BUSINESS ASSIGNMENT
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

  console.log(`✅ Created product: ${product.name} for business ${businessId}`);
  res.status(201).json(product);
}

// ============================================================================
// UPDATE PRODUCT - WITH TENANT SECURITY
// ============================================================================
async function updateProduct(req, res) {
  const { images, ...updateData } = req.body;
  const productId = Number(req.params.id);

  console.log(`🔄 Updating product ${productId}`);

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 🔥 TENANT SECURITY: compare against resolved businessId
    const resolvedBiz = resolveBusinessId(req);
    if (req.user.role !== 'super-admin' && existingProduct.businessId !== resolvedBiz) {
      return res.status(403).json({ error: 'You cannot manage products from another business' });
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        name:        updateData.name,
        price:       Number(updateData.price),
        stock:       Number(updateData.stock),
        description: updateData.description || '',
        imageUrl:    updateData.imageUrl || '',
      },
    });

    console.log(`✅ Updated product basic data for ${productId}`);

    // Handle images if provided
    if (images !== undefined && Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId } });

      if (images.length > 0) {
        const imagesToCreate = images.map((img, index) => ({
          productId,
          imageUrl:  img.imageUrl,
          order:     img.order !== undefined ? img.order : index,
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : (index === 0),
        }));

        await prisma.productImage.createMany({ data: imagesToCreate });
        console.log(`✅ Created ${imagesToCreate.length} new images for product ${productId}`);
      }
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    console.log(`✅ Successfully updated product ${productId}`);
    res.json(updatedProduct);
  } catch (error) {
    console.error(`❌ Failed to update product ${productId}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE PRODUCT - WITH TENANT SECURITY
// ============================================================================
async function deleteProduct(req, res) {
  const productId = Number(req.params.id);

  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && existingProduct.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'You cannot manage products from another business' });
  }

  await prisma.product.delete({ where: { id: productId } });

  console.log(`🗑️ Deleted product: ${productId} from business ${existingProduct.businessId}`);
  res.json({ ok: true, message: 'Product deleted' });
}

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================

async function addProductImage(req, res) {
  const { productId } = req.params;
  const { imageUrl, isPrimary } = req.body;

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && product.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'You cannot manage products from another business' });
  }

  const maxOrder = await prisma.productImage.findFirst({
    where:   { productId: Number(productId) },
    orderBy: { order: 'desc' },
    select:  { order: true },
  });

  const image = await prisma.productImage.create({
    data: {
      productId: Number(productId),
      imageUrl,
      order:     (maxOrder?.order || 0) + 1,
      isPrimary: isPrimary || false,
    },
  });

  console.log(`✅ Added image to product ${productId}`);
  res.json(image);
}

async function deleteProductImage(req, res) {
  const { imageId } = req.params;

  const image = await prisma.productImage.findUnique({
    where:   { id: Number(imageId) },
    include: { product: true },
  });

  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && image.product.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'You cannot manage products from another business' });
  }

  await prisma.productImage.delete({ where: { id: Number(imageId) } });

  console.log(`🗑️ Deleted image: ${imageId}`);
  res.json({ ok: true, message: 'Image deleted' });
}

async function reorderProductImages(req, res) {
  const { productId } = req.params;
  const { imageOrders } = req.body;

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const resolvedBiz = resolveBusinessId(req);
  if (req.user.role !== 'super-admin' && product.businessId !== resolvedBiz) {
    return res.status(403).json({ error: 'You cannot manage products from another business' });
  }

  for (const { id, order } of imageOrders) {
    await prisma.productImage.update({ where: { id }, data: { order } });
  }

  const images = await prisma.productImage.findMany({
    where:   { productId: Number(productId) },
    orderBy: { order: 'asc' },
  });

  console.log(`✅ Reordered images for product ${productId}`);
  res.json(images);
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
};