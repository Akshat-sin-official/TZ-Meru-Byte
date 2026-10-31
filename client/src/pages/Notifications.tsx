import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { notificationService, Notification } from '@/services/notificationService';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  Check,
  X,
  Calendar,
  Briefcase,
  FileText,
  Info,
  Clock,
  Banknote,
  AlertCircle,
} from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sidebarSections = useAppSidebar();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page] = useState(1);

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: () => {
      const readFilter = filter === 'unread' ? false : filter === 'read' ? true : undefined;
      return notificationService.getNotifications(page, 20, undefined, readFilter);
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error('Failed to mark notification as read');
      console.error('Mark as read error:', error);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error('Failed to mark all notifications as read');
      console.error('Mark all as read error:', error);
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete notification');
      console.error('Delete notification error:', error);
    },
  });

  const notifications = notificationsData?.data || [];
  // const pagination = notificationsData?.pagination; // Unused for now

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'discussion':
        return Calendar;
      case 'engagement':
        return Briefcase;
      case 'quotation':
        return FileText;
      case 'payment':
        return Banknote;
      case 'system':
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'discussion':
        return 'bg-blue-500';
      case 'engagement':
        return 'bg-green-500';
      case 'quotation':
        return 'bg-purple-500';
      case 'payment':
        return 'bg-yellow-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (id: string) => {
    deleteMutation.mutate(id);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'User',
        role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
      }}
      sections={sidebarSections}
      onSignOut={() => navigate('/login')}
      headerTitle="Notifications"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="h-9">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead} className="h-9">
                <Check className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p>Loading notifications...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-destructive mx-auto" />
              <p className="text-lg font-medium">Failed to load notifications</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Something went wrong'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={filter} onValueChange={v => setFilter(v as typeof filter)} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <Card className="border-2 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium">No notifications</p>
                      <p className="text-sm text-muted-foreground">
                        {filter === 'unread'
                          ? 'You\'re all caught up!'
                          : filter === 'read'
                            ? 'No read notifications'
                            : 'No notifications yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map(notification => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <Card
                        key={notification._id}
                        className={`transition-all hover:shadow-md ${notification.read
                          ? 'bg-white opacity-90'
                          : 'bg-white border-primary/20 shadow-sm'
                          }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getNotificationColor(
                                  notification.type
                                ).replace('bg-', 'from-').replace('-500', '-500 to-').replace('to-', 'to-').replace('-500', '-600')} text-white shadow-sm`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base font-semibold text-gray-900">{notification.title}</CardTitle>
                                  {!notification.read && (
                                    <Badge variant="default" className="h-5 px-2 text-[10px] bg-primary/10 text-primary border-0 hover:bg-primary/20">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription className="text-gray-600 leading-relaxed">
                                  {notification.message}
                                </CardDescription>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                  onClick={() => markAsRead(notification._id)}
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                onClick={() => deleteNotification(notification._id)}
                                title="Delete"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {notification.actionUrl && (
                          <CardContent className="pt-0 pb-4 pl-[4.5rem]">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification._id);
                                }
                                const target = notification.actionUrl!;
                                if (target.startsWith('http://') || target.startsWith('https://')) {
                                  try {
                                    const parsed = new URL(target);
                                    navigate(parsed.pathname + parsed.search + parsed.hash);
                                  } catch {
                                    window.location.href = target;
                                  }
                                } else {
                                  navigate(target);
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AppDashboardLayout>
  );
};

export default Notifications;

