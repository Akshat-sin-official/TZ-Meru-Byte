/**
 * Admin Sidebar Configuration
 * 
 * Centralized sidebar configuration for all admin pages
 */

import {
  LayoutDashboard,
  FileCheck,
  User,
  FileText,
  Settings,
  Bell,
  HelpCircle,
  BarChart3,
  Activity,
} from 'lucide-react';

export const adminSidebarSections = [
  {
    title: 'Main Menu',
    items: [
      {
        label: 'Overview',
        icon: LayoutDashboard,
        href: '/admin/dashboard',
      },
      {
        label: 'Analytics',
        icon: BarChart3,
        href: '/admin/analytics',
      },
      {
        label: 'Operations Queue',
        icon: FileCheck,
        href: '/admin/operations',
      },
      {
        label: 'Active Engagements',
        icon: Activity,
        href: '/admin/operations/engagements',
      },
      {
        label: 'Users & Profiles',
        icon: User,
        href: '/admin/users',
      },
      {
        label: 'Content & Promotions',
        icon: FileText,
        href: '/admin/content',
      },
      {
        label: 'Policy Engine',
        icon: Settings,
        href: '/admin/policies',
      },
      {
        label: 'Notifications',
        icon: Bell,
        href: '/admin/notifications',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        label: 'Profile',
        icon: User,
        href: '/admin/profile',
      },
      {
        label: 'Settings',
        icon: Settings,
        href: '/admin/settings',
      },
      {
        label: 'Help & Support',
        icon: HelpCircle,
        href: '/admin/help-support',
      },
    ],
  },
];

