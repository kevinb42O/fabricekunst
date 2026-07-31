import React from 'react';

/**
 * GallerySeal Component
 * Renders the official stamp emblem (andor.jpeg) for Atelier Rembrandt / Andor Comm V. certificates.
 */
export default function GallerySeal({ className = "w-24 h-24", logoUrl = "/images/andor.jpeg" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <img 
        src={logoUrl} 
        alt="Officiële Stempel Andor Comm V." 
        className="w-full h-full object-contain filter contrast-105"
      />
    </div>
  );
}

