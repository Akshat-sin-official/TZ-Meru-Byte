/**
 * Policy Engine
 * 
 * Admin-only policy management and enforcement
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';

const PolicyEngine = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const sidebarSections = useAdminSidebar();
  
  // Create state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [policyType, setPolicyType] = useState('response_sla');
  const [policyName, setPolicyName] = useState('');
  const [policyConfig, setPolicyConfig] = useState('{}');

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [editPolicyType, setEditPolicyType] = useState('response_sla');
  const [editPolicyName, setEditPolicyName] = useState('');
  const [editPolicyConfig, setEditPolicyConfig] = useState('{}');
  const [editPolicyActive, setEditPolicyActive] = useState(true);

  // Fetch policies
  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['adminPolicies'],
    queryFn: () => apiClient.get('/v1/admin/policies').then((res) => res.data as any),
  });

  const policies = policiesData?.success ? policiesData.data : [];

  // Create policy mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/v1/admin/policies', data),
    onSuccess: () => {
      toast.success('Policy created successfully');
      queryClient.invalidateQueries({ queryKey: ['adminPolicies'] });
      setIsCreateDialogOpen(false);
      setPolicyName('');
      setPolicyConfig('{}');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create policy');
    },
  });

  // Update policy mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/v1/admin/policies/${id}`, data),
    onSuccess: () => {
      toast.success('Policy updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminPolicies'] });
      setIsEditDialogOpen(false);
      setSelectedPolicy(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update policy');
    },
  });

  // Delete policy mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/admin/policies/${id}`),
    onSuccess: () => {
      toast.success('Policy deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminPolicies'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete policy');
    },
  });

  const getSidebarSections = () => {
    return sidebarSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isActive: item.href === '/admin/policies',
      })),
    }));
  };

  const handleCreate = () => {
    if (!policyName || !policyConfig) {
      toast.error('Policy name and config are required');
      return;
    }

    let config;
    try {
      config = JSON.parse(policyConfig);
    } catch {
      toast.error('Invalid JSON in policy config');
      return;
    }

    const policyData = {
      policyType,
      name: policyName,
      config,
      isActive: true,
      enforcedAt: new Date().toISOString(),
    };

    createMutation.mutate(policyData);
  };

  const handleEditClick = (policy: any) => {
    setSelectedPolicy(policy);
    setEditPolicyType(policy.policyType);
    setEditPolicyName(policy.name);
    setEditPolicyConfig(JSON.stringify(policy.config, null, 2));
    setEditPolicyActive(policy.isActive);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdate = () => {
    if (!selectedPolicy) return;
    if (!editPolicyName || !editPolicyConfig) {
      toast.error('Policy name and config are required');
      return;
    }

    let config;
    try {
      config = JSON.parse(editPolicyConfig);
    } catch {
      toast.error('Invalid JSON in policy config');
      return;
    }

    const updatedData = {
      policyType: editPolicyType,
      name: editPolicyName,
      config,
      isActive: editPolicyActive,
    };

    updateMutation.mutate({ id: selectedPolicy._id || selectedPolicy.id, data: updatedData });
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
      headerTitle="Policy Engine"
    >
      <div className="p-3 sm:p-4 lg:p-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Policy Engine</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage platform policies and rules</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : policies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No policies found</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Policy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {policies.map((policy: any) => (
              <Card key={policy._id || policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">{policy.policyType.replace(/_/g, ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Enforced At</p>
                      <p className="text-sm">
                        {new Date(policy.enforcedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Config</p>
                      <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(policy.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(policy)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(policy._id || policy.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Policy Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Policy</DialogTitle>
              <DialogDescription>Define a new platform policy</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="policyType">Policy Type</Label>
                <Select value={policyType} onValueChange={setPolicyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="response_sla">Response SLA</SelectItem>
                    <SelectItem value="auto_release_threshold">Auto-Release Threshold</SelectItem>
                    <SelectItem value="compliance_rule">Compliance Rule</SelectItem>
                    <SelectItem value="notification_cadence">Notification Cadence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="policyName">Policy Name</Label>
                <Input
                  id="policyName"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  placeholder="Enter policy name"
                />
              </div>
              <div>
                <Label htmlFor="policyConfig">Policy Config (JSON)</Label>
                <Textarea
                  id="policyConfig"
                  value={policyConfig}
                  onChange={(e) => setPolicyConfig(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={8}
                />
                <p className="mt-1 text-xs text-muted-foreground">Enter policy configuration as JSON</p>
              </div>
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

        {/* Edit Policy Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Policy</DialogTitle>
              <DialogDescription>Modify policy settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editPolicyType">Policy Type</Label>
                <Select value={editPolicyType} onValueChange={setEditPolicyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="response_sla">Response SLA</SelectItem>
                    <SelectItem value="auto_release_threshold">Auto-Release Threshold</SelectItem>
                    <SelectItem value="compliance_rule">Compliance Rule</SelectItem>
                    <SelectItem value="notification_cadence">Notification Cadence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPolicyName">Policy Name</Label>
                <Input
                  id="editPolicyName"
                  value={editPolicyName}
                  onChange={(e) => setEditPolicyName(e.target.value)}
                  placeholder="Enter policy name"
                />
              </div>
              <div>
                <Label htmlFor="editPolicyActive">Status</Label>
                <Select value={editPolicyActive ? 'active' : 'inactive'} onValueChange={(val) => setEditPolicyActive(val === 'active')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPolicyConfig">Policy Config (JSON)</Label>
                <Textarea
                  id="editPolicyConfig"
                  value={editPolicyConfig}
                  onChange={(e) => setEditPolicyConfig(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={8}
                />
                <p className="mt-1 text-xs text-muted-foreground">Enter policy configuration as JSON</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppDashboardLayout>
  );
};

export default PolicyEngine;
