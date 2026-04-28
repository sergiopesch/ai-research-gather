import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-fit rounded-lg bg-muted p-4">
          <AlertTriangle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-medium text-foreground">Page not found</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          This route does not exist.
        </p>
        <Button asChild className="comet-button">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Back home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
