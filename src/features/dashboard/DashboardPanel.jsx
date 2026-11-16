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
      className={`dashboard-card ${className}`}
      aria-labelledby={titleId}
    >
      <header className="dashboard-card-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {extra}
      </header>
      {children}
    </motion.section>
  );
}
