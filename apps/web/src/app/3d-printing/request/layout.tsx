import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free STL Viewer & Free STEP Viewer Online | Instant 3D CAD Inspection | TTRC Store',
  description:
    'Free online 3D STL & STEP viewer. Upload your CAD file to inspect in 3D WebGL, verify dimensions in mm, cm, or inch, calculate volume, check watertight manifold mesh status, and request precision FDM 3D printing across India.',
  keywords: [
    'free stl viewer',
    'free step view',
    'free step viewer',
    'view stl online free',
    'free online cad viewer',
    'step file viewer online',
    '3d model viewer online',
    'good quality 3d printing',
    'best 3d printing',
    'online 3d print quotation',
    'measure stl dimensions online',
    'watertight stl check',
    '3d printing india',
  ],
  alternates: {
    canonical: 'https://www.ttrc.store/3d-printing/request',
  },
  openGraph: {
    title: 'Free STL Viewer & Free STEP Viewer Online | TTRC Store',
    description:
      'Upload and inspect your STL or STEP engineering designs in 3D WebGL with instant dimensional analysis, mesh validation, and custom 3D printing quotation.',
    url: 'https://www.ttrc.store/3d-printing/request',
    siteName: 'TTRC Store - Tamizh Tech',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free STL Viewer & Free STEP Viewer Online',
    description:
      'Inspect 3D CAD geometry for free in your browser and order good quality 3D prints across India.',
  },
};

export default function CADRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
