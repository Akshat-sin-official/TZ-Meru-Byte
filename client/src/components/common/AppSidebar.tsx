
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    LogOut,
    Search,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export interface SidebarNavItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;
    onClick?: () => void;
    isActive?: boolean;
    badge?: string | number;
}

export interface SidebarSection {
    title: string;
    items: SidebarNavItem[];
}

export interface AppSidebarProps {
    user?: {
        name: string;
        role: string;
        avatar?: string;
    };
    sections?: SidebarSection[];
    onSignOut?: () => void;
}

export function AppSidebar({ user, sections = [], onSignOut }: AppSidebarProps) {
    const location = useLocation();

    // Default user if not provided
    const sidebarUser = user || {
        name: "User",
        role: "Member",
        avatar: undefined
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="flex h-full flex-col bg-[#F9F9FB] px-4 py-6 border-r border-[#E5E7EB]">
            {/* Navigation */}
            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-8">
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {(section.items ?? []).map((item, i) => {
                                    // Determine active state: usage of prop if available, otherwise check path
                                    const isActive = item.isActive !== undefined
                                        ? item.isActive
                                        : (item.href ? (location.pathname === item.href || location.pathname.startsWith(item.href + '/')) : false);

                                    const commonClasses = cn(
                                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                                        isActive
                                            ? "bg-white text-[#111926] shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-[#E5E7EB]"
                                            : "text-muted-foreground hover:bg-white/60 hover:text-[#111926] border border-transparent"
                                    );

                                    const content = (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <item.icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-[#111926]" : "text-muted-foreground")} />
                                                <div className="flex items-center gap-2">
                                                    <span>{item.label}</span>
                                                    {item.badge !== undefined && (
                                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#9432E9] px-1 text-[10px] font-bold text-white ring-2 ring-[#F9F9FB] shadow-sm">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {(isActive || item.onClick) && <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-opacity", isActive ? "opacity-100" : "opacity-0")} />}
                                        </>
                                    );

                                    if (item.onClick) {
                                        return (
                                            <div
                                                key={i}
                                                onClick={item.onClick}
                                                className={commonClasses}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {content}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={i}
                                            to={item.href || '#'}
                                            className={commonClasses}
                                        >
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search"
                    className="h-10 bg-white pl-9 text-sm rounded-xl border-[#E5E7EB] focus-visible:ring-[#9432E9]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground border border-[#E5E7EB] px-1 rounded bg-gray-50">
                    Ctrl+F
                </div>
            </div>

            {/* Profile Card */}
            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 border border-[#E5E7EB] shrink-0">
                        <AvatarImage src={sidebarUser.avatar} alt={sidebarUser.name} />
                        <AvatarFallback className="bg-[#FAF4FF] text-[#9432E9]">{getInitials(sidebarUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-[#111926] truncate" title={sidebarUser.name}>{sidebarUser.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium truncate">{sidebarUser.role}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSignOut) onSignOut();
                    }}
                    className="rounded-lg p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer shrink-0 ml-2"
                    aria-label="Sign out"
                    title="Sign out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
