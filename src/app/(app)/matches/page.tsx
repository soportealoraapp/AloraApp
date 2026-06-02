"use client";

import { useMatches } from "@/hooks/use-matches";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Loader2, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustBadge } from "@/components/ui/premium/TrustBadge";
import { LikesReceivedList } from "@/components/match/LikesReceivedList";

export default function MatchesPage() {
  const { matches, newMatches, loading } = useMatches();

  if (loading) {
    return (
      <div className="md:pl-60 min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-md">
          <h1 className="text-xl font-bold">Matches</h1>
        </header>
        <main className="p-4 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </main>
      </div>
    );
  }

  return (
    <div className="md:pl-60 min-h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Matches</h1>
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto">
        <LikesReceivedList />

        <div>
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tus matches
          </h2>
          {matches.length === 0 ? (
            <Card className="rounded-3xl border-dashed bg-muted/20">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aún no tienes matches</p>
                <p className="text-sm">Sigue explorando en Descubrir para encontrar personas afines.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <Link key={match.id} href={`/chat/${match.id}`}>
                  <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={match.partner?.photoURL || match.partner?.photos?.[0] || '/placeholder.svg'}
                          alt={match.partner?.displayName || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">{match.partner?.displayName}</p>
                          {match.partner?.isVerified && <TrustBadge type="verified" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {typeof match.lastMessage === 'string' ? match.lastMessage : match.lastMessage?.content || 'Enviar primer mensaje'}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {match.compatibility ? `${match.compatibility}%` : ''}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
