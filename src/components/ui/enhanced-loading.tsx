/**
 * Enhanced Loading States with Performance Tracking
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { performanceMonitor } from '@/lib/performance';
import { CONFIG } from '@/lib/constants';

interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  showAfterDelay?: boolean;
  component?: string; // For performance tracking
}

export const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
  showAfterDelay = true,
  component
}) => {
  const [shouldShow, setShouldShow] = React.useState(!showAfterDelay);
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    if (showAfterDelay) {
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, CONFIG.APP.UI.LOADING_DELAY);

      return () => clearTimeout(timer);
    }
  }, [showAfterDelay]);

  React.useEffect(() => {
    // Track loading time when component unmounts
    return () => {
      if (component) {
        const loadingTime = Date.now() - startTime.current;
        performanceMonitor.recordMetric('loading_duration', loadingTime, {
          component,
          text
        });
      }
    };
  }, [component, text]);

  if (!shouldShow) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-muted border-t-primary',
            sizeClasses[size]
          )}
          role="status"
          aria-label="Loading"
        />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Loading overlay with backdrop
 */
export const LoadingOverlay: React.FC<{ 
  text?: string; 
  component?: string;
  transparent?: boolean;
}> = ({ 
  text = 'Loading...', 
  component,
  transparent = false 
}) => (
  <div className={cn(
    'fixed inset-0 z-50 flex items-center justify-center',
    transparent ? 'bg-background/50' : 'bg-background/80 backdrop-blur-sm'
  )}>
    <EnhancedLoadingSpinner 
      size="lg" 
      text={text} 
      component={component}
      showAfterDelay={false}
    />
  </div>
);

/**
 * Page-level loading with skeleton option
 */
export const PageLoading: React.FC<{ 
  text?: string; 
  component?: string;
  skeleton?: boolean;
}> = ({ 
  text = 'Loading...', 
  component,
  skeleton = false 
}) => {
  if (skeleton) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-[400px] flex items-center justify-center">
      <EnhancedLoadingSpinner 
        size="lg" 
        text={text} 
        component={component}
      />
    </div>
  );
};

/**
 * Button loading state
 */
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({
  isLoading,
  children,
  loadingText,
  className,
  disabled,
  onClick
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors',
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
      )}
      {isLoading ? (loadingText || 'Loading...') : children}
    </button>
  );
};

/**
 * Smart loading component that shows different states
 */
export const SmartLoading: React.FC<{
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  component?: string;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}> = ({
  isLoading,
  error,
  isEmpty,
  component,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent
}) => {
  if (error) {
    return errorComponent || (
      <div className="text-center py-8">
        <p className="text-destructive">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return loadingComponent || (
      <EnhancedLoadingSpinner 
        size="lg" 
        text="Loading..." 
        component={component}
      />
    );
  }

  if (isEmpty) {
    return emptyComponent || (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }

  return <>{children}</>;
};

export default EnhancedLoadingSpinner;