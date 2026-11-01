'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Tag } from 'lucide-react';

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  href: string;
  offerPrice: string;
  regularPrice: string;
  badge: string;
}

const BANNERS: BannerSlide[] = [
  {
    id: 'diwali-lf-6-0',
    image: '/banners/special-offer-1.png',
    title: 'TTRC LF 6.0 Line Follower Robot (Without Battery)',
    href: '/product/ttrc-lfr-6-0',
    offerPrice: '₹2,999',
    regularPrice: '₹3,799',
    badge: 'Diwali Special Offer',
  },
  {
    id: 'diwali-lf-6-0-pro',
    image: '/banners/special-offer-2.png',
    title: 'TTRC LF-6.0 PRO Line Follower Robot',
    href: '/product/ttrc-lf-6-0-pro-line-follower-robot',
    offerPrice: '₹4,999',
    regularPrice: '₹5,999',
    badge: 'Diwali Special Offer',
  },
  {
    id: 'diwali-line-x-pro',
    image: '/banners/special-offer-3.png',
    title: 'TTRC LINE X PRO Line Follower Robot',
    href: '/product/ttrc-line-x-pro-line-follower-robot',
    offerPrice: '₹8,999',
    regularPrice: '₹10,999',
    badge: 'Diwali Special Offer',
  },
];

const ROTATION_INTERVAL_MS = 3000; // 3 seconds per poster

export function HeroBannerSlider() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);

  // 3-second auto-rotation timer
  React.useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
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

  const currentBanner = BANNERS[currentIndex];

  return (
    <div
      className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] xl:max-w-[490px] mx-auto select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glow matching purple brand */}
      <div
        className="absolute inset-0 rounded-3xl bg-[#844AFB]/20 blur-3xl scale-95 pointer-events-none transition-all duration-700"
        aria-hidden="true"
      />

      {/* Main Poster Frame */}
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
            <Link
              href={currentBanner.href}
              className="block relative w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#844AFB] focus:ring-offset-2 rounded-3xl"
              aria-label={`View ${currentBanner.title} - ${currentBanner.offerPrice}`}
            >
              <Image
                src={currentBanner.image}
                alt={currentBanner.title}
                width={2000}
                height={2000}
                priority={currentIndex === 0}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 340px, (max-width: 1024px) 420px, 490px"
              />

              {/* Click to view hover overlay badge */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white">
                <div className="flex items-center gap-1.5 text-xs font-bold drop-shadow">
                  <Tag size={13} className="text-amber-300" />
                  <span>{currentBanner.offerPrice}</span>
                  <span className="line-through text-slate-300 text-[10px] ml-1">{currentBanner.regularPrice}</span>
                </div>
                <span className="text-[11px] font-bold bg-[#844AFB] text-white px-2.5 py-1 rounded-full shadow-md">
                  Shop Now →
                </span>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous special offer poster"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-[#844AFB] shadow-lg border border-slate-200/80 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#844AFB] cursor-pointer hover:scale-105 active:scale-95 z-10"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next special offer poster"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-[#844AFB] shadow-lg border border-slate-200/80 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#844AFB] cursor-pointer hover:scale-105 active:scale-95 z-10"
        >
          <ChevronRight size={18} />
        </button>

        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-purple-200/90 text-[#6721F2] text-[11px] font-extrabold shadow-md">
            <Sparkles size={12} className="text-[#844AFB] animate-pulse" />
            <span>{currentBanner.badge}</span>
          </div>
        </div>

        {/* 3-Second Active Progress & Indicators at Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-md">
          {BANNERS.map((banner, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}: ${banner.title}`}
                className={`relative h-2 rounded-full transition-all duration-300 overflow-hidden cursor-pointer ${
                  isActive ? 'w-7 bg-white/40' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    key={`progress-${currentIndex}-${isPaused ? 'paused' : 'playing'}`}
                    className="absolute inset-y-0 left-0 bg-[#844AFB] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: isPaused ? '0%' : '100%' }}
                    transition={{
                      duration: ROTATION_INTERVAL_MS / 1000,
                      ease: 'linear',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
