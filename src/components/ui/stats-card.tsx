import { ReactNode } from 'react';
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

export function StatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  variant = 'default',
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-xl p-6 shadow-card border border-border/50 card-hover',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <p className={cn(
              'text-sm font-medium mt-2',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-muted-foreground ml-1">dari bulan lalu</span>
            </p>
          )}
        </div>
        <div className={cn(
          'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',
          variantStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
