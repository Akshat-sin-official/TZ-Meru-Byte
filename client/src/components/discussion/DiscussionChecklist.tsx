/**
 * Discussion Checklist Component
 * 
 * Optional checklist for seekers to track discussion points
 * Visible only to seeker, editable during and after call
 * Now with backend persistence
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Plus, X, Loader2 } from 'lucide-react';
import { updateDiscussionChecklist } from '@/services/discussionService';
import { seekerService } from '@/services/seekerService';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST_ITEMS: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'business_objective', label: 'Business objective clarified' },
  { id: 'scope', label: 'Scope discussed' },
  { id: 'expected_outcomes', label: 'Expected outcomes aligned' },
  { id: 'timelines', label: 'Timelines discussed' },
  { id: 'pricing', label: 'Pricing discussed' },
  { id: 'engagement_model', label: 'Engagement model discussed' },
  { id: 'next_step', label: 'Next step agreed' },
  { id: 'other', label: 'Any Other' },
];

interface DiscussionChecklistProps {
  discussionId: string;
  isSeeker: boolean;
}

const DiscussionChecklist = ({ discussionId, isSeeker }: DiscussionChecklistProps) => {
  const queryClient = useQueryClient();
  
  // Fetch discussion to get checklist from backend
  const { data: discussion, isLoading: discussionLoading } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => seekerService.getDiscussion(discussionId),
    enabled: !!discussionId && isSeeker,
  });

  // Track if we've initialized from backend to prevent overwriting with defaults
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize items - start with null to prevent premature defaults
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [newTopicText, setNewTopicText] = useState<string>('');
  const [isAddingTopic, setIsAddingTopic] = useState<boolean>(false);

  // Helper function to merge default items with custom items from backend
  const mergeItems = (defaultItems: ChecklistItem[], savedItems: ChecklistItem[]): ChecklistItem[] => {
    // Create a map of saved items by id
    const savedMap = new Map(savedItems.map(item => [item.id, item]));
    
    // Start with default items, preserving their checked state from saved items
    const merged = defaultItems.map(defaultItem => {
      const saved = savedMap.get(defaultItem.id);
      return saved || defaultItem;
    });
    
    // Add any custom items (items not in default list)
    savedItems.forEach(savedItem => {
      const isDefault = DEFAULT_CHECKLIST_ITEMS.some(d => d.id === savedItem.id);
      if (!isDefault) {
        merged.push(savedItem);
      }
    });
    
    return merged;
  };

  // Update items when discussion data loads from backend
  useEffect(() => {
    if (discussionLoading) {
      return; // Don't initialize while loading
    }

    if (discussion?.checklist?.items && discussion.checklist.items.length > 0) {
      // Backend has saved checklist items - merge with defaults
      const defaultItems = DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item, checked: false }));
      const mergedItems = mergeItems(defaultItems, discussion.checklist.items);
      setItems(mergedItems);
      setNotes(discussion.checklist.notes || '');
      setIsInitialized(true);
    } else if (!isInitialized && discussion) {
      // Discussion loaded but no checklist exists - initialize with defaults
      setItems(DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item, checked: false })));
      setNotes('');
      setIsInitialized(true);
    }
  }, [discussion, discussionLoading, isInitialized]);

  // Update checklist mutation
  const updateChecklistMutation = useMutation({
    mutationFn: (data: { items: ChecklistItem[]; notes?: string }) =>
      updateDiscussionChecklist(discussionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
      toast.success('Discussion points saved successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save checklist';
      toast.error(errorMessage);
    },
  });

  const toggleItem = (id: string) => {
    setItems((prev) => {
      if (!prev) return prev;
      return prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
    });
  };

  const addCustomTopic = () => {
    if (!newTopicText.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (!items) return;

    // Check if topic already exists
    const topicExists = items.some(item => 
      item.label.toLowerCase().trim() === newTopicText.toLowerCase().trim()
    );

    if (topicExists) {
      toast.error('This topic already exists');
      return;
    }

    // Generate unique ID for custom topic
    const customId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newItem: ChecklistItem = {
      id: customId,
      label: newTopicText.trim(),
      checked: false,
    };

    setItems([...items, newItem]);
    setNewTopicText('');
    setIsAddingTopic(false);
    toast.success('Topic added');
  };

  const removeCustomTopic = (id: string) => {
    if (!items) return;
    
    // Check if it's a default item (don't allow removal of default items)
    const isDefault = DEFAULT_CHECKLIST_ITEMS.some(item => item.id === id);
    if (isDefault) {
      toast.error('Cannot remove default topics');
      return;
    }

    setItems(items.filter(item => item.id !== id));
    toast.success('Topic removed');
  };

  // Only show to seeker
  if (!isSeeker) {
    return null;
  }

  // Show loading state while initializing
  if (discussionLoading || !items) {
    return (
      <Card className="border-2 border-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Optional Discussion Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading checklist...</p>
        </CardContent>
      </Card>
    );
  }

  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;

  return (
    <Card className="border-2 border-foreground/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Optional Discussion Checklist</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          These notes are for your reference only. Experts cannot see or edit them.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {items.map((item) => {
            const isDefault = DEFAULT_CHECKLIST_ITEMS.some(d => d.id === item.id);
            return (
              <div key={item.id} className="flex items-center space-x-2 group">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="border-foreground/30 data-[state=checked]:bg-primary"
                />
                <Label
                  htmlFor={item.id}
                  className={`text-sm cursor-pointer flex-1 ${
                    item.checked ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.label}
                </Label>
                {item.checked && <CheckCircle2 className="h-4 w-4 text-primary" />}
                {!isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeCustomTopic(item.id)}
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Custom Topic */}
        {isAddingTopic ? (
          <div className="pt-2 border-t space-y-2">
            <Input
              value={newTopicText}
              onChange={(e) => setNewTopicText(e.target.value)}
              placeholder="Enter topic to discuss..."
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTopic();
                } else if (e.key === 'Escape') {
                  setIsAddingTopic(false);
                  setNewTopicText('');
                }
              }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={addCustomTopic}
                disabled={!newTopicText.trim()}
                className="h-7 text-xs"
              >
                Add Topic
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingTopic(false);
                  setNewTopicText('');
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingTopic(true)}
              className="w-full h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Custom Topic
            </Button>
          </div>
        )}

        {checkedCount > 0 && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            {checkedCount} of {totalCount} items discussed
          </div>
        )}
        
        {/* Notes Field */}
        <div className="pt-4 border-t space-y-2">
          <Label htmlFor="checklist-notes" className="text-sm font-medium">
            Additional Notes
          </Label>
          <Textarea
            id="checklist-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or observations from the discussion..."
            rows={4}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Your notes are private and only visible to you.
          </p>
        </div>

        {/* Save Points Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={() => updateChecklistMutation.mutate({ items, notes })}
            disabled={updateChecklistMutation.isPending}
            className="w-full bg-[#FF6B35] hover:bg-[#e55a26] text-white font-medium rounded-lg h-9 flex items-center justify-center gap-1.5 shadow-sm"
          >
            {updateChecklistMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Points
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscussionChecklist;

