import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface ReleaseItem {
    id: string;
    name: string;
    email: string;
    amount: number;
    avatar?: string;
}

interface AdminReleaseListProps {
    releases: ReleaseItem[]; // Kept original type definition
    onPayNow: (id: string) => void;
}

export function AdminReleaseList({ releases, onPayNow }: AdminReleaseListProps) {
    return (
        <div className="space-y-4 sm:space-y-5">
            {releases.map((release) => (
                <div key={release.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 border border-gray-100 shadow-sm shrink-0">
                            <AvatarImage src={release.avatar || `https://ui-avatars.com/api/?name=${release.name}`} />
                            <AvatarFallback>{release.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <h4 className="font-sans text-sm sm:text-[14px] font-medium leading-5 tracking-normal text-[#1F2937] truncate">{release.name}</h4>
                            <p className="font-sans text-xs text-[#9CA3AF] leading-4 truncate">{release.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="px-2 sm:px-3 py-1.5 bg-[#F3F4F6] rounded-lg font-sans text-xs sm:text-sm font-semibold text-[#111926] min-w-[70px] sm:min-w-[80px] text-center leading-5">
                            ₹{release.amount.toLocaleString('en-IN')}
                        </div>
                        <Button
                            variant="outline"
                            className="bg-[#34D399] bg-opacity-10 border border-[#34D399] text-[#059669] hover:bg-[#10B981] hover:bg-opacity-20 hover:text-[#047857] h-9 px-4 sm:px-6 font-sans text-xs sm:text-[14px] font-medium leading-5 rounded-lg shadow-none transition-colors whitespace-nowrap"
                            onClick={() => onPayNow(release.id)}
                        >
                            Pay Now
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
