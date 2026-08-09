import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageZoomModal({ images = [], initialIndex = 0, title = '', onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef(null);
  const positionAtDragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const hasDragged = useRef(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Reset pan position when zoom goes back to 1
  useEffect(() => {
    if (zoomLevel === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !isDragging) handleNext();
      if (e.key === 'ArrowLeft' && !isDragging) handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isDragging]);

  const activeImage = images[currentIndex] || { url: '', caption: '' };

  const resetToImage = (index) => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex(index);
  };

  const handleNext = () => resetToImage((currentIndex + 1) % images.length);
  const handlePrev = () => resetToImage((currentIndex - 1 + images.length) % images.length);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleZoom = () => {
    if (hasDragged.current) return; // don't toggle if user was dragging
    setZoomLevel((prev) => {
      if (prev === 1) return 2;
      setPosition({ x: 0, y: 0 });
      return 1;
    });
  };

  // ── Mouse drag handlers ──────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    hasDragged.current = false;
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    positionAtDragStart.current = { ...position };
  }, [zoomLevel, position]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setPosition({
      x: positionAtDragStart.current.x + dx,
      y: positionAtDragStart.current.y + dy,
    });
  }, [isDragging]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const onWheel = useCallback((event) => {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const zoomDelta = event.deltaY < 0 ? 0.25 : -0.25;
    setZoomLevel((previousZoom) => {
      const nextZoom = Math.min(Math.max(previousZoom + zoomDelta, 1), 4);
      if (nextZoom === previousZoom) return previousZoom;
      if (nextZoom === 1) {
        setPosition({ x: 0, y: 0 });
        return nextZoom;
      }

      const pointerX = event.clientX - (rect.left + rect.width / 2);
      const pointerY = event.clientY - (rect.top + rect.height / 2);
      const ratio = nextZoom / previousZoom;
      setPosition((previousPosition) => ({
        x: pointerX - (pointerX - previousPosition.x) * ratio,
        y: pointerY - (pointerY - previousPosition.y) * ratio,
      }));
      return nextZoom;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── Touch drag handlers ──────────────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    hasDragged.current = false;
    if (zoomLevel <= 1) return;
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    positionAtDragStart.current = { ...position };
  }, [zoomLevel, position]);

  const onTouchMove = useCallback((e) => {
    if (!isDragging || !dragStart.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setPosition({
      x: positionAtDragStart.current.x + dx,
      y: positionAtDragStart.current.y + dy,
    });
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // Cursor style based on state
  const cursorStyle =
    zoomLevel > 1
      ? isDragging
        ? 'cursor-grabbing'
        : 'cursor-grab'
      : 'cursor-zoom-in';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-fade-in"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="min-w-0 pr-4">
          <h3 className="text-white font-serif font-bold text-base sm:text-xl truncate">
            {title}
          </h3>
          <p className="text-xs text-[#D4AF37] font-mono">
            {activeImage.caption || `Foto ${currentIndex + 1} van ${images.length}`}
          </p>
        </div>

        {/* Toolbar & Close Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="Uitzoomen"
            className="p-3 sm:p-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-[#D4AF37] font-bold px-2 py-1 bg-white/10 rounded-md">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 4}
            title="Inzoomen"
            className="p-3 sm:p-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {zoomLevel !== 1 && (
            <button
              onClick={handleResetZoom}
              title="Herstel grootte"
              className="p-3 sm:p-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-6 bg-white/20 mx-1" />

          <button
            onClick={onClose}
            title="Sluiten (Esc)"
            className="p-3 sm:p-2.5 rounded-md bg-[#B8860B] hover:bg-[#8E7035] text-white transition-colors shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden pt-16 pb-16"
      >
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              title="Vorige foto"
              className="absolute left-2 sm:left-4 z-40 p-3 sm:p-3 rounded-full bg-black/60 hover:bg-[#B8860B] text-white border border-white/20 transition-all shadow-lg backdrop-blur-sm min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              title="Volgende foto"
              className="absolute right-2 sm:right-4 z-40 p-3 sm:p-3 rounded-full bg-black/60 hover:bg-[#B8860B] text-white border border-white/20 transition-all shadow-lg backdrop-blur-sm min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Zoomable + Pannable Image Container */}
        <div
          onClick={toggleZoom}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`relative flex items-center justify-center ${cursorStyle}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.25s ease',
            willChange: 'transform',
          }}
        >
          <img
            src={activeImage.url || activeImage}
            alt={activeImage.caption || title}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable={false}
            className="max-w-[88vw] max-h-[80vh] object-contain rounded-md shadow-2xl border border-white/10"
          />
        </div>

        {/* Pan hint when zoomed */}
        {zoomLevel > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
            <span className="text-xs text-white/50 font-mono px-3 py-1.5 bg-black/40 rounded-full backdrop-blur-sm">
              Sleep om te bewegen
            </span>
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-2 sm:space-x-2 z-50 px-4 overflow-x-auto mobile-scroll-x">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => resetToImage(idx)}
              className={`w-16 h-12 sm:w-14 sm:h-10 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex ? 'border-[#D4AF37] scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'
              }`}
            >
              <img src={img.url || img} alt="" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
