interface PaperCardSkeletonProps {
  index?: number;
}

export const PaperCardSkeleton = ({ index = 0 }: PaperCardSkeletonProps) => {
  return (
    <div
      className="paper-card animate-pulse"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'backwards'
      }}
    >
      <div className="space-y-5">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 bg-neutral-100 rounded-md w-24 skeleton-shimmer" />
              <div className="h-4 bg-neutral-100 rounded w-10 skeleton-shimmer" />
            </div>
            <div className="h-5 bg-neutral-100 rounded-md w-4/5 skeleton-shimmer" />
            <div className="h-5 bg-neutral-100 rounded-md w-2/3 skeleton-shimmer" />
          </div>
          <div className="w-10 h-10 bg-neutral-100 rounded-lg skeleton-shimmer" />
        </div>

        {/* Metadata skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-4 bg-neutral-100 rounded w-20 skeleton-shimmer" />
          <div className="h-4 bg-neutral-100 rounded w-28 skeleton-shimmer" />
        </div>

        {/* Summary skeleton */}
        <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
          <div className="h-4 bg-neutral-100 rounded w-full skeleton-shimmer" />
          <div className="h-4 bg-neutral-100 rounded w-full skeleton-shimmer" />
          <div className="h-4 bg-neutral-100 rounded w-2/3 skeleton-shimmer" />
        </div>

        {/* Buttons skeleton */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-10 bg-neutral-100 rounded-lg flex-1 sm:flex-none sm:w-36 skeleton-shimmer" />
          <div className="h-10 bg-neutral-100 rounded-lg w-20 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const PaperGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <PaperCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
};
