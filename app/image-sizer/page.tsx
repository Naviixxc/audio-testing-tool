'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function ImageSizerPage() {
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Image Sizer</h1>
          <div className="bg-card rounded-lg p-8 border border-border">
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Image Sizer Tool</h2>
              <p className="text-muted-foreground mb-4">This tool is coming soon!</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Resize, compress, and optimize your images with professional tools. 
                Support for multiple formats and batch processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
