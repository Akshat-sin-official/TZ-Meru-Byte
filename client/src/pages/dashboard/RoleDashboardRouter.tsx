import React from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { AdminDashboard } from './AdminDashboard';
import { CoordinatorDashboard } from './CoordinatorDashboard';
import { FacultyDashboard } from './FacultyDashboard';
import { ClubDashboard } from './ClubDashboard';

interface RoleDashboardRouterProps {
  onNavigateTab: (tab: 'timetable' | 'exams' | 'bookings' | 'disruptions') => void;
  openCopilot: () => void;
}

export const RoleDashboardRouter: React.FC<RoleDashboardRouterProps> = ({
  onNavigateTab,
  openCopilot,
}) => {
  const { user } = useCampusAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard onNavigateTab={onNavigateTab} />;
    case 'department_coordinator':
      return <CoordinatorDashboard onNavigateTab={onNavigateTab} />;
    case 'faculty':
      return <FacultyDashboard onNavigateTab={onNavigateTab} />;
    case 'club':
      return <ClubDashboard onNavigateTab={onNavigateTab} openCopilot={openCopilot} />;
    default:
      return <AdminDashboard onNavigateTab={onNavigateTab} />;
  }
};

