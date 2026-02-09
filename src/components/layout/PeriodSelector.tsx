import { Calendar, Target, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYearOptions, MONTH_LABELS_FULL } from "@/lib/dateOptions";
import { cn } from "@/lib/utils";

export type DataMode = 'budget' | 'reel';

interface PeriodSelectorProps {
  month?: number;
  year: number;
  mode: DataMode;
  showMonth?: boolean;
  showMode?: boolean;
  className?: string;
  onChange: (params: { month?: number; year: number; mode: DataMode }) => void;
}

const MONTHS = MONTH_LABELS_FULL.map((label, index) => ({
  value: index + 1,
  label,
}));

const yearOptions = getYearOptions();

export function PeriodSelector({
  month,
  year,
  mode,
  showMonth = true,
  showMode = true,
  className,
  onChange,
}: PeriodSelectorProps) {
  const handleYearChange = (newYear: string) => {
    onChange({ month, year: parseInt(newYear), mode });
  };

  const handleMonthChange = (newMonth: string) => {
    onChange({ month: parseInt(newMonth), year, mode });
  };

  const handleModeChange = (newMode: string) => {
    onChange({ month, year, mode: newMode as DataMode });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {/* Year Selector */}
      <Select value={year.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-32">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Selector (optional) */}
      {showMonth && month !== undefined && (
        <Select value={month.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Mode Selector */}
      {showMode && (
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="reel" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Réel
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}
