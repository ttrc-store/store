'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import type { HeroBannerDTO } from '@/actions/banners';

interface HeroBannerSliderProps {
  banners?: HeroBannerDTO[];
}

const FALLBACK_BANNERS: HeroBannerDTO[] = [
  {
    id: 'diwali-lf-6-0',
    mediaUrl: '/banners/special-offer-1.png',
    title: 'TTRC LF 6.0 Line Follower Robot (Without Battery)',
    linkUrl: '/product/ttrc-lfr-6-0',
    offerPrice: '₹2,999',
    regularPrice: '₹3,799',
    type: 'image',
    rotationSeconds: 3,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'diwali-lf-6-0-pro',
    mediaUrl: '/banners/special-offer-2.png',
    title: 'TTRC LF-6.0 PRO Line Follower Robot',
    linkUrl: '/product/ttrc-lf-6-0-pro-line-follower-robot',
    offerPrice: '₹4,999',
    regularPrice: '₹5,999',
    type: 'image',
    rotationSeconds: 3,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'diwali-line-x-pro',
    mediaUrl: '/banners/special-offer-3.png',
    title: 'TTRC LINE X PRO Line Follower Robot',
    linkUrl: '/product/ttrc-line-x-pro-line-follower-robot',
    offerPrice: '₹8,999',
    regularPrice: '₹10,999',
    type: 'image',
    rotationSeconds: 3,
    sortOrder: 3,
    isActive: true,
  },
];

export function HeroBannerSlider({ banners: propBanners }: HeroBannerSliderProps) {
  const banners = propBanners && propBanners.length > 0 ? propBanners : FALLBACK_BANNERS;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);

  const safeIndex = currentIndex < banners.length ? currentIndex : 0;
  const currentBanner = banners[safeIndex];
  const slideDurationMs = (currentBanner?.rotationSeconds || 3) * 1000;

  // Auto-rotation timer (3 seconds or configured duration)
  React.useEffect(() => {
    if (isPaused || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, slideDurationMs);

    return () => clearInterval(timer);
  }, [isPaused, safeIndex, banners.length, slideDurationMs]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  if (!currentBanner) return null;

  const isVideo =
    currentBanner.type === 'video' ||
    currentBanner.mediaUrl.match(/\.(mp4|webm|mov|ogg)$/i) ||
    currentBanner.mediaUrl.includes('youtube.com') ||
    currentBanner.mediaUrl.includes('youtu.be') ||
    currentBanner.mediaUrl.includes('vimeo.com');

  const isEmbedVideo =
    currentBanner.mediaUrl.includes('youtube.com') ||
    currentBanner.mediaUrl.includes('youtu.be') ||
    currentBanner.mediaUrl.includes('vimeo.com');

  const embedUrl = React.useMemo(() => {
    if (!isEmbedVideo) return null;
    const url = currentBanner.mediaUrl;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0`;
    }
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&autopause=0&controls=0`;
    }
    return url;
  }, [currentBanner.mediaUrl, isEmbedVideo]);

  const MediaContent = (
    <div className="relative w-full h-full">
      {isVideo ? (
        isEmbedVideo && embedUrl ? (
          <iframe
            src={embedUrl}
            title={currentBanner.title}
            className="w-full h-full object-cover pointer-events-none border-0"
            allow="autoplay; encrypted-media"
          />
        ) : (
          <video
            src={currentBanner.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        )
      ) : (
        <Image
          src={currentBanner.mediaUrl}
          alt={currentBanner.title}
          width={2000}
          height={2000}
          priority={safeIndex === 0}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 420px, 500px"
        />
      )}

      {/* Hover Information Overlay Bar */}
      {(currentBanner.offerPrice || currentBanner.title) && (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/75 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 text-xs font-bold drop-shadow">
            {currentBanner.offerPrice && (
              <>
                <Tag size={13} className="text-amber-300 shrink-0" />
                <span>{currentBanner.offerPrice}</span>
              </>
            )}
            {currentBanner.regularPrice && (
              <span className="line-through text-slate-300 text-[10px] ml-1">
                {currentBanner.regularPrice}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold bg-[#844AFB] text-white px-2.5 py-1 rounded-full shadow-md shrink-0">
            View Details →
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="relative w-full max-w-[280px] xs:max-w-[330px] sm:max-w-[420px] lg:max-w-[460px] xl:max-w-[500px] mx-auto select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 rounded-3xl bg-[#844AFB]/20 blur-3xl scale-95 pointer-events-none transition-all duration-700"
        aria-hidden="true"
      />

      {/* Main Responsive Poster Frame */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-200/80 shadow-2xl bg-white aspect-square group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative w-full h-full"
          >
            {currentBanner.linkUrl ? (
              <Link
                href={currentBanner.linkUrl}
                className="block relative w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#844AFB] focus:ring-offset-2 rounded-3xl"
                aria-label={`View ${currentBanner.title}`}
              >
                {MediaContent}
              </Link>
            ) : (
              <div className="relative w-full h-full">{MediaContent}</div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Previous Button */}
        {banners.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous promotional banner"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-[#844AFB] shadow-lg border border-slate-200/80 flex items-center justify-center transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#844AFB] cursor-pointer hover:scale-105 active:scale-95 z-10"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Next Button */}
        {banners.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next promotional banner"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-[#844AFB] shadow-lg border border-slate-200/80 flex items-center justify-center transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#844AFB] cursor-pointer hover:scale-105 active:scale-95 z-10"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* 3-Second Active Progress & Dot Indicators at Bottom */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-md">
            {banners.map((banner, index) => {
              const isActive = index === safeIndex;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}: ${banner.title}`}
                  className={`relative h-1.5 sm:h-2 rounded-full transition-all duration-300 overflow-hidden cursor-pointer ${
                    isActive ? 'w-6 sm:w-7 bg-white/40' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      key={`progress-${safeIndex}-${isPaused ? 'paused' : 'playing'}`}
                      className="absolute inset-y-0 left-0 bg-[#844AFB] rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: isPaused ? '0%' : '100%' }}
                      transition={{
                        duration: slideDurationMs / 1000,
                        ease: 'linear',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
