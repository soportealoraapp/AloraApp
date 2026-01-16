"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingMatchCard } from "@/components/ui/premium/FloatingMatchCard";
import { MatchScreen } from "@/components/ui/premium/MatchScreen";
import { Button } from "@/components/ui/button";
import { Filter, Loader2, RefreshCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDiscover } from "@/hooks/use-discover";
import { useAuth } from "@/contexts/AuthContext";
import { matchingService } from "@/lib/firebase/matching-service";
import { useMatches } from "@/hooks/use-matches";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/domain/types";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";

// ... (keep filters imports if needed, simplified for brevity in this artifact)

export default function DiscoverPage() {
  const { profile: currentUserProfile } = useAuth();
  const { profiles, loading, refresh, setProfiles } = useDiscover("");
  const { toast } = useToast();
  const router = useRouter();

  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [showMatchScreen, setShowMatchScreen] = useState(false);

  // We show the top card
  const currentProfile = profiles[0]?.profile;

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentProfile || !currentUserProfile) return;

    const profileToActOn = currentProfile;
    // Optimistic removal
    const remainingProfiles = profiles.slice(1);
    // cast to any to bypass type mismatch if useDiscover returns different types
    // In discover-service it returns { profile: UserProfile, compatibility: number }
    setProfiles(remainingProfiles as any);

    try {
      if (direction === 'right') {
        const isMatch = await matchingService.sendLike((currentUserProfile as any).uid || (currentUserProfile as any).id, (profileToActOn as any).uid || (profileToActOn as any).id);
        if (isMatch) {
          // Trigger Match Screen
          // We need to fetch the full profile or assume profileToActOn is enough
          // Profile in discover might be slightly different structure, let's cast
          setMatchedProfile(profileToActOn as unknown as UserProfile);
          setShowMatchScreen(true);
        }
      } else {
        await matchingService.sendPass((currentUserProfile as any).uid || (currentUserProfile as any).id, (profileToActOn as any).uid || (profileToActOn as any).id);
      }
    } catch (error) {
      console.error("Action failed", error);
      toast({ title: "Error", description: "No se pudo procesar la acción", variant: "destructive" });
      // Revert? For now, just log.
    }
  };

  const handleChat = () => {
    setShowMatchScreen(false);
    // We need match ID to go to chat. 
    // matchingService.sendLike returns boolean. Needs update to return matchId or we find it.
    // For now, redirect to chat list
    router.push('/chat');
  };

  if (showMatchScreen && matchedProfile && currentUserProfile) {
    return (
      <MatchScreen
        userProfile={currentUserProfile as unknown as UserProfile}
        matchedProfile={matchedProfile}
        onChat={handleChat}
        onKeepSwiping={() => setShowMatchScreen(false)}
      />
    );
  }

  return (
    <div className="md:pl-60 h-screen flex flex-col overflow-hidden bg-gradient-to-br from-pink-50 to-white">
      <header className="flex h-16 items-center justify-between px-4 z-10">
        <h1 className="text-2xl font-black italic text-pink-500">Alora</h1>
        <Button variant="ghost" size="icon" onClick={() => refresh()}>
          <RefreshCcw className="h-5 w-5 text-gray-400" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <AnimatePresence>
          {loading ? (
            <div className="flex flex-col items-center text-center px-6">
              <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
              <p className="text-pink-500 font-semibold">{BRAND_VOICE.states.emptyFeed.title}</p>
              <p className="text-pink-400 text-sm mt-1">{BRAND_VOICE.states.emptyFeed.subtitle}</p>
            </div>
          ) : currentProfile ? (
            <div className="w-full max-w-sm h-[600px] relative">
              {/* Stack effect */}
              {profiles[1] && (
                <div className="absolute inset-0 top-4 scale-95 opacity-50 bg-white rounded-3xl shadow-xl z-0 transform translate-y-2" />
              )}
              <div className="relative z-10 h-full">
                <FloatingMatchCard
                  key={currentProfile.id}
                  profile={currentProfile as unknown as UserProfile}
                  compatibility={profiles[0]?.compatibility}
                  onSwipe={handleSwipe}
                />
              </div>
            </div>
          ) : (
            <div className="text-center px-8">
              <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCcw className="h-10 w-10 text-pink-300" />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-2">{BRAND_VOICE.states.noMatches.title}</p>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">{BRAND_VOICE.states.noMatches.subtitle}</p>
              <Button onClick={() => refresh()} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                Explorar de nuevo
              </Button>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
