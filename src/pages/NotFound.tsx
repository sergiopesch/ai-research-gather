import { Link } from "@/components/Link";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-fit rounded-full border border-stone-200 bg-white p-4">
          <AlertTriangle className="h-7 w-7 text-stone-700" />
        </div>
        <h1 className="mb-3 font-editorial text-4xl text-stone-950">Page not found</h1>
        <p className="mb-8 text-sm text-stone-500">
          This route does not exist.
        </p>
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-stone-950 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-800">
          <Home className="h-4 w-4" />
          Back home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
