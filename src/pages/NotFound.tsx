import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="premium-card max-w-lg w-full text-center p-12">
        {/* Enhanced 404 illustration */}
        <div className="relative mb-8">
          <div className="p-6 bg-muted rounded-2xl w-fit mx-auto mb-6 shadow-soft">
            <AlertTriangle className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2">
            <div className="p-2 bg-muted rounded-full shadow-soft">
              <div className="w-3 h-3 bg-foreground rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Enhanced content */}
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-heading mb-4">Page Not Found</h2>
        <p className="text-body text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved to a different location.
        </p>
        
        {/* Enhanced action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="comet-button">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="comet-button-secondary">
            <Link to="/processing">
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Studio
            </Link>
          </Button>
        </div>
        
        {/* Helpful hint */}
        <div className="mt-8 pt-6 border-t border-border/30">
          <p className="text-caption">
            If you believe this is an error, please check the URL or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
