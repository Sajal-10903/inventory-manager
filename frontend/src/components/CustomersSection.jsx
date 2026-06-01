import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from './Modal';

const emptyCustomer = { name: '', email: '' };

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  'linear-gradient(135deg, #7c3aed, #a78bfa)',
  'linear-gradient(135deg, #06b6d4, #67e8f9)',
  'linear-gradient(135deg, #ec4899, #f9a8d4)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #3b82f6, #93c5fd)',
];

export default function CustomersSection({ onToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      onToast('Failed to load customers: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAdd = () => {
    setEditingCustomer(null);
    setForm(emptyCustomer);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || '',
      email: customer.email || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      errs.email = 'Please enter a valid email';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    try {
      setSubmitting(true);
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
        onToast(`Customer "${payload.name}" updated successfully`, 'success');
      } else {
        await api.createCustomer(payload);
        onToast(`Customer "${payload.name}" added successfully`, 'success');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      onToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer) => {
    try {
      await api.deleteCustomer(customer.id);
      onToast(`Customer "${customer.name}" deleted`, 'success');
      setDeleteConfirm(null);
      fetchCustomers();
    } catch (err) {
      onToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (loading) {
    return (
      <section id="customers-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <span className="section-title-icon">👥</span>
              Customers
            </h2>
            <p className="section-subtitle">Manage your customer records</p>
          </div>
        </div>
        <div className="data-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="customers-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span className="section-title-icon">👥</span>
            Customers
          </h2>
          <p className="section-subtitle">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd} id="add-customer-btn">
          <span aria-hidden="true">+</span> Add Customer
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No customers yet</div>
            <p className="empty-state-text">
              Add your first customer to start tracking orders
            </p>
          </div>
        </div>
      ) : (
        <div className="data-grid">
          {customers.map((customer, idx) => (
            <div className="data-card" key={customer.id} id={`customer-card-${customer.id}`}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 'var(--radius-lg)',
                      background: avatarColors[idx % avatarColors.length],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <div className="card-title">{customer.name}</div>
                    <div className="card-meta">{customer.email}</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="card-field">
                  <span className="card-field-label">Member Since</span>
                  <span className="card-field-value">
                    {formatDate(customer.created_at || customer.join_date)}
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => openEdit(customer)}
                  id={`edit-customer-${customer.id}`}
                  style={{ flex: 1 }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => setDeleteConfirm(customer)}
                  id={`delete-customer-${customer.id}`}
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
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit} id="customer-form">
          <div className="form-group">
            <label htmlFor="customer-name">Full Name</label>
            <input
              id="customer-name"
              type="text"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="customer-email">Email Address</label>
            <input
              id="customer-email"
              type="email"
              placeholder="e.g. john@example.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div className="modal-footer" style={{ padding: 0, paddingTop: 16, border: 'none' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} id="customer-submit-btn">
              {submitting
                ? '⏳ Saving...'
                : editingCustomer
                ? '💾 Update Customer'
                : '✨ Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Customer"
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
              id="confirm-delete-customer-btn"
            >
              🗑️ Delete Customer
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
