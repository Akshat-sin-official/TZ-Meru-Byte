import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { shortlistService, ShortlistedExpertData } from '../services/shortlistService';

interface ShortlistContextType {
  shortlistedIds: string[];
  shortlistedExperts: ShortlistedExpertData[];
  toggleShortlist: (expertId: string) => Promise<void>;
  isInShortlist: (expertId: string) => boolean;
  isLoading: boolean;
  clearLocalShortlist: () => void;
  addToShortlist: (expertId: string) => Promise<void>;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export const ShortlistProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [shortlistedExperts, setShortlistedExperts] = useState<ShortlistedExpertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from local storage initially
  const loadLocalShortlist = useCallback(() => {
    try {
      const stored = localStorage.getItem('martech_shortlist');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setShortlistedIds([...new Set(parsed.filter(Boolean))]);
        }
      }
    } catch (error) {
      console.error('Failed to load local shortlist:', error);
    }
  }, []);

  // Save to local storage
  const saveLocalShortlist = useCallback((ids: string[]) => {
    try {
      localStorage.setItem('martech_shortlist', JSON.stringify(ids));
      setShortlistedIds(ids);
    } catch (error) {
      console.error('Failed to save local shortlist:', error);
    }
  }, []);

  // Sync local shortlist to server upon login
  const syncWithServer = useCallback(async () => {
    try {
      const stored = localStorage.getItem('martech_shortlist');
      if (stored) {
        const localIds = JSON.parse(stored);
        if (localIds.length > 0) {
          await shortlistService.syncShortlist(localIds);
          // Don't clear local storage immediately, wait for fetch to populate
        }
      }
    } catch (error) {
      console.error('Failed to sync shortlist with server:', error);
    }
  }, []);

  // Fetch remote shortlist
  const fetchRemoteShortlist = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'seeker') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await shortlistService.getShortlist();
      setShortlistedExperts(data);
      const uniqueIds = [...new Set(data.map(item => item.expertId).filter(Boolean))];
      setShortlistedIds(uniqueIds);
      
      // Clear local storage since we are in sync
      localStorage.removeItem('martech_shortlist');
    } catch (error) {
      console.error('Failed to fetch remote shortlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  // Initialization & Auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      loadLocalShortlist();
      setShortlistedExperts([]);
      setIsLoading(false);
    } else if (user?.role === 'seeker') {
      // User just logged in as seeker
      syncWithServer().then(() => fetchRemoteShortlist());
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role, loadLocalShortlist, syncWithServer, fetchRemoteShortlist]);

  // Toggle Shortlist action
  const toggleShortlist = async (expertId: string) => {
    if (!isAuthenticated || user?.role !== 'seeker') {
      // Handle locally for unauthenticated users or non-seeker roles
      if (shortlistedIds.includes(expertId)) {
        saveLocalShortlist(shortlistedIds.filter(id => id !== expertId));
      } else {
        saveLocalShortlist([...shortlistedIds, expertId]);
      }
      return;
    }

    // Handle remotely (seeker only)
    try {
      // Optimistic update
      const isCurrentlyShortlisted = shortlistedIds.includes(expertId);
      if (isCurrentlyShortlisted) {
        setShortlistedIds(prev => prev.filter(id => id !== expertId));
        setShortlistedExperts(prev => prev.filter(item => item.expertId !== expertId));
      } else {
        setShortlistedIds(prev => [...prev, expertId]);
      }

      await shortlistService.toggleShortlist(expertId);
      
      // Refetch to get populated data if it was added
      if (!isCurrentlyShortlisted) {
        fetchRemoteShortlist();
      }
    } catch (error) {
      console.error('Failed to toggle remote shortlist:', error);
      // Revert optimistic update
      fetchRemoteShortlist();
    }
  };
  const addToShortlist = async (expertId: string) => {
    if (shortlistedIds.includes(expertId)) return;
    await toggleShortlist(expertId);
  };
  const isInShortlist = useCallback((expertId: string) => {
    return shortlistedIds.includes(expertId);
  }, [shortlistedIds]);

  const clearLocalShortlist = useCallback(() => {
    localStorage.removeItem('martech_shortlist');
    if (!isAuthenticated) {
      setShortlistedIds([]);
    }
  }, [isAuthenticated]);

  return (
    <ShortlistContext.Provider
      value={{
        shortlistedIds,
        shortlistedExperts,
        toggleShortlist,
        isInShortlist,
        isLoading,
        clearLocalShortlist,
        addToShortlist,
      }}
    >
      {children}
    </ShortlistContext.Provider>
  );
};

export const useShortlist = () => {
  const context = useContext(ShortlistContext);
  if (context === undefined) {
    throw new Error('useShortlist must be used within a ShortlistProvider');
  }
  return context;
};
