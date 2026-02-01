import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  variant = 'default',
  className 
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn(
        'bg-card rounded-xl p-4 sm:p-6 shadow-card border border-border/50 card-hover overflow-hidden',
        className
      )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 text-foreground truncate">{value}</p>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{description}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs sm:text-sm font-medium mt-1 sm:mt-2',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-muted-foreground ml-1">dari bulan lalu</span>
            </p>
          )}
        </div>
        <div className={cn(
          'h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0',
          variantStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';
