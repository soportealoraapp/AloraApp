'use client';

import { Button } from "@/components/ui/button";
import { Heart, Sparkles, RefreshCcw } from "lucide-react";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";
import { motion } from "framer-motion";

interface DiscoverEmptyStateProps {
  hasActiveFilters: boolean;
  onRefresh: () => void;
  onRelaxFilters: () => void;
}

/**
 * DiscoverEmptyState is shown when no profiles are found in the Discover feed.
 * It provides context-aware CTAs like "Relajar filtros" or "Explorar de nuevo".
 */
export function DiscoverEmptyState({
  hasActiveFilters,
  onRefresh,
  onRelaxFilters
}: DiscoverEmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm space-y-6 py-12"
    >
      <div className="text-center px-6">
        {hasActiveFilters ? (
          <div className="rounded-3xl p-8 border border-border/40 relative overflow-hidden glass"
            style={{ background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.04) 0%, hsl(280 60% 70% / 0.03) 100%)' }}
          >
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Sparkles className="h-8 w-8 text-primary animate-float" />
              </div>
              <p className="text-lg font-headline font-bold text-foreground mb-2">{BRAND_VOICE.states.noFilterResults.title}</p>
              <p className="text-sm text-muted-foreground/80 mb-6 max-w-xs mx-auto">{BRAND_VOICE.states.noFilterResults.subtitle}</p>
              
              <div className="flex flex-col gap-3">
                <Button onClick={onRelaxFilters} className="rounded-full px-8 h-12 font-bold shadow-glow hover:scale-105 transition-transform">
                  Relajar filtros
                </Button>
                <Button onClick={onRefresh} variant="ghost" className="text-xs text-muted-foreground hover:text-foreground">
                  <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Reintentar búsqueda
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl p-8 border border-border/40 relative overflow-hidden glass"
            style={{ background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.04) 0%, hsl(280 60% 70% / 0.03) 100%)' }}
          >
            {/* Background Glow */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Heart className="h-8 w-8 text-primary fill-primary/30 animate-pulse" />
              </div>
              <p className="text-lg font-headline font-bold text-foreground mb-2">{BRAND_VOICE.states.noMatches.title}</p>
              <p className="text-sm text-muted-foreground/80 mb-6 max-w-xs mx-auto">{BRAND_VOICE.states.noMatches.subtitle}</p>
              <Button onClick={onRefresh} className="rounded-full px-8 h-12 font-bold shadow-glow hover:scale-105 transition-transform">
                Explorar de nuevo
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
