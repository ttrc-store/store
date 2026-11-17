'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';
import type { CADViewerProps } from './cad-viewer';

export const CADViewerDynamic = dynamic(
  () => import('./cad-viewer').then((mod) => mod.CADViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[460px] bg-[#F7F7F8] border border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[#E3132A] animate-spin mb-2" />
        <span className="text-sm font-medium text-slate-600">Initializing 3D Viewport...</span>
      </div>
    ),
  }
);
