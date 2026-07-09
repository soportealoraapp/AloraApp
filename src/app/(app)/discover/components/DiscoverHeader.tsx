'use client';

import { Button } from "@/components/ui/button";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { UserProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface DiscoverHeaderProps {
  currentUserProfile: UserProfile | null;
  onOpenSecondChance: () => void;
  passedCount: number;
  onOpenFilters: () => void;
  activeFiltersCount: number;
}

/**
 * DiscoverHeader provides the top navigation bar for the Discover page.
 * It includes branding, travel mode status, and action buttons for a
 * second chance (passed profiles) and filtering.
 */
export function DiscoverHeader({
  currentUserProfile,
  onOpenSecondChance,
  passedCount,
  onOpenFilters,
  activeFiltersCount
}: DiscoverHeaderProps) {
  return (
    <header className="app-page-header justify-between glass" style={{ borderBottomColor: 'hsl(var(--border) / 0.5)' }}>
      {/* Visual Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(335 85% 76% / 0.5), hsl(280 60% 70% / 0.5), transparent)' }}
      />

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-headline font-bold tracking-tight text-gradient">Alora</h1>
        {currentUserProfile?.travelModeEnabled && (
          <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
            ✈️ {currentUserProfile.travelCity}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Second Chance Action */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSecondChance}
            className="touch-target rounded-xl transition-all active:scale-90"
            title="Segunda oportunidad — perfiles que descartaste"
            aria-label="Segunda oportunidad"
          >
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </Button>
          {passedCount > 0 && (
            <span className="text-[11px] text-muted-foreground font-bold -ml-1 mr-1">{passedCount}</span>
          )}
        </div>

        {/* Filter Action */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenFilters}
          className="relative touch-target rounded-xl transition-all active:scale-90"
          title="Filtros de búsqueda"
          aria-label="Filtros de búsqueda"
        >
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm border border-background animate-in zoom-in">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
