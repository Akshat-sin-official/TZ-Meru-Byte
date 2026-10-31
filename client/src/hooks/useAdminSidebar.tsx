/**
 * Admin Sidebar Hook
 * 
 * Reusable hook for admin sidebar configuration
 * Automatically marks the active item based on current route
 */

import { useLocation } from 'react-router-dom';
import { adminSidebarSections } from '@/config/adminSidebar.config';
import { useNotificationCount } from './useNotificationCount';

export const useAdminSidebar = () => {
  const location = useLocation();
  const { count } = useNotificationCount();

  // Mark active item based on current route and apply badges
  const sidebarSections = adminSidebarSections.map((section) => {
    if (section.title === 'Main Menu') {
      return {
        ...section,
        items: section.items.map((item) => {
          let isActive = false;
          let badge = undefined;

          // Mark active based on current route
          if (item.href && location.pathname === item.href) {
            isActive = true;
          }

          // Apply notification badge
          if (item.label === 'Notifications' && count > 0) {
            badge = count;
          }

          return { ...item, isActive, badge };
        }),
      };
    }
    return section;
  });

  return sidebarSections;
};

