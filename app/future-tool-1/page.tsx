'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function FutureTool1Page() {
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Future Tool 1</h1>
          <div className="bg-card rounded-lg p-8 border border-border">
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Future Tool 1</h2>
              <p className="text-muted-foreground mb-4">This tool is coming soon!</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                A new professional tool is currently under development. 
                Check back soon for exciting new features and capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
