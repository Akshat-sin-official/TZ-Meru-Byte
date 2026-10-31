import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface NotificationContextType {
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper to get API BASE URL similar to apiClient.ts
function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  return 'http://localhost:6001/api';
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Close previous connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const API_BASE_URL = getApiBaseUrl();
    const streamUrl = `${API_BASE_URL}/v1/notifications/stream?token=${token}`;
    
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      retryCount.current = 0; // Reset retry count on successful connection
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected' || data.type === 'heartbeat') {
          return;
        }

        // It's a real notification!
        // 1. Show toast with action button
        toast.info(data.title, {
          description: data.message,
          duration: 6000,
          action: data.actionUrl ? {
            label: 'View Detail',
            onClick: () => navigate(data.actionUrl)
          } : undefined
        });

        // 2. Invalidate unread count query and notifications list to update badges and notification pages automatically
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        
        // 3. Invalidate discussion and engagement queries so dashboard lists update automatically
        queryClient.invalidateQueries({ queryKey: ['expertDiscussions'] });
        queryClient.invalidateQueries({ queryKey: ['seekerDiscussions'] });
        queryClient.invalidateQueries({ queryKey: ['expertStats'] });
        queryClient.invalidateQueries({ queryKey: ['seekerStats'] });
        
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Exponential back-off: 3s, 6s, 12s, max 30s
      const delay = Math.min(3000 * Math.pow(2, retryCount.current), 30000);
      retryCount.current += 1;
      
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = setTimeout(() => {
        if (user) connect();
      }, delay);
    };
  }, [user, queryClient, navigate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  return (
    <NotificationContext.Provider value={{ isConnected }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
