import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronsLeftRight, Eye, Maximize2, RotateCcw, Sparkles, Sun } from 'lucide-react';
import { localized } from '../utils/provenance';

const copy = (value, language) => localized(value, language) || localized(value, 'nl');

export default function ComparisonSlider({
  comparison,
  leftAsset,
  rightAsset,
  language = 'nl',
  onOpenLightbox,
  className = '',
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSide, setActiveSide] = useState('split'); // 'left' | 'split' | 'right'
  const containerRef = useRef(null);

  const title = copy(comparison?.title, language) || (
    language === 'fr'
      ? 'Comparaison optique : Lumière du jour vs. Fluorescence UV'
      : language === 'en'
      ? 'Optical Comparison: Visible Daylight vs. UV Fluorescence'
      : 'Optische vergelijking: Daglicht vs. UV-Fluorescentie'
  );

  const leftLabel = copy(comparison?.leftLabel, language) || (
    language === 'fr' ? 'Lumière du jour' : language === 'en' ? 'Daylight' : 'Daglicht'
  );

  const rightLabel = copy(comparison?.rightLabel, language) || (
    language === 'fr' ? 'Fluorescence UV' : language === 'en' ? 'UV Fluorescence' : 'UV-Fluorescentie'
  );

  const leftAlt = copy(leftAsset?.alt, language) || leftLabel;
  const rightAlt = copy(rightAsset?.alt, language) || rightLabel;

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(clamped);
    if (clamped <= 3) setActiveSide('right');
    else if (clamped >= 97) setActiveSide('left');
    else setActiveSide('split');
  }, []);

  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
    updatePosition(e.clientX ?? e.touches?.[0]?.clientX);
  }, [updatePosition]);

  useEffect(() => {
    if (!isDragging) return undefined;

    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      if (clientX !== null) {
        updatePosition(clientX);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [isDragging, updatePosition]);

  const handleKeyDown = (e) => {
    let next = sliderPosition;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      next = Math.max(0, sliderPosition - (e.shiftKey ? 10 : 2));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      next = Math.min(100, sliderPosition + (e.shiftKey ? 10 : 2));
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = 100;
    } else {
      return;
    }
    e.preventDefault();
    setSliderPosition(next);
    if (next <= 3) setActiveSide('right');
    else if (next >= 97) setActiveSide('left');
    else setActiveSide('split');
  };

  const setPreset = (percent, side) => {
    setSliderPosition(percent);
    setActiveSide(side);
  };

  return (
    <figure
      className={`relative isolate overflow-hidden border border-[#d8ceb8] bg-[#141210] text-[#f7f4ed] shadow-2xl ${className}`}
      aria-label={title}
    >
      {/* Top Bar / Header */}
      <div className="flex flex-col gap-4 border-b border-[#2d2720] bg-[#1a1714] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
            <Eye className="h-3.5 w-3.5 text-[#B8860B]" aria-hidden="true" />
            <span>
              {language === 'fr'
                ? 'Analyse optique interactive'
                : language === 'en'
                ? 'Interactive optical analysis'
                : 'Interactieve optische analyse'}
            </span>
          </div>
          <h3 className="mt-1 font-serif text-lg font-bold text-white sm:text-xl">
            {title}
          </h3>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 self-start rounded-full border border-[#3b3429] bg-[#141210]/90 p-1 text-xs font-medium sm:self-auto">
          <button
            type="button"
            onClick={() => setPreset(100, 'left')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
              activeSide === 'left'
                ? 'bg-[#8E7035] text-white shadow'
                : 'text-[#c2b6a3] hover:text-white'
            }`}
            aria-pressed={activeSide === 'left'}
          >
            <Sun className="h-3 w-3" />
            <span className="hidden xs:inline">{leftLabel}</span>
            <span className="xs:hidden">Dag</span>
          </button>

          <button
            type="button"
            onClick={() => setPreset(50, 'split')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
              activeSide === 'split'
                ? 'bg-[#8E7035] text-white shadow'
                : 'text-[#c2b6a3] hover:text-white'
            }`}
            aria-pressed={activeSide === 'split'}
          >
            <ChevronsLeftRight className="h-3 w-3" />
            <span>50/50</span>
          </button>

          <button
            type="button"
            onClick={() => setPreset(0, 'right')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
              activeSide === 'right'
                ? 'bg-[#5b3a82] text-white shadow'
                : 'text-[#c2b6a3] hover:text-white'
            }`}
            aria-pressed={activeSide === 'right'}
          >
            <Sparkles className="h-3 w-3 text-[#c49aff]" />
            <span className="hidden xs:inline">{rightLabel}</span>
            <span className="xs:hidden">UV</span>
          </button>

          {onOpenLightbox && (leftAsset?.id || rightAsset?.id) && (
            <button
              type="button"
              onClick={() => onOpenLightbox(sliderPosition > 50 ? leftAsset?.id : rightAsset?.id)}
              className="ml-1 rounded-full p-1 text-[#a39480] transition hover:bg-white/10 hover:text-white"
              title={language === 'fr' ? 'Agrandir l’image' : language === 'en' ? 'Enlarge image' : 'Beeld vergroten'}
              aria-label={language === 'fr' ? 'Agrandir l’image' : language === 'en' ? 'Enlarge image' : 'Beeld vergroten'}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Comparison Viewport */}
      <div
        ref={containerRef}
        className="group relative aspect-[3/4] max-h-[75vh] w-full cursor-ew-resize select-none overflow-hidden bg-black md:aspect-[4/5] lg:aspect-[16/11]"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        role="region"
        aria-label={title}
      >
        {/* Layer 2: Right Image (UV Fluorescence) - Base Layer */}
        <div className="absolute inset-0 h-full w-full">
          {rightAsset?.url ? (
            <img
              src={rightAsset.url}
              srcSet={rightAsset.srcSet || undefined}
              sizes="(min-width: 1280px) 1100px, 100vw"
              alt={rightAlt}
              draggable={false}
              className="h-full w-full object-contain object-center select-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#171321] text-[#9370DB]">
              UV Image Loading...
            </div>
          )}
        </div>

        {/* Layer 1: Left Image (Daylight / Visible) - Clipped Overlay */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden will-change-[clip-path]"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            WebkitClipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          {leftAsset?.url ? (
            <img
              src={leftAsset.url}
              srcSet={leftAsset.srcSet || undefined}
              sizes="(min-width: 1280px) 1100px, 100vw"
              alt={leftAlt}
              draggable={false}
              className="h-full w-full object-contain object-center select-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#211a13] text-[#d4af37]">
              Daylight Image Loading...
            </div>
          )}
        </div>

        {/* Floating Labels / Badges inside the frame */}
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#E6CA65] backdrop-blur-md transition-opacity duration-200">
            <Sun className="h-3 w-3 text-amber-400" />
            {leftLabel}
          </span>
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#d8b4fe] backdrop-blur-md transition-opacity duration-200">
            <Sparkles className="h-3 w-3 text-purple-300" />
            {rightLabel}
          </span>
        </div>

        {/* The Golden Vertical Divider Line */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#b8860b] via-[#f9e8be] to-[#b8860b] shadow-[0_0_15px_rgba(212,175,55,0.7)]"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Centered Luxury Medallion Handle */}
          <div
            className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#E6CA65] bg-[#1C1A17]/95 text-[#E6CA65] shadow-2xl backdrop-blur-sm transition-transform active:scale-95 ${
              isDragging ? 'scale-110 ring-4 ring-[#B8860B]/30' : 'group-hover:scale-105'
            }`}
            style={{ left: '50%' }}
            role="slider"
            tabIndex={0}
            aria-label={`${title} slider`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuetext={`${Math.round(sliderPosition)}% ${leftLabel}, ${Math.round(100 - sliderPosition)}% ${rightLabel}`}
            onKeyDown={handleKeyDown}
          >
            <ChevronsLeftRight className="h-5 w-5 drop-shadow" />
          </div>
        </div>

        {/* Drag Hint on Initial Hover */}
        {!isDragging && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur-md transition-opacity group-hover:opacity-0">
            {language === 'fr'
              ? 'Glissez pour comparer les longueurs d’onde'
              : language === 'en'
              ? 'Drag handle to compare wavelengths'
              : 'Versleep de balk om de golflengten te vergelijken'}
          </div>
        )}
      </div>

      {/* Caption & Expert Interpretation Footnote */}
      <figcaption className="grid gap-3 border-t border-[#2d2720] bg-[#171412] p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
        <p className="font-serif text-xs leading-relaxed text-[#bcb2a3] sm:text-sm">
          <span className="font-semibold text-[#E6CA65]">
            {language === 'fr' ? 'Observation technique : ' : language === 'en' ? 'Technical observation: ' : 'Technische observatie: '}
          </span>
          {language === 'fr'
            ? 'Sous rayonnement UV à 365 nm, la patine du vernis naturel ancien émet une fluorescence jaune-verdâtre homogène, tandis que les repeints et restaurations postérieurs absorbent la lumière et apparaissent sous forme d’îlots sombres nettement délimités.'
            : language === 'en'
            ? 'Under 365 nm UV radiation, historical natural resin varnish emits a coherent yellowish-green fluorescence, while modern retouchings and repaired losses absorb UV light, appearing as distinct, darker islands.'
            : 'Onder gefilterd ultraviolet licht (365 nm) licht het eeuwenoude natuurharsvernis egaal geelgroen op, terwijl latere retouches en reparaties het UV-licht absorberen en als scherp afgebakende donkere vlekken zichtbaar worden.'}
        </p>

        <button
          type="button"
          onClick={() => setPreset(50, 'split')}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded border border-[#3d3428] px-3 py-1.5 text-xs text-[#d7cbbe] transition hover:bg-white/5 hover:text-white sm:self-center"
        >
          <RotateCcw className="h-3 w-3 text-[#B8860B]" />
          <span>{language === 'fr' ? 'Réinitialiser 50/50' : language === 'en' ? 'Reset 50/50' : 'Herstel 50/50'}</span>
        </button>
      </figcaption>
    </figure>
  );
}
