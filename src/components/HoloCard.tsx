import React, { ReactNode } from 'react';
import { ScanLine } from 'lucide-react';

interface HoloCardProps {
  children: ReactNode;
  className?: string;
  showScan?: boolean;
}

export const HoloCard: React.FC<HoloCardProps> = ({
  children,
  className = '',
  showScan = false
}) => {
  return (
    <div className={`holo-card p-6 ${className}`}>
      {showScan && <div className="scan-line" />}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface HoloSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const HoloSection: React.FC<HoloSectionProps> = ({
  title,
  icon,
  children,
  className = ''
}) => {
  return (
    <HoloCard className={`mb-6 ${className}`} showScan>
      <div className="flex items-center gap-3 mb-4">
        {icon && <span className="text-holo-cyan">{icon}</span>}
        <h3 className="text-lg font-semibold holo-text">{title}</h3>
      </div>
      {children}
    </HoloCard>
  );
};
