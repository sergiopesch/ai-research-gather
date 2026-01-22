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
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 bg-slate-100 rounded-full w-28 skeleton-shimmer" />
              <div className="h-4 bg-slate-100 rounded w-12 skeleton-shimmer" style={{ animationDelay: '50ms' }} />
            </div>
            <div className="h-7 bg-slate-100 rounded-lg w-4/5 skeleton-shimmer" style={{ animationDelay: '100ms' }} />
            <div className="h-7 bg-slate-100 rounded-lg w-2/3 skeleton-shimmer" style={{ animationDelay: '150ms' }} />
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-xl skeleton-shimmer" style={{ animationDelay: '100ms' }} />
        </div>

        {/* Metadata skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-5 bg-slate-100 rounded w-24 skeleton-shimmer" style={{ animationDelay: '200ms' }} />
          <div className="h-5 bg-slate-100 rounded w-32 skeleton-shimmer" style={{ animationDelay: '250ms' }} />
        </div>

        {/* Summary skeleton */}
        <div className="bg-slate-50 p-5 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg skeleton-shimmer" style={{ animationDelay: '300ms' }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full skeleton-shimmer" style={{ animationDelay: '350ms' }} />
              <div className="h-4 bg-slate-100 rounded w-full skeleton-shimmer" style={{ animationDelay: '400ms' }} />
              <div className="h-4 bg-slate-100 rounded w-3/4 skeleton-shimmer" style={{ animationDelay: '450ms' }} />
            </div>
          </div>
        </div>

        {/* Buttons skeleton */}
        <div className="flex items-center gap-3 pt-2">
          <div className="h-12 bg-slate-100 rounded-xl flex-1 sm:flex-none sm:w-44 skeleton-shimmer" style={{ animationDelay: '500ms' }} />
          <div className="h-12 bg-slate-100 rounded-xl w-32 skeleton-shimmer" style={{ animationDelay: '550ms' }} />
        </div>
      </div>
    </div>
  );
};

export const PaperGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <PaperCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
};
