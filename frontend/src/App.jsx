import { useState, useCallback, useRef } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import ProductsSection from './components/ProductsSection';
import CustomersSection from './components/CustomersSection';
import OrdersSection from './components/OrdersSection';

let toastId = 0;

export default function App() {
  const [activeSection, setActiveSection] = useState('products');
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef({});

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    toastTimers.current[id] = setTimeout(() => {
      dismissToast(id);
    }, 4000);

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    // Add exit animation class first
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      if (toastTimers.current[id]) {
        clearTimeout(toastTimers.current[id]);
        delete toastTimers.current[id];
      }
    }, 300);
  }, []);

  const toastIcons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div className="app-container" id="app">
      <Navbar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="main-content">
        {activeSection === 'products' && <ProductsSection onToast={addToast} />}
        {activeSection === 'customers' && <CustomersSection onToast={addToast} />}
        {activeSection === 'orders' && <OrdersSection onToast={addToast} />}
      </main>

      {/* Toast Notifications */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}${toast.exiting ? ' toast-exit' : ''}`}
            role="alert"
          >
            <span className="toast-icon">{toastIcons[toast.type] || 'ℹ️'}</span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
