interface PaperCardSkeletonProps {
  index?: number;
}

export const PaperCardSkeleton = ({ index = 0 }: PaperCardSkeletonProps) => {
  return (
    <div
      className="paper-card animate-pulse"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'backwards'
      }}
    >
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted rounded-lg w-3/4 skeleton-shimmer" />
            <div className="h-6 bg-muted rounded-lg w-1/2 skeleton-shimmer" style={{ animationDelay: '100ms' }} />
          </div>
          <div className="w-12 h-12 bg-muted rounded-xl skeleton-shimmer" style={{ animationDelay: '150ms' }} />
        </div>

        {/* Metadata skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-7 bg-muted rounded-md w-32 skeleton-shimmer" style={{ animationDelay: '200ms' }} />
          <div className="h-4 bg-muted rounded w-20 skeleton-shimmer" style={{ animationDelay: '250ms' }} />
          <div className="h-4 bg-muted rounded w-24 skeleton-shimmer" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Summary skeleton */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full skeleton-shimmer" style={{ animationDelay: '350ms' }} />
            <div className="h-4 bg-muted rounded w-full skeleton-shimmer" style={{ animationDelay: '400ms' }} />
            <div className="h-4 bg-muted rounded w-2/3 skeleton-shimmer" style={{ animationDelay: '450ms' }} />
          </div>
          <div className="h-4 bg-muted rounded w-1/2 skeleton-shimmer" style={{ animationDelay: '500ms' }} />
        </div>

        {/* Authors skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded skeleton-shimmer" style={{ animationDelay: '550ms' }} />
          <div className="h-4 bg-muted rounded w-48 skeleton-shimmer" style={{ animationDelay: '600ms' }} />
        </div>

        {/* Buttons skeleton */}
        <div className="flex items-center gap-4 pt-4">
          <div className="h-12 bg-muted rounded-lg flex-1 sm:flex-none sm:w-40 skeleton-shimmer" style={{ animationDelay: '650ms' }} />
          <div className="h-12 bg-muted rounded-lg w-32 skeleton-shimmer" style={{ animationDelay: '700ms' }} />
        </div>
      </div>
    </div>
  );
};

export const PaperGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="space-y-8">
      {Array.from({ length: count }).map((_, index) => (
        <PaperCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
};
