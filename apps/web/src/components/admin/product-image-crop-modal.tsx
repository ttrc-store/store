'use client';

import * as React from 'react';
import {
  Crop,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface CropModalResult {
  file: File;
  fitMode: 'fit' | 'fill' | 'original';
  crop?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  targetWidth: number;
  targetHeight: number;
}

interface ProductImageCropModalProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: CropModalResult) => void;
}

export function ProductImageCropModal({
  file,
  isOpen,
  onClose,
  onConfirm,
}: ProductImageCropModalProps) {
  const [fitMode, setFitMode] = React.useState<'fit' | 'fill' | 'original'>('fit');
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = React.useState(0);
  const [naturalHeight, setNaturalHeight] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Load image object URL when file changes
  React.useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      // If image is already 16:9 within 2% margin, set fill by default; otherwise fit
      const ratio = img.naturalWidth / img.naturalHeight;
      const isAlready16by9 = Math.abs(ratio - 16 / 9) < 0.05;
      setFitMode(isAlready16by9 ? 'fill' : 'fit');
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!isOpen || !file || !imageSrc) return null;

  const currentRatio = naturalHeight > 0 ? (naturalWidth / naturalHeight).toFixed(2) : '1.0';
  const is16by9 = Math.abs(naturalWidth / naturalHeight - 16 / 9) < 0.05;
  const isClippedWarning =
    fitMode === 'fill' && !is16by9;

  // Handle Pan Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (fitMode !== 'fill') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || fitMode !== 'fill') return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleSave = () => {
    // If fill mode with manual zoom/pan, calculate crop relative to natural dimensions
    let crop: CropModalResult['crop'] = undefined;
    if (fitMode === 'fill' && naturalWidth > 0 && naturalHeight > 0) {
      const targetAspect = 16 / 9;
      const sourceAspect = naturalWidth / naturalHeight;

      let cropW = naturalWidth;
      let cropH = naturalHeight;

      if (sourceAspect > targetAspect) {
        // Image is wider than 16:9; crop the sides
        cropW = naturalHeight * targetAspect;
        cropH = naturalHeight;
      } else {
        // Image is taller than 16:9; crop top/bottom
        cropW = naturalWidth;
        cropH = naturalWidth / targetAspect;
      }

      // Apply zoom & pan offsets
      const effectiveW = cropW / zoom;
      const effectiveH = cropH / zoom;

      const maxPanX = (naturalWidth - effectiveW) / 2;
      const maxPanY = (naturalHeight - effectiveH) / 2;

      // Normalize pan coordinates
      const normPanX = Math.max(-maxPanX, Math.min(maxPanX, (panX / 100) * naturalWidth * 0.2));
      const normPanY = Math.max(-maxPanY, Math.min(maxPanY, (panY / 100) * naturalHeight * 0.2));

      const left = Math.max(0, Math.min(naturalWidth - effectiveW, (naturalWidth - effectiveW) / 2 - normPanX));
      const top = Math.max(0, Math.min(naturalHeight - effectiveH, (naturalHeight - effectiveH) / 2 - normPanY));

      crop = {
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(effectiveW),
        height: Math.round(effectiveH),
      };
    }

    onConfirm({
      file,
      fitMode,
      crop,
      targetWidth: naturalWidth >= 1920 ? 2560 : Math.max(1280, naturalWidth),
      targetHeight: naturalHeight >= 1080 ? 1440 : Math.max(720, Math.round(naturalWidth * (9 / 16))),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 sm:p-6"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="crop-modal-title" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Crop size={16} className="text-[#844AFB]" />
              Standard 16:9 Product Canvas Editor (2560 × 1440)
            </h2>
            <p className="text-[11px] text-slate-500">
              Source: <span className="font-mono font-bold text-slate-700">{file.name}</span> ({naturalWidth} × {naturalHeight}px • Aspect: {currentRatio}:1)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel and close editor"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fit Mode */}
            <button
              type="button"
              onClick={() => {
                setFitMode('fit');
                handleReset();
              }}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                fitMode === 'fit'
                  ? 'border-[#844AFB] bg-purple-50/50 shadow-xs ring-2 ring-purple-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Maximize2 size={14} className={fitMode === 'fit' ? 'text-[#844AFB]' : 'text-slate-400'} />
                  Fit (Preserve All Details)
                </span>
                {fitMode === 'fit' && (
                  <Badge className="bg-[#844AFB] text-white text-[9px] font-bold">Recommended</Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Preserves 100% of the product. Zero cropping. Centers on light canvas in standard 16:9 frame.
              </p>
            </button>

            {/* Fill / Crop Mode */}
            <button
              type="button"
              onClick={() => setFitMode('fill')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                fitMode === 'fill'
                  ? 'border-[#844AFB] bg-purple-50/50 shadow-xs ring-2 ring-purple-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Crop size={14} className={fitMode === 'fill' ? 'text-[#844AFB]' : 'text-slate-400'} />
                  Fill / Crop (16:9 Canvas)
                </span>
                {fitMode === 'fill' && (
                  <Badge className="bg-[#844AFB] text-white text-[9px] font-bold">16:9 Full</Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Fills the entire 16:9 frame. Adjust pan and zoom below to frame the subject precisely.
              </p>
            </button>

            {/* Original Mode */}
            <button
              type="button"
              onClick={() => {
                setFitMode('original');
                handleReset();
              }}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                fitMode === 'original'
                  ? 'border-[#844AFB] bg-purple-50/50 shadow-xs ring-2 ring-purple-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ImageIcon size={14} className={fitMode === 'original' ? 'text-[#844AFB]' : 'text-slate-400'} />
                  Keep Original Dimensions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Leaves source pixel dimensions as-is ({naturalWidth}×{naturalHeight}), converting to lossless WebP only.
              </p>
            </button>
          </div>

          {/* Warning Banner if Fill mode would clip important product areas */}
          {isClippedWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Attention:</strong> This image aspect ratio ({currentRatio}:1) is not 16:9. Using Fill mode will crop edges of the image. Use pan/zoom controls to inspect framing, or switch to <strong>Fit</strong> to display the complete product without cropping.
              </div>
            </div>
          )}

          {/* Interactive 16:9 Canvas Frame */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Canvas Framing Preview:</span>
              <span className="font-mono text-[11px] text-slate-500">
                Target: {naturalWidth >= 1920 ? '2560 × 1440' : `${naturalWidth} × ${Math.round(naturalWidth * 9/16)}`} • 16:9 Ratio
              </span>
            </div>

            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative aspect-[16/9] w-full max-h-[380px] bg-white rounded-xl border-2 border-dashed border-purple-300 overflow-hidden flex items-center justify-center select-none shadow-inner ${
                fitMode === 'fill' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
            >
              {/* 16:9 Frame Overlay Guidelines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20 opacity-20">
                <div className="border-r border-b border-purple-900" />
                <div className="border-r border-b border-purple-900" />
                <div className="border-b border-purple-900" />
                <div className="border-r border-b border-purple-900" />
                <div className="border-r border-b border-purple-900" />
                <div className="border-b border-purple-900" />
                <div className="border-r border-purple-900" />
                <div className="border-r border-purple-900" />
                <div />
              </div>

              {/* Rendered Image */}
              {fitMode === 'fit' && (
                <img
                  src={imageSrc}
                  alt="Fit preview"
                  className="max-w-full max-h-full object-contain p-3 pointer-events-none drop-shadow-xs"
                />
              )}

              {fitMode === 'fill' && (
                <img
                  src={imageSrc}
                  alt="Fill preview"
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                />
              )}

              {fitMode === 'original' && (
                <img
                  src={imageSrc}
                  alt="Original preview"
                  className="max-w-full max-h-full object-contain p-2 pointer-events-none"
                />
              )}

              {/* Safe Area Watermark Badge */}
              <div className="absolute bottom-2.5 right-2.5 z-30 pointer-events-none bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-xs">
                {fitMode === 'fit' ? '100% Complete Product • Fit Contain' : fitMode === 'fill' ? '16:9 Landscape Fill' : 'Original Ratio'}
              </div>
            </div>
          </div>

          {/* Pan & Zoom Controls (Enabled for Fill/Crop mode) */}
          {fitMode === 'fill' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ZoomIn size={14} className="text-[#844AFB]" /> Zoom:
                </span>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-32 accent-[#844AFB]"
                />
                <span className="font-mono text-slate-500">{zoom.toFixed(2)}x</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 italic">Drag image in preview to pan/reposition</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw size={12} />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Output format: <strong className="text-slate-800">Lossless WebP (lossless: true)</strong> • No degradation
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-9 px-4 text-xs font-bold bg-[#844AFB] hover:bg-[#6721F2] text-white shadow-xs gap-1.5"
            >
              <Check size={14} />
              Confirm &amp; Convert Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
