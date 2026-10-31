/**
 * Content Management
 * 
 * Admin-only content and promotions management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useAdminSidebar } from '@/hooks/useAdminSidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ContentManagement = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const sidebarSections = useAdminSidebar();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [contentType, setContentType] = useState('homepage_section');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Fetch content
  const { data: contentData, isLoading } = useQuery({
    queryKey: ['adminContent'],
    queryFn: () => apiClient.get('/v1/admin/content').then((res) => res.data as any),
  });

  const contents = contentData?.success ? contentData.data : [];

  // Create content mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/v1/admin/content', data),
    onSuccess: () => {
      toast.success('Content created successfully');
      queryClient.invalidateQueries({ queryKey: ['adminContent'] });
      setIsCreateDialogOpen(false);
      setTitle('');
      setContent('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create content');
    },
  });

  const getSidebarSections = () => {
    return sidebarSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive: item.href === '/admin/content',
      })),
    }));
  };

  const handleCreate = () => {
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    const contentData: any = {
      type: contentType,
      title,
      content,
      isActive: true,
      displayOrder: 0,
      labels: [],
    };

    if (contentType === 'promotion') {
      contentData.promotionRules = {
        platformFeeDiscount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        uniformApplication: true,
      };
    }

    createMutation.mutate(contentData);
  };

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'Admin User',
        role: 'Platform Administrator',
      }}
      sections={getSidebarSections()}
      onSignOut={() => {
        logout();
        navigate('/login');
      }}
      headerTitle="Content & Promotions Management"
    >
      <div className="p-3 sm:p-4 lg:p-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Content & Promotions Management</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage website content, announcements, and promotions</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Content
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No content found</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {contents.map((item: any) => (
              <Card key={item._id || item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">{item.type.replace(/_/g, ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Content Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Content</DialogTitle>
              <DialogDescription>Create new website content or promotion</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="contentType">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homepage_section">Homepage Section</SelectItem>
                    <SelectItem value="category_landing">Category Landing</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="maintenance_notice">Maintenance Notice</SelectItem>
                    <SelectItem value="educational_content">Educational Content</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title"
                />
              </div>
              <div>
                <Label htmlFor="content">Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter content (supports Markdown)"
                  rows={10}
                />
              </div>
              {contentType === 'promotion' && (
                <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ Promotions must have uniformApplication set to true and cannot be expert-specific
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppDashboardLayout>
  );
};

export default ContentManagement;

