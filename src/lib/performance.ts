/**
 * Application Performance Monitoring and Analytics
 */

import React from 'react';
import { CONFIG } from './config';
import { handleError } from './errors';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface UserAction {
  action: string;
  component?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private userActions: UserAction[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = CONFIG.APP.FEATURES.ANALYTICS;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log significant performance issues
    if (this.isSlowOperation(name, value)) {
      console.warn(`Slow operation detected: ${name} took ${value}ms`, context);
    }
  }

  /**
   * Record user action for analytics
   */
  recordUserAction(action: string, component?: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const userAction: UserAction = {
      action,
      component,
      timestamp: Date.now(),
      metadata
    };

    this.userActions.push(userAction);

    // Keep only last 50 actions
    if (this.userActions.length > 50) {
      this.userActions = this.userActions.slice(-50);
    }
  }

  /**
   * Measure the execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, { ...context, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Measure synchronous function execution
   */
  measure<T>(
    name: string, 
    fn: () => T, 
    context?: Record<string, any>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, { ...context, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    if (!this.isEnabled) return null;

    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000); // Last 5 minutes
    const recentActions = this.userActions.filter(a => now - a.timestamp < 5 * 60 * 1000);

    return {
      timestamp: now,
      metrics: {
        total: recentMetrics.length,
        average: recentMetrics.length > 0 ? 
          recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length : 0,
        slowOperations: recentMetrics.filter(m => this.isSlowOperation(m.name, m.value)).length
      },
      userActions: {
        total: recentActions.length,
        uniqueActions: new Set(recentActions.map(a => a.action)).size,
        components: new Set(recentActions.map(a => a.component).filter(Boolean)).size
      },
      topSlowOperations: recentMetrics
        .filter(m => this.isSlowOperation(m.name, m.value))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(m => ({ name: m.name, duration: m.value, context: m.context }))
    };
  }

  /**
   * Clear all stored data
   */
  clear() {
    this.metrics = [];
    this.userActions = [];
  }

  private isSlowOperation(name: string, value: number): boolean {
    // Define thresholds for different types of operations
    const thresholds = {
      'api_call': 3000,      // 3 seconds
      'file_upload': 10000,  // 10 seconds
      'analysis': 30000,     // 30 seconds
      'database_query': 2000, // 2 seconds
      'page_load': 2000,     // 2 seconds
      'component_render': 100 // 100ms
    };

    const threshold = Object.entries(thresholds).find(([key]) => 
      name.toLowerCase().includes(key)
    )?.[1] || 1000; // Default 1 second

    return value > threshold;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const trackUserAction = (action: string, component?: string, metadata?: Record<string, any>) => {
  performanceMonitor.recordUserAction(action, component, metadata);
};

export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.measureAsync(name, fn, context);
};

// Page load performance tracking
export const trackPageLoad = (pageName: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigationTiming) {
      const loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
      const domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart;
      
      performanceMonitor.recordMetric('page_load', loadTime, {
        page: pageName,
        domContentLoaded,
        type: navigationTiming.type
      });
    }
  }
};

// Component render performance (for development)
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  if (!CONFIG.ENV.IS_DEVELOPMENT) {
    return Component;
  }

  return React.memo((props: P) => {
    const startTime = React.useRef<number>();
    
    React.useLayoutEffect(() => {
      startTime.current = performance.now();
    });
    
    React.useEffect(() => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        performanceMonitor.recordMetric('component_render', renderTime, {
          component: componentName
        });
      }
    });
    
    return React.createElement(Component, props);
  });
};
