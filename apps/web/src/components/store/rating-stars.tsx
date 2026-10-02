import * as React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number; // 0 to 5
  reviewCount?: number;
  size?: 'sm' | 'default' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function RatingStars({
  rating,
  reviewCount,
  size = 'default',
  showCount = true,
  className,
}: RatingStarsProps) {
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center text-[#FFB020]">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={iconSize} className="fill-[#FFB020] text-[#FFB020]" />
        ))}
        {hasHalfStar && (
          <StarHalf key="half" size={iconSize} className="fill-[#FFB020] text-[#FFB020]" />
        )}
        {Array.from({ length: Math.max(0, emptyStars) }).map((_, i) => (
          <Star key={`empty-${i}`} size={iconSize} className="text-muted-foreground/40" />
        ))}
      </div>
      {showCount && reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground font-medium ml-1">({reviewCount})</span>
      )}
    </div>
  );
}
