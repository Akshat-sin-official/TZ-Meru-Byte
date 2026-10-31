import { useAuth } from '@/contexts/AuthContext';
import { useSeekerSidebar } from './useSeekerSidebar';
import { useExpertSidebar } from './useExpertSidebar';
import { useAdminSidebar } from './useAdminSidebar';

export const useAppSidebar = () => {
    const { user } = useAuth();
    const seekerSections = useSeekerSidebar();
    const expertSections = useExpertSidebar();
    const adminSections = useAdminSidebar();

    const role = user?.role || 'seeker';

    if (role === 'expert' || role === 'expert_candidate') {
        return expertSections;
    } else if (role === 'admin') {
        return adminSections;
    } else {
        return seekerSections;
    }
};
