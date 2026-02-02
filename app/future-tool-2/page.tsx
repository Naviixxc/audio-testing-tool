'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function FutureTool2Page() {
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Future Tool 2</h1>
          <div className="bg-card rounded-lg p-8 border border-border">
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Future Tool 2</h2>
              <p className="text-muted-foreground mb-4">This tool is coming soon!</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Another innovative tool is being developed to enhance your workflow. 
                Stay tuned for more details and release information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
