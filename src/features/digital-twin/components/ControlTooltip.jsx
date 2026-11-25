import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { uiClass } from '../../../styles/interfaceStyles.js';
import { tooltipSurface } from './uiStyles.js';

export default function ControlTooltip({ rootRef }) {
  const [tooltip, setTooltip] = useState(null);
  const tooltipId = useId();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let activeButton;
    let previousDescription;
    const close = () => {
      if (activeButton) {
        activeButton.title = activeButton.dataset.controlTooltip;
        delete activeButton.dataset.controlTooltip;
        if (previousDescription === null) activeButton.removeAttribute('aria-describedby');
        else activeButton.setAttribute('aria-describedby', previousDescription);
        activeButton = null;
      }
      setTooltip(null);
    };
    const show = event => {
      const button = event.target.closest?.('[role="toolbar"] button');
      if (!button || !root.contains(button) || button.disabled || button === activeButton) return;
      const label = button.title;
      if (!label) return;
      close();
      activeButton = button;
      previousDescription = button.getAttribute('aria-describedby');
      button.dataset.controlTooltip = label;
      button.removeAttribute('title');
      button.setAttribute('aria-describedby', tooltipId);
      const rect = button.getBoundingClientRect();
      const side = rect.left < 100 ? 'right' : 'top';
      setTooltip({
        label,
        description: button.dataset.tooltipDescription,
        side,
        x: side === 'right' ? rect.right + 14 : rect.left + rect.width / 2,
        y: side === 'right' ? rect.top + rect.height / 2 : rect.top - 24,
      });
    };
    const leave = event => {
      if (activeButton?.contains(event.target) && !activeButton.contains(event.relatedTarget))
        close();
    };
    const escape = event => {
      if (event.key === 'Escape') close();
    };
    root.addEventListener('pointerover', show);
    root.addEventListener('focusin', show);
    root.addEventListener('pointerout', leave);
    root.addEventListener('focusout', leave);
    root.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', close);
    root.addEventListener('scroll', close, true);
    return () => {
      close();
      root.removeEventListener('pointerover', show);
      root.removeEventListener('focusin', show);
      root.removeEventListener('pointerout', leave);
      root.removeEventListener('focusout', leave);
      root.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', close);
      root.removeEventListener('scroll', close, true);
    };
  }, [rootRef, tooltipId]);

  if (!tooltip) return null;
  return createPortal(
    <div
      id={tooltipId}
      role="tooltip"
      className={uiClass(`${tooltipSurface} fixed z-[200] max-w-[360px]`)}
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: tooltip.side === 'right' ? 'translateY(-50%)' : 'translate(-50%, -100%)',
      }}
    >
      <div>{tooltip.label}</div>
      {tooltip.description && (
        <div className={uiClass('mt-[5px] text-[13px] font-normal leading-relaxed text-[#b8cce3]')}>
          {tooltip.description}
        </div>
      )}
    </div>,
    document.body
  );
}
