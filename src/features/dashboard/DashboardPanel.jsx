import { motion } from 'framer-motion';
import { panelEntrance } from '../../utils/panelMotion.js';

export default function DashboardPanel({
  title,
  titleId,
  subtitle,
  extra,
  className = '',
  delay = 0,
  children,
}) {
  return (
    <motion.section
      {...panelEntrance({ delay })}
      className={`flex min-w-0 flex-col rounded-dashboard-panel border border-dashboard-border bg-dashboard-surface p-dashboard-panel shadow-dashboard-panel ${className}`}
      aria-labelledby={titleId}
    >
      <header className="mb-4 flex shrink-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-dashboard-divider pb-3.5 [&>span]:mt-[7px] [&>span]:text-[11px] [&>span]:leading-[1.6] [&>span]:text-dashboard-muted">
        <div>
          <h2 id={titleId} className="m-0 text-lg/[1.4] font-bold text-dashboard-heading">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-[7px] text-[11px] leading-[1.6] text-dashboard-muted">{subtitle}</p>
          )}
        </div>
        {extra}
      </header>
      {children}
    </motion.section>
  );
}
