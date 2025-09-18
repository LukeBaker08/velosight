/**
 * Reusable InfoCard component for displaying key-value information
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  className,
  variant = 'default'
}) => {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className={cn(
        variant === 'compact' ? 'pb-2' : 'pb-3'
      )}>
        <CardTitle className={cn(
          'flex items-center gap-2',
          variant === 'compact' ? 'text-sm font-medium text-muted-foreground' : 'text-lg'
        )}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={variant === 'compact' ? 'pt-0' : undefined}>
        <div className={cn(
          'font-bold',
          variant === 'compact' ? 'text-2xl' : 'text-3xl'
        )}>
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default InfoCard;