// frontend/src/pages/Products.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState, Input } from '../components/shared';
import productService from '../services/productService';
import { formatCurrency } from '../utils/helpers';

// Builds a flat array of URLs from both product.images[] and product.imageUrl
function buildImageList(product) {
  const fromImages = (product.images || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(img => img.imageUrl)
    .filter(Boolean);

  if (fromImages.length > 0) return fromImages;
  if (product.imageUrl) return [product.imageUrl];
  return [];
}

// ── Mini slideshow for the product grid cards ────────────────────────────────
function ProductCardImages({ product }) {
  const images = buildImageList(product);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0); // reset when product changes
  }, [product.id]);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          // ✅ FIX: key uses both product.id and idx to ensure uniqueness
          key={`${product.id}-${idx}`}
          src={images[idx]}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {images.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-300 block"
              style={{
                width: i === idx ? 12 : 4,
                height: 4,
                background: i === idx ? 'white' : 'rgba(255,255,255,.5)',
              }}
            />
          ))}
        </div>
      )}
      {images.length > 1 && (
        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full z-10">
          {images.length} photos
        </div>
      )}
    </div>
  );
}

// ── Image upload panel used inside the Add/Edit modal ────────────────────────
function MultiImageUploader({ images, onAdd, onRemove, onSetPrimary, uploading }) {
  // ✅ FIX: separate ref per input so they don't share state
  const existingInputRef = useRef(null);
  const emptyInputRef = useRef(null);

  const resetInput = (ref) => {
    if (ref.current) ref.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Product Images</label>
      <p className="text-xs text-gray-500 mb-3">
        Upload multiple images. They rotate every 3 seconds on your storefront. First image is the primary.
      </p>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((img, i) => (
            <div
              key={`uploaded-${i}-${img.url}`}
              className="relative group rounded-lg overflow-hidden aspect-square border-2"
              style={{ borderColor: i === 0 ? '#10B981' : '#e5e7eb' }}
            >
              {/* ✅ FIX: img.url is correct — MultiImageUploader stores { url } */}
              <img src={img.url} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 z-20">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(i)}
                    className="bg-white text-xs text-gray-700 font-semibold px-2 py-1 rounded-lg hover:bg-green-50 hover:text-green-700"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded z-10">
                {i + 1}/{images.length}
              </div>
            </div>
          ))}

          {/* Add more slot */}
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            onClick={() => !uploading && existingInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Uploading…</span>
              </div>
            ) : (
              <>
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Add more</span>
              </>
            )}
            {/* ✅ FIX: input is NOT inside label — controlled via ref click */}
            <input
              ref={existingInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { onAdd(e); resetInput(existingInputRef); }}
              disabled={uploading}
            />
          </div>
        </div>
      ) : (
        /* Empty state — first upload */
        <div
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
          onClick={() => !uploading && emptyInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Uploading…</span>
            </div>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Click to upload images</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB each · multiple allowed</span>
            </>
          )}
          <input
            ref={emptyInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { onAdd(e); resetInput(emptyInputRef); }}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Products page ───────────────────────────────────────────────────────
const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploading, setUploading] = useState(false);

  // Multi-image state: array of { url, isPrimary, order }
  const [uploadedImages, setUploadedImages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Upload files one at a time, but don't toggle uploading inside the loop.
  // Set uploading=true before the loop, false after. Use a local snapshot of files
  // so the input's FileList isn't cleared mid-loop.
  const handleImageAdd = async (e) => {
    const files = Array.from(e.target.files || []); // snapshot immediately
    if (!files.length) return;

    setUploading(true);
    const successful = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is over 5MB — skipped`);
        continue;
      }
      try {
        const result = await productService.uploadImage(file);
        // ✅ normalise: always store as { url }
        const url = result.url || result.imageUrl;
        if (!url) {
          toast.error(`${file.name}: server returned no URL`);
          continue;
        }
        successful.push(url);
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (successful.length > 0) {
      // ✅ FIX: batch all new images into a single setState call
      setUploadedImages(prev => {
        const next = [...prev];
        for (const url of successful) {
          next.push({ url, isPrimary: next.length === 0, order: next.length });
        }
        return next;
      });
    }

    setUploading(false);
  };

  const handleImageRemove = (index) => {
    setUploadedImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((img, i) => ({ ...img, isPrimary: i === 0, order: i }));
    });
  };

  const handleSetPrimary = (index) => {
    setUploadedImages(prev => {
      const arr = [...prev];
      const [selected] = arr.splice(index, 1);
      arr.unshift(selected);
      return arr.map((img, i) => ({ ...img, isPrimary: i === 0, order: i }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const primaryImage = uploadedImages[0];
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        imageUrl: primaryImage?.url || '',
        images: uploadedImages.map((img, i) => ({
          imageUrl: img.url,
          order: i,
          isPrimary: i === 0,
        })),
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
        toast.success('Product updated');
      } else {
        await productService.createProduct(productData);
        toast.success('Product created');
      }

      setModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await productService.toggleAvailability(id);
      toast.success('Availability updated');
      fetchProducts();
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category || '',
      stock: product.stock?.toString() || '0',
    });
    // ✅ FIX: buildImageList returns URL strings; wrap into { url } objects
    const existingImages = buildImageList(product).map((url, i) => ({
      url,
      isPrimary: i === 0,
      order: i,
    }));
    setUploadedImages(existingImages);
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '', stock: '' });
    setUploadedImages([]);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Product</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="input"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Plus}
            title="No products found"
            description={searchTerm ? 'Try adjusting your search' : 'Start by adding your first product'}
            actionLabel="Add Product"
            onAction={() => setModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="h-full flex flex-col">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <ProductCardImages product={product} />
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant={product.isAvailable ? 'success' : 'danger'}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                  {product.category && (
                    <Badge variant="info" className="mb-2">{product.category}</Badge>
                  )}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-sm text-gray-500">Stock: {product.stock || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button size="sm" variant="outline" icon={Edit}
                    onClick={() => openEditModal(product)} fullWidth>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={product.isAvailable ? EyeOff : Eye}
                    onClick={() => handleToggleAvailability(product.id)}
                  >
                    {product.isAvailable ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultiImageUploader
            images={uploadedImages}
            onAdd={handleImageAdd}
            onRemove={handleImageRemove}
            onSetPrimary={handleSetPrimary}
            uploading={uploading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Product Name" value={formData.name} required
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <Input label="Category" value={formData.category}
              placeholder="e.g., Electronics, Food"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            <Input label="Price" type="number" step="0.01" value={formData.price} required
              onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
            <Input label="Stock" type="number" value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" fullWidth disabled={uploading}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" fullWidth
              onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;