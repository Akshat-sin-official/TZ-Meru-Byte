
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar, AppSidebarProps } from "@/components/common/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AppDashboardLayoutProps extends AppSidebarProps {
    children: React.ReactNode;
    headerTitle?: string;
}

export function AppDashboardLayout({ children, headerTitle = "Dashboard", user: propUser, onSignOut: propOnSignOut, ...sidebarProps }: AppDashboardLayoutProps) {
    const { user: authUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = propOnSignOut || (() => {
        logout();
        navigate('/login');
    });

    const activeUser = propUser || (authUser ? {
        name: authUser.name || "User",
        role: authUser.role === 'expert' ? 'Marketing Expert' : (authUser.role === 'expert_candidate' ? 'Expert Candidate' : 'Business'),
        avatar: undefined
    } : undefined);

    return (
        <div className="flex h-screen overflow-hidden bg-[#F9F9FB] font-sans antialiased">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:w-[260px] lg:shrink-0 h-full border-r border-[#E5E7EB]">
                <AppSidebar user={activeUser} onSignOut={handleSignOut} {...sidebarProps} />
            </div>

            {/* Main Content Pane - Independently Scrollable for all Dashboard Pages */}
            <div className="flex flex-1 flex-col h-full overflow-y-auto scrollbar-thin transition-all duration-300 ease-in-out">
                {/* Mobile Header */}
                <div className="flex h-16 items-center gap-4 border-b bg-white px-4 lg:hidden sticky top-0 z-40 bg-opacity-90 backdrop-blur-sm shrink-0">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle Sidebar</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[260px] border-r-0">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <AppSidebar user={activeUser} onSignOut={handleSignOut} {...sidebarProps} />
                        </SheetContent>
                    </Sheet>
                    <span className="font-bold text-[#111926]">{headerTitle}</span>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-[1920px] mx-auto">
                    <div className="mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
