'use client';

import React, { useState, useEffect } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function PageTransition({ children, isLoading = false }: PageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (isLoading !== isTransitioning) {
      setIsTransitioning(isLoading);
      
      if (!isLoading) {
        // When loading is complete, show new content with fade
        const timer = setTimeout(() => {
          setDisplayChildren(children);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, isTransitioning, children]);

  useEffect(() => {
    setDisplayChildren(children);
  }, [children]);

  return (
    <div className="relative min-h-full">
      {/* Loading Screen */}
      <div
        className={`absolute inset-0 z-50 flex items-center justify-center bg-background transition-all duration-300 ${
          isTransitioning ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            {/* Loading Spinner */}
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading...</p>
            <p className="text-sm text-muted-foreground">Preparing your tools</p>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div
        className={`transition-all duration-300 ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {displayChildren}
      </div>
    </div>
  );
}
