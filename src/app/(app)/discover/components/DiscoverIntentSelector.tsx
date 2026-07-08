'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hapticsLight } from "@/lib/mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Handshake, ArrowRight } from "lucide-react";
import { UserProfile } from "@/lib/domain/types";
import { motion } from "framer-motion";

interface DiscoverIntentSelectorProps {
  intent: 'dating' | 'friendship' | 'both';
  setIntent: (intent: 'dating' | 'friendship' | 'both') => void;
  setIntentChanging: (changing: boolean) => void;
  currentUserProfile: UserProfile | null;
}

/**
 * DiscoverIntentSelector allows users to toggle between dating, friendship, or both modes.
 * It adapts its UI based on the user's connectionModes.
 */
export function DiscoverIntentSelector({
  intent,
  setIntent,
  setIntentChanging,
  currentUserProfile
}: DiscoverIntentSelectorProps) {
  const hasBothModes = currentUserProfile?.connectionModes?.includes('dating') && currentUserProfile?.connectionModes?.includes('friendship');

  const handleIntentChange = (newIntent: 'dating' | 'friendship' | 'both') => {
    if (newIntent === intent) return;
    hapticsLight();
    setIntentChanging(true);
    setIntent(newIntent);
  };

  if (hasBothModes) {
    return (
      <TooltipProvider>
        <div className="flex gap-1.5 p-1 bg-secondary/50 border border-border/40 rounded-2xl shadow-inner">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleIntentChange('dating')}
                aria-pressed={intent === 'dating'}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${
                  intent === 'dating'
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {intent === 'dating' && (
                  <motion.div 
                    layoutId="intent-active" 
                    className="absolute inset-0 bg-gradient-to-r from-primary to-[hsl(335_85%_72%)] shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Citas</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p className="text-xs">Muestra perfiles que buscan citas</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleIntentChange('both')}
                aria-pressed={intent === 'both'}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${
                  intent === 'both'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {intent === 'both' && (
                  <motion.div 
                    layoutId="intent-active" 
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 shadow-glow-violet/30"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Ambos</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p className="text-xs">Muestra perfiles de citas y amistad juntos</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleIntentChange('friendship')}
                aria-pressed={intent === 'friendship'}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${
                  intent === 'friendship'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {intent === 'friendship' && (
                  <motion.div 
                    layoutId="intent-active" 
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-glow-sm/40"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Amistad</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p className="text-xs">Muestra perfiles que buscan amistad</p></TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // Single mode view (toggle to the other one)
  return (
    <div className="animate-in fade-in zoom-in duration-300">
      {intent === 'dating' && (
        <Card 
          className="border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-indigo-500/20 dark:hover:bg-indigo-500/10 transition-all duration-300 group" 
          onClick={() => handleIntentChange('friendship')}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Handshake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">Modo Amistad</p>
                <p className="text-[10px] text-blue-600/80 dark:text-blue-400/60">Busca conexiones platónicas</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-400 dark:text-blue-500 group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      )}

      {intent === 'friendship' && (
        <Card 
          className="border border-primary/20 bg-gradient-to-r from-pink-500/10 to-primary/10 dark:from-pink-500/5 dark:to-primary/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/10 transition-all duration-300 group" 
          onClick={() => handleIntentChange('dating')}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-pink-500/20 dark:bg-pink-400/10 flex items-center justify-center text-primary dark:text-primary/80 group-hover:scale-110 transition-transform">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary dark:text-primary/80">Modo Citas</p>
                <p className="text-[10px] text-primary/80 dark:text-primary/50">Vuelve a buscar tu alma gemela</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary/40 dark:text-primary/30 group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
