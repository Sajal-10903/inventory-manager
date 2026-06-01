import { useState } from 'react';

const sections = [
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'orders', label: 'Orders', icon: '🧾' },
];

export default function Navbar({ activeSection, onSectionChange }) {
  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-brand">
        <div className="navbar-logo" aria-hidden="true">IM</div>
        <span className="navbar-title">Inventory Manager</span>
      </div>
      <div className="navbar-nav" role="tablist" aria-label="Main navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            id={`nav-tab-${section.id}`}
            className={`nav-tab${activeSection === section.id ? ' active' : ''}`}
            role="tab"
            aria-selected={activeSection === section.id}
            onClick={() => onSectionChange(section.id)}
          >
            <span aria-hidden="true" style={{ marginRight: 6 }}>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
