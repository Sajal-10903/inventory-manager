import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from './Modal';

const emptyProduct = { sku: '', name: '', price: '', stock: '' };

function getStockClass(stock) {
  if (stock <= 0) return 'out-of-stock';
  if (stock < 10) return 'low-stock';
  return 'in-stock';
}

function getStockLabel(stock) {
  if (stock <= 0) return 'Out of Stock';
  if (stock < 10) return `Low Stock (${stock})`;
  return `In Stock (${stock})`;
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export default function ProductsSection({ onToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      onToast('Failed to load products: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      sku: product.sku || '',
      name: product.name || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = 'Valid price is required';
    if (form.stock === '' || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      errs.stock = 'Valid stock quantity is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    };

    try {
      setSubmitting(true);
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        onToast(`Product "${payload.name}" updated successfully`, 'success');
      } else {
        await api.createProduct(payload);
        onToast(`Product "${payload.name}" created successfully`, 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      onToast(err.message || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    try {
      await api.deleteProduct(product.id);
      onToast(`Product "${product.name}" deleted`, 'success');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      onToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Loading skeleton
  if (loading) {
    return (
      <section id="products-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <span className="section-title-icon">📦</span>
              Products
            </h2>
            <p className="section-subtitle">Manage your product inventory</p>
          </div>
        </div>
        <div className="data-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="products-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span className="section-title-icon">📦</span>
            Products
          </h2>
          <p className="section-subtitle">
            {products.length} product{products.length !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd} id="add-product-btn">
          <span aria-hidden="true">+</span> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No products yet</div>
            <p className="empty-state-text">
              Add your first product to start managing your inventory
            </p>
          </div>
        </div>
      ) : (
        <div className="data-grid">
          {products.map((product) => (
            <div className="data-card" key={product.id} id={`product-card-${product.id}`}>
              <div className="card-header">
                <div>
                  <div className="card-title">{product.name}</div>
                  <div className="card-meta">SKU: {product.sku}</div>
                </div>
                <span className={`stock-badge ${getStockClass(product.stock)}`}>
                  {getStockLabel(product.stock)}
                </span>
              </div>
              <div className="card-body">
                <div className="card-field">
                  <span className="card-field-label">Price</span>
                  <span className="card-field-value price">
                    {formatPrice(product.price)}
                  </span>
                </div>
                <div className="card-field">
                  <span className="card-field-label">In Stock</span>
                  <span className="card-field-value">{product.stock} units</span>
                </div>
              </div>
              <div className="card-actions">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => openEdit(product)}
                  id={`edit-product-${product.id}`}
                  style={{ flex: 1 }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => setDeleteConfirm(product)}
                  id={`delete-product-${product.id}`}
                  style={{ flex: 1 }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} id="product-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product-sku">SKU</label>
              <input
                id="product-sku"
                type="text"
                placeholder="e.g. PRD-001"
                value={form.sku}
                onChange={(e) => updateField('sku', e.target.value)}
              />
              {errors.sku && <div className="form-error">{errors.sku}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="product-name">Product Name</label>
              <input
                id="product-name"
                type="text"
                placeholder="e.g. Widget Pro"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product-price">Price ($)</label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
              />
              {errors.price && <div className="form-error">{errors.price}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="product-stock">Stock Quantity</label>
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
              />
              {errors.stock && <div className="form-error">{errors.stock}</div>}
            </div>
          </div>
          <div className="modal-footer" style={{ padding: 0, paddingTop: 16, border: 'none' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} id="product-submit-btn">
              {submitting
                ? '⏳ Saving...'
                : editingProduct
                ? '💾 Update Product'
                : '✨ Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
      >
        <div className="confirm-body">
          <div className="confirm-icon">⚠️</div>
          <p className="confirm-text">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
            <br />
            This action cannot be undone.
          </p>
          <div className="confirm-actions">
            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => handleDelete(deleteConfirm)}
              id="confirm-delete-product-btn"
            >
              🗑️ Delete Product
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
