

"use client";

import { useState, useMemo, useEffect } from 'react';
import { ProfileCard } from '@/components/discover/profile-card';
import { mockProfiles, UserProfile } from '@/lib/mock-data';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DiscoverFilters } from '@/components/discover/discover-filters';
import { getRejectedProfilesFromStorage } from '@/lib/storage';

export interface Filters {
    ageRange: [number, number];
    distance: number;
    seeking: 'women' | 'men' | 'all';
    verifiedOnly: boolean;
    interests: string[];
    values: string[];
    smoking?: string;
    drinking?: string;
    children?: string;
}

export default function DiscoverPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filters>({
    ageRange: [18, 60],
    distance: 100,
    seeking: 'all',
    verifiedOnly: true,
    interests: [],
    values: [],
  });
  const [rejectedProfileIds, setRejectedProfileIds] = useState<string[]>([]);

  useEffect(() => {
    const rejected = getRejectedProfilesFromStorage();
    setRejectedProfileIds(rejected.map(p => p.id));
  }, []);

  const filteredProfiles = useMemo(() => {
    return mockProfiles.filter(profile => {
      // Filter out rejected profiles
      if (rejectedProfileIds.includes(profile.id)) {
        return false;
      }
      
      // Search term filter (interests)
      if (
        searchTerm && 
        !profile.interests.some(interest => 
          interest.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }

      // Gender filter
      if (activeFilters.seeking !== 'all' && profile.gender !== activeFilters.seeking) {
        return false;
      }
      
      // Age range filter
      if (profile.age < activeFilters.ageRange[0] || profile.age > activeFilters.ageRange[1]) {
        return false;
      }

      // Verification filter
      if (activeFilters.verifiedOnly && !profile.isVerified) {
        return false;
      }

      // Lifestyle filters
      if (activeFilters.smoking && profile.smoking !== activeFilters.smoking) return false;
      if (activeFilters.drinking && profile.drinking !== activeFilters.drinking) return false;
      if (activeFilters.children && profile.children !== activeFilters.children) return false;

      // Interests filter
      if (activeFilters.interests.length > 0 && !activeFilters.interests.some(interest => profile.interests.includes(interest))) {
        return false;
      }

      // Values filter
      if (activeFilters.values.length > 0 && !activeFilters.values.some(value => profile.values.includes(value))) {
        return false;
      }

      // NOTE: Distance filter is not implemented as we don't have location data.

      return true;
    });
  }, [searchTerm, activeFilters, rejectedProfileIds]);


  return (
    <div className="md:pl-60">
      <DiscoverFilters 
        open={filtersOpen} 
        onOpenChange={setFiltersOpen} 
        onApplyFilters={setActiveFilters}
        initialFilters={activeFilters}
      />
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">Descubrir</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar intereses..."
            className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </header>
       <main className="p-4">
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
              <p className="text-lg font-semibold">No se encontraron perfiles</p>
              <p className="text-muted-foreground mt-2">Intenta ajustar tus filtros o término de búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  );
}
