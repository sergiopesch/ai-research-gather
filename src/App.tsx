import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ResearchPaperFinder from '@/components/ResearchPaperFinder';
import { usePathname } from "@/lib/navigation";
import NotFound from "./pages/NotFound";

const ProcessingHub = lazy(() => import('./pages/ProcessingHub'));

const studioFallback = (
  <main className="min-h-screen bg-[#fbfaf7] px-5 py-16" aria-busy="true" aria-label="Opening conversation studio">
    <div className="mx-auto max-w-7xl animate-pulse border-t border-stone-200 pt-8">
      <div className="h-4 w-28 rounded bg-stone-200" />
      <div className="mt-5 h-10 max-w-lg rounded bg-stone-100" />
    </div>
  </main>
);

const App = () => {
  const pathname = usePathname();
  const page = pathname === '/'
    ? <ResearchPaperFinder />
    : pathname === '/processing'
      ? <Suspense fallback={studioFallback}><ProcessingHub /></Suspense>
      : <NotFound />;

  return <ErrorBoundary><Toaster />{page}</ErrorBoundary>;
};

export default App;
