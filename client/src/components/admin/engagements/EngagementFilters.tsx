import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';

interface EngagementFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    status: string;
    setStatus: (value: string) => void;
    risk: string;
    setRisk: (value: string) => void;
}

export const EngagementFilters = ({
    search,
    setSearch,
    status,
    setStatus,
    risk,
    setRisk
}: EngagementFiltersProps) => {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
            <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by ID, Expert, or Seeker..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Risks</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="low">Low Risk</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
