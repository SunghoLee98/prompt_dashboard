import React from 'react';
import { Star, Users } from 'lucide-react';
import type { RatingStatistics } from '../../types/rating';
import { StarRating } from './StarRating';

interface RatingDisplayProps {
  statistics: RatingStatistics;
  className?: string;
  showDistribution?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  statistics,
  className = '',
  showDistribution = true,
}) => {
  // Handle both 'totalRatings' and 'ratingCount' field names from API with proper null checks
  const averageRating = statistics?.averageRating ?? 0;
  const totalRatings = statistics?.totalRatings ?? (statistics as any)?.ratingCount ?? 0;
  const distribution = statistics?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return (count / totalRatings) * 100;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      <div className="flex items-start gap-6">
        {/* Average Rating */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 average-rating rating-value" data-testid="average-rating">
            {typeof averageRating === 'number' ? averageRating.toFixed(1) : '0.0'}
          </div>
          <StarRating value={averageRating} readonly size="md" className="mt-2" />
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span className="rating-count total-ratings" data-testid="rating-count">{formatNumber(totalRatings)} 평가</span>
          </div>
        </div>

        {/* Distribution */}
        {showDistribution && totalRatings > 0 && (
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as keyof typeof distribution];
              const percentage = getPercentage(count);
              
              return (
                <div key={star} className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1 min-w-[3rem] text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    aria-label={`${star}점 평가 ${count}개`}
                  >
                    <span>{star}</span>
                    <Star className="h-3 w-3 fill-current" />
                  </button>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300 ease-out"
                      style={{ width: `${percentage}%` }}
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <span className="text-sm text-gray-500 min-w-[3rem] text-right">
                    {count > 0 ? `${percentage.toFixed(0)}%` : '0%'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalRatings === 0 && (
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">아직 평가가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">첫 번째로 평가해보세요!</p>
        </div>
      )}
    </div>
  );
};