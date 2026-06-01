import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'complete') return 'completed';
  if (s === 'pending') return 'pending';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'completed';
}

export default function OrdersSection({ onToast }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [customersData, productsData, ordersData] = await Promise.all([
        api.getCustomers(),
        api.getProducts(),
        api.getOrders(),
      ]);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      onToast('Failed to load data: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const selectedProductData = useMemo(
    () => products.find((p) => String(p.id) === String(selectedProduct)),
    [products, selectedProduct]
  );

  const totalPrice = useMemo(() => {
    if (!selectedProductData || !quantity || quantity < 1) return 0;
    return selectedProductData.price * quantity;
  }, [selectedProductData, quantity]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      onToast('Please select a customer', 'error');
      return;
    }
    if (!selectedProduct) {
      onToast('Please select a product', 'error');
      return;
    }
    if (!quantity || quantity < 1) {
      onToast('Quantity must be at least 1', 'error');
      return;
    }
    if (selectedProductData && quantity > selectedProductData.stock) {
      onToast(
        `Insufficient stock! Only ${selectedProductData.stock} units available for "${selectedProductData.name}"`,
        'error'
      );
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomer, 10),
      product_id: parseInt(selectedProduct, 10),
      quantity: parseInt(quantity, 10),
    };

    try {
      setSubmitting(true);
      await api.createOrder(payload);
      onToast('Order placed successfully! 🎉', 'success');
      setSelectedCustomer('');
      setSelectedProduct('');
      setQuantity(1);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 600);
      fetchAll();
    } catch (err) {
      onToast(err.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Build lookup maps for order display
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((c) => (map[c.id] = c));
    return map;
  }, [customers]);

  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => (map[p.id] = p));
    return map;
  }, [products]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const da = new Date(a.created_at || a.date || 0);
      const db = new Date(b.created_at || b.date || 0);
      return db - da;
    });
  }, [orders]);

  if (loading) {
    return (
      <section id="orders-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <span className="section-title-icon">🧾</span>
              Orders
            </h2>
            <p className="section-subtitle">Place and track orders</p>
          </div>
        </div>
        <div className="order-layout">
          <div className="skeleton skeleton-card" style={{ height: 360 }} />
          <div className="skeleton skeleton-card" style={{ height: 400 }} />
        </div>
      </section>
    );
  }

  return (
    <section id="orders-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span className="section-title-icon">🧾</span>
            Orders
          </h2>
          <p className="section-subtitle">
            {orders.length} order{orders.length !== 1 ? 's' : ''} placed
          </p>
        </div>
      </div>

      <div className="order-layout">
        {/* Place Order Form */}
        <div className={`order-form-card${successFlash ? ' success-flash' : ''}`}>
          <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
            ✨ Place New Order
          </h3>
          <form onSubmit={handlePlaceOrder} id="order-form">
            <div className="form-group">
              <label htmlFor="order-customer">Customer</label>
              <select
                id="order-customer"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="order-product">Product</label>
              <select
                id="order-product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} ({p.sku}) — {p.stock} in stock
                  </option>
                ))}
              </select>
              {selectedProductData && selectedProductData.stock <= 0 && (
                <div className="form-error">This product is out of stock</div>
              )}
              {selectedProductData && selectedProductData.stock > 0 && selectedProductData.stock < 10 && (
                <div className="form-help" style={{ color: 'var(--color-warning)' }}>
                  ⚠️ Low stock — only {selectedProductData.stock} units left
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="order-quantity">Quantity</label>
              <input
                id="order-quantity"
                type="number"
                min="1"
                max={selectedProductData?.stock || 9999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              {selectedProductData && quantity > selectedProductData.stock && (
                <div className="form-error">
                  Only {selectedProductData.stock} units available
                </div>
              )}
            </div>

            <div className="order-total">
              <span className="order-total-label">Total Price</span>
              <span className="order-total-value">{formatPrice(totalPrice)}</span>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              id="place-order-btn"
              style={{ width: '100%', marginTop: 20, padding: '14px 24px', fontSize: '0.95rem' }}
            >
              {submitting ? '⏳ Placing Order...' : '🚀 Place Order'}
            </button>
          </form>
        </div>

        {/* Order History */}
        <div className="order-history-card">
          <div className="order-history-header">
            <h3>📋 Order History</h3>
          </div>
          {sortedOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <div className="empty-state-title">No orders yet</div>
              <p className="empty-state-text">
                Place your first order using the form
              </p>
            </div>
          ) : (
            <div className="order-table-wrapper">
              <table id="orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => {
                    const customer = customerMap[order.customer_id];
                    const product = productMap[order.product_id];
                    return (
                      <tr key={order.id} id={`order-row-${order.id}`}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)' }}>
                            #{String(order.id).padStart(4, '0')}
                          </span>
                        </td>
                        <td>{customer?.name || `Customer #${order.customer_id}`}</td>
                        <td>
                          <div>{product?.name || `Product #${order.product_id}`}</div>
                          {product?.sku && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              {product.sku}
                            </div>
                          )}
                        </td>
                        <td>{order.quantity}</td>
                        <td>
                          <span className="price">{formatPrice(order.total_price ?? (product ? product.price * order.quantity : 0))}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${getStatusClass(order.status)}`}>
                            {order.status || 'Completed'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {formatDate(order.created_at || order.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
