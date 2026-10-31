import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to get the current user's unread notification count
 * Refetches automatically when the user changes or every 2 minutes
 */
export const useNotificationCount = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 5000, // Short polling interval so badge count updates automatically every 5s
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });

  return {
    count: data?.count || 0,
    isLoading,
    error,
  };
};
