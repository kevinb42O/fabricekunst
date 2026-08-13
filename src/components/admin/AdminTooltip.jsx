import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const TOOLTIP_SELECTOR = '[data-admin-tooltip], [title], button[aria-label], a[aria-label]';

const getTooltipTarget = (node) => {
  if (!(node instanceof Element)) return null;
  return node.closest(TOOLTIP_SELECTOR);
};

const prepareTooltipTarget = (target) => {
  const nativeTitle = target.getAttribute('title');
  if (nativeTitle && !target.dataset.adminTooltip) {
    target.dataset.adminTooltip = nativeTitle;
    target.removeAttribute('title');
  }

  return (
    target.dataset.adminTooltip ||
    target.getAttribute('aria-label') ||
    nativeTitle ||
    ''
  ).trim();
};

const getPointerPosition = (clientX, clientY) => {
  const estimatedWidth = 260;
  const estimatedHeight = 48;
  const edge = 12;
  const offset = 16;
  const alignEnd = clientX + offset + estimatedWidth > window.innerWidth - edge;
  const placeAbove = clientY + offset + estimatedHeight > window.innerHeight - edge;

  return {
    x: alignEnd ? clientX - offset : clientX + offset,
    y: placeAbove ? clientY - offset : clientY + offset,
    align: alignEnd ? 'end' : 'start',
    vertical: placeAbove ? 'above' : 'below'
  };
};

export default function AdminTooltip() {
  const [tooltip, setTooltip] = useState(null);
  const activeTarget = useRef(null);
  const describedTarget = useRef(null);
  const previousDescribedBy = useRef(null);
  const inputMode = useRef('pointer');
  const pointerPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);

  useEffect(() => {
    const disconnectDescription = () => {
      if (!describedTarget.current) return;

      if (previousDescribedBy.current) {
        describedTarget.current.setAttribute('aria-describedby', previousDescribedBy.current);
      } else {
        describedTarget.current.removeAttribute('aria-describedby');
      }

      describedTarget.current = null;
      previousDescribedBy.current = null;
    };

    const connectDescription = (target) => {
      disconnectDescription();
      describedTarget.current = target;
      previousDescribedBy.current = target.getAttribute('aria-describedby');
      const describedBy = [previousDescribedBy.current, 'admin-dashboard-tooltip']
        .filter(Boolean)
        .join(' ');
      target.setAttribute('aria-describedby', describedBy);
    };

    const hideTooltip = () => {
      disconnectDescription();
      activeTarget.current = null;
      setTooltip(null);
    };

    const showPointerTooltip = (target, event) => {
      const text = prepareTooltipTarget(target);
      if (!text) return;
      disconnectDescription();
      activeTarget.current = target;
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      setTooltip({ text, mode: 'pointer', ...getPointerPosition(event.clientX, event.clientY) });
    };

    const handlePointerOver = (event) => {
      if (event.pointerType === 'touch') return;
      inputMode.current = 'pointer';
      const target = getTooltipTarget(event.target);
      if (!target || target === activeTarget.current) return;
      showPointerTooltip(target, event);
    };

    const handlePointerMove = (event) => {
      if (event.pointerType === 'touch') return;
      if (!activeTarget.current) {
        const target = getTooltipTarget(event.target);
        if (target) showPointerTooltip(target, event);
        return;
      }
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      if (animationFrame.current) return;

      animationFrame.current = window.requestAnimationFrame(() => {
        animationFrame.current = null;
        const { x, y } = pointerPosition.current;
        setTooltip((current) => current?.mode === 'pointer'
          ? { ...current, ...getPointerPosition(x, y) }
          : current
        );
      });
    };

    const handlePointerOut = (event) => {
      if (!activeTarget.current) return;
      if (event.relatedTarget instanceof Node && activeTarget.current.contains(event.relatedTarget)) return;
      const nextTarget = getTooltipTarget(event.relatedTarget);
      if (nextTarget === activeTarget.current) return;
      hideTooltip();
    };

    const handlePointerDown = () => {
      inputMode.current = 'pointer';
      hideTooltip();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') inputMode.current = 'keyboard';
      if (event.key === 'Escape') hideTooltip();
    };

    const handleFocusIn = (event) => {
      if (inputMode.current !== 'keyboard') return;
      const target = getTooltipTarget(event.target);
      if (!target) return;
      const text = prepareTooltipTarget(target);
      if (!text) return;

      const rect = target.getBoundingClientRect();
      const placeAbove = rect.bottom + 58 > window.innerHeight;
      activeTarget.current = target;
      connectDescription(target);
      setTooltip({
        text,
        mode: 'focus',
        x: Math.min(Math.max(rect.left + rect.width / 2, 24), window.innerWidth - 24),
        y: placeAbove ? rect.top - 10 : rect.bottom + 10,
        vertical: placeAbove ? 'above' : 'below',
        align: 'center'
      });
    };

    const handleFocusOut = (event) => {
      if (activeTarget.current === event.target) hideTooltip();
    };

    document.addEventListener('pointerover', handlePointerOver, true);
    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerout', handlePointerOut, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('mouseover', handlePointerOver, true);
    document.addEventListener('mousemove', handlePointerMove, true);
    document.addEventListener('mouseout', handlePointerOut, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('blur', hideTooltip);

    return () => {
      document.removeEventListener('pointerover', handlePointerOver, true);
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerout', handlePointerOut, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('mouseover', handlePointerOver, true);
      document.removeEventListener('mousemove', handlePointerMove, true);
      document.removeEventListener('mouseout', handlePointerOut, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('blur', hideTooltip);
      disconnectDescription();
      if (animationFrame.current) window.cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  if (!tooltip || typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="admin-dashboard-tooltip"
      className={`admin-tooltip-layer is-${tooltip.align} is-${tooltip.vertical}`}
      style={{ left: tooltip.x, top: tooltip.y }}
      role="tooltip"
    >
      <div className="admin-tooltip">
        {tooltip.text}
      </div>
    </div>,
    document.body
  );
}
