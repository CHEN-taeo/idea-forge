import { cn } from './ui/utils';

const FULL_STEPS = [
  { id: 'lobby', label: '准备' },
  { id: 'r1_submit', label: '构思' },
  { id: 'r1_guess', label: '竞猜' },
  { id: 'r2_adapt', label: '改造' },
  { id: 'r3_challenge', label: '挑战' },
  { id: 'commitment', label: '承诺' },
  { id: 'finished', label: '总结' },
];

const QUICK_STEPS = FULL_STEPS.filter(s => s.id !== 'r3_challenge');

function phaseIndex(phase: string, steps: typeof FULL_STEPS): number {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].id === phase) return i;
  }
  return -1;
}

interface ProgressStepperProps {
  currentPhase: string;
  template?: 'full' | 'quick';
}

export function ProgressStepper({ currentPhase, template = 'full' }: ProgressStepperProps) {
  const STEPS = template === 'quick' ? QUICK_STEPS : FULL_STEPS;
  const activeIdx = phaseIndex(currentPhase, STEPS);

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
                  i <= activeIdx ? 'bg-[var(--if-accent-border)]' : 'bg-[var(--if-line)]'
                )}
              />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  'size-1.5 rounded-full transition-all duration-300',
                  isActive && 'bg-[var(--if-accent)] scale-125',
                  isDone && 'bg-[var(--if-muted)]',
                  !isActive && !isDone && 'bg-[var(--if-line)]'
                )}
              />
              <span
                className={cn(
                  'text-[9px] transition-colors duration-300',
                  isActive && 'text-[var(--if-accent)]',
                  isDone && 'text-[var(--if-muted)]',
                  !isActive && !isDone && 'text-[var(--if-muted-soft)]'
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
