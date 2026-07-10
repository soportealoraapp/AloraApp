'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hapticsLight } from "@/lib/mobile";
import { motion } from "framer-motion";

interface DiscoverIntentSelectorProps {
  intent: 'dating' | 'friendship' | 'both';
  setIntent: (intent: 'dating' | 'friendship' | 'both') => void;
  setIntentChanging: (changing: boolean) => void;
}

/**
 * DiscoverIntentSelector lets users toggle between Citas, Ambos, or Amistad.
 * Always renders the three-option selector so the legacy "Activa el modo X"
 * card never appears (it caused a UI freeze on login before the profile loaded).
 */
export function DiscoverIntentSelector({
  intent,
  setIntent,
  setIntentChanging
}: DiscoverIntentSelectorProps) {
  const handleIntentChange = (newIntent: 'dating' | 'friendship' | 'both') => {
    if (newIntent === intent) return;
    hapticsLight();
    setIntentChanging(true);
    setIntent(newIntent);
  };

  const options: { value: 'dating' | 'friendship' | 'both'; label: string; tooltip: string; activeClass: string; textClass: string }[] = [
    {
      value: 'dating',
      label: 'Citas',
      tooltip: 'Muestra perfiles que buscan citas',
      activeClass: 'bg-gradient-to-r from-primary to-[hsl(335_85%_72%)] shadow-glow-sm',
      textClass: 'text-primary-foreground'
    },
    {
      value: 'both',
      label: 'Ambos',
      tooltip: 'Muestra perfiles de citas y amistad juntos',
      activeClass: 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-glow-violet/30',
      textClass: 'text-white'
    },
    {
      value: 'friendship',
      label: 'Amistad',
      tooltip: 'Muestra perfiles que buscan amistad',
      activeClass: 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-glow-sm/40',
      textClass: 'text-white'
    }
  ];

  return (
    <TooltipProvider>
      <div className="flex gap-1.5 p-1 bg-secondary/50 border border-border/40 rounded-2xl shadow-inner">
        {options.map((opt) => (
          <Tooltip key={opt.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleIntentChange(opt.value)}
                aria-pressed={intent === opt.value}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${
                  intent === opt.value
                    ? opt.textClass
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {intent === opt.value && (
                  <motion.div
                    layoutId="intent-active"
                    className={`absolute inset-0 ${opt.activeClass}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p className="text-xs">{opt.tooltip}</p></TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
