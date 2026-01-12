import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';
import { FlaskConical, Factory } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <TooltipProvider>
      <div className="flex items-center rounded-lg border border-border bg-muted p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode('simulation')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                mode === 'simulation'
                  ? 'bg-chart-4 text-chart-4-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Simulation</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mode Simulation : hypothèses et prévisions</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode('reel')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                mode === 'reel'
                  ? 'bg-chart-1 text-chart-1-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Factory className="h-4 w-4" />
              <span className="hidden sm:inline">Réel</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mode Réel : données d'exploitation</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
