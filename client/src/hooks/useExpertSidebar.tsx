import {
    LayoutDashboard,
    Calendar,
    Briefcase,
    FileText,
    Clock,
    Bell,
    User,
    Settings,
    HelpCircle,
} from 'lucide-react';

import { useNotificationCount } from './useNotificationCount';
import { useAuth } from '@/contexts/AuthContext';

export const useExpertSidebar = () => {
    const { user } = useAuth();
    const { count } = useNotificationCount();

    // Workspace main menu is strictly granted ONLY after admin approval & verification (verified profileStatus)
    const isApprovedAndVerified = user?.profileStatus === 'verified';

    const accountSection = {
        title: 'Account',
        items: [
            {
                label: 'Profile',
                icon: User,
                href: '/expert/profile',
            },
            {
                label: 'Compliance Onboarding',
                icon: FileText,
                href: '/expert/onboarding',
            },
            {
                label: 'Settings',
                icon: Settings,
                href: '/expert/settings',
            },
            {
                label: 'Help & Support',
                icon: HelpCircle,
                href: '/expert/help-support',
            },
        ],
    };

    // If expert is not yet verified by Admin, lock workspace menu items
    if (!isApprovedAndVerified) {
        return [accountSection];
    }

    return [
        {
            title: 'Main Menu',
            items: [
                {
                    label: 'Overview',
                    icon: LayoutDashboard,
                    href: '/expert/dashboard',
                },
                {
                    label: 'Discussions',
                    icon: Calendar,
                    href: '/expert/dashboard?tab=discussions',
                },
                {
                    label: 'Quotations',
                    icon: FileText,
                    href: '/expert/dashboard?tab=quotations',
                },
                {
                    label: 'Engagements',
                    icon: Briefcase,
                    href: '/expert/dashboard?tab=engagements',
                },
                {
                    label: 'Schedule',
                    icon: Clock,
                    href: '/expert/schedule',
                },
                {
                    label: 'Notifications',
                    icon: Bell,
                    href: '/expert/notifications',
                    badge: count > 0 ? count : undefined,
                },
            ],
        },
        accountSection,
    ];
};
