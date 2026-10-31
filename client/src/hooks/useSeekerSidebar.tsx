import {
    LayoutDashboard,
    FileText,
    Settings,
    HelpCircle,
    Briefcase,
    MessageSquare,
    Bell,
    User,
} from 'lucide-react';

import { useNotificationCount } from './useNotificationCount';

export const useSeekerSidebar = () => {
    const { count } = useNotificationCount();

    return [
        {
            title: 'Main Menu',
            items: [
                {
                    label: 'Overview',
                    icon: LayoutDashboard,
                    href: '/seeker/dashboard',
                },
                {
                    label: 'Engagements',
                    icon: Briefcase,
                    href: '/seeker/engagements',
                },
                {
                    label: 'Quotations',
                    icon: FileText,
                    href: '/seeker/quotations',
                },
                {
                    label: 'Discussions',
                    icon: MessageSquare,
                    href: '/seeker/discussions',
                },
                {
                    label: 'Notifications',
                    icon: Bell,
                    href: '/seeker/notifications',
                    badge: count > 0 ? count : undefined,
                },
            ],
        },
        {
            title: 'Account',
            items: [
                {
                    label: 'Profile',
                    icon: User,
                    href: '/seeker/profile',
                },
                {
                    label: 'Compliance Onboarding',
                    icon: FileText,
                    href: '/seeker/onboarding',
                },
                {
                    label: 'Settings',
                    icon: Settings,
                    href: '/seeker/settings',
                },
                {
                    label: 'Help & Support',
                    icon: HelpCircle,
                    href: '/seeker/help-support',
                }
            ],
        },
    ];
};
