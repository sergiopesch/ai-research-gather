interface PaperCardSkeletonProps {
  index?: number;
}

const PaperCardSkeleton = ({ index = 0 }: PaperCardSkeletonProps) => {
  return (
    <div
      className="animate-pulse border-b border-stone-200 py-8"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'backwards',
      }}
      aria-hidden="true"
    >
      <div className="h-3 w-48 rounded bg-stone-200" />
      <div className="mt-4 h-7 w-11/12 rounded bg-stone-200" />
      <div className="mt-2 h-7 w-3/5 rounded bg-stone-200" />
      <div className="mt-4 h-3 w-44 rounded bg-stone-200" />
      <div className="mt-5 space-y-2">
        <div className="h-4 w-full rounded bg-stone-200" />
        <div className="h-4 w-5/6 rounded bg-stone-200" />
      </div>
      <div className="mt-6 h-11 w-32 rounded-md bg-stone-200" />
    </div>
  );
};

export const PaperGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <PaperCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
};
