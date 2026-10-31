import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export interface SidebarNavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: number;
}

export interface SidebarSection {
  title: string;
  items: SidebarNavItem[];
}

interface DashboardSidebarProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  sections: SidebarSection[];
  onSignOut?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const SidebarContent = ({
  user,
  sections,
  onSignOut,
  activeTab,
}: DashboardSidebarProps) => {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = activeTab
                  ? item.label.toLowerCase().replace(/\s+/g, '') === activeTab
                  : item.href
                  ? location.pathname === item.href
                  : item.isActive;

                return (
                  <li key={itemIdx}>
                    {item.href ? (
                      <Link
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-4 w-4 ml-1" />}
                      </Link>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-4 w-4 ml-1" />}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-secondary text-foreground">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-tight truncate" title={user.name}>{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user.role}</p>
          </div>
        </div>
        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export const DashboardSidebar = (props: DashboardSidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card lg:block">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-4 top-4 z-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
