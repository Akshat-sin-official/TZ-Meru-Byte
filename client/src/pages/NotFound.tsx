import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, getDashboardPath } = useAuth();

  const dashboardPath = user ? getDashboardPath() : '/';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page <code className="rounded bg-muted-foreground/10 px-2 py-0.5 text-sm font-mono">{location.pathname}</code> doesn't exist or may have been moved.
          </p>

          <div className="rounded-lg border bg-card p-4 text-left text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              This might have happened because:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The URL was typed incorrectly</li>
              <li>The page has been moved or deleted</li>
              <li>You followed an outdated link</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button asChild className="gap-2">
              <Link to={dashboardPath}>
                <Home className="h-4 w-4" />
                {user ? 'Go to Dashboard' : 'Go to Home'}
              </Link>
            </Button>
          </div>

          {!user && (
            <p className="text-sm text-muted-foreground pt-2">
              Looking for something specific?{' '}
              <Link to="/experts" className="text-primary underline hover:text-primary/90">
                Browse Experts
              </Link>
              {' '}or{' '}
              <Link to="/contact" className="text-primary underline hover:text-primary/90">
                Contact Us
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
