import React from 'react';
import CertificateManager from './CertificateManager.jsx';

export default function CertificateModal({ item, items, onClose }) {
  return <CertificateManager initialItem={item} items={items} onBackToItems={onClose} />;
}
