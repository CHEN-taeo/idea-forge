import { cn } from './ui/utils';

const STEPS = [
  { id: 'lobby', label: '准备' },
  { id: 'r1_submit', label: '构思' },
  { id: 'r1_guess', label: '竞猜' },
  { id: 'r2_adapt', label: '改造' },
  { id: 'r3_challenge', label: '挑战' },
  { id: 'finished', label: '结算' },
];

function phaseIndex(phase: string): number {
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].id === phase) return i;
  }
  return -1;
}

interface ProgressStepperProps {
  currentPhase: string;
}

export function ProgressStepper({ currentPhase }: ProgressStepperProps) {
  const activeIdx = phaseIndex(currentPhase);

  return (
    <div className="flex items-center justify-center gap-0.5 py-2">
      {STEPS.map((step, i) => {
        const isActive = i === activeIdx;
        const isDone = i < activeIdx;
        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  'w-6 h-px mx-0.5 transition-colors duration-500',
                  i <= activeIdx ? 'bg-white/20' : 'bg-white/[0.04]'
                )}
              />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  'size-1.5 rounded-full transition-all duration-300',
                  isActive && 'bg-blue-400 scale-125',
                  isDone && 'bg-white/30',
                  !isActive && !isDone && 'bg-white/8'
                )}
              />
              <span
                className={cn(
                  'text-[9px] transition-colors duration-300',
                  isActive && 'text-white/50',
                  isDone && 'text-white/20',
                  !isActive && !isDone && 'text-white/8'
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
