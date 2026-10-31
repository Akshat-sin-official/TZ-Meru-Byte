/**
 * Post-Hire Smart Prompt
 * 
 * Shows immediately after engagement confirmation to prompt adding another service
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, ArrowRight } from 'lucide-react';

interface PostHirePromptProps {
  onAddService: () => void;
  onSkip: () => void;
}

const PostHirePrompt = ({ onAddService, onSkip }: PostHirePromptProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <Card className="max-w-md w-full border-2 border-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Need help with another marketing service?</CardTitle>
          <CardDescription>
            This won't affect your current engagement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You're in execution mindset and trust is highest right after success. Add another service to streamline your marketing needs.
          </p>
          <div className="flex gap-3">
            <Button onClick={onAddService} className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              Add another service
            </Button>
            <Button onClick={onSkip} variant="outline" className="flex-1">
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostHirePrompt;

