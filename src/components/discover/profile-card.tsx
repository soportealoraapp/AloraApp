"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageSquare, Eye, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useMatches } from "@/hooks/use-matches";

interface ProfileCardProps {
  profile: UserProfile;
  compatibility: number;
  onRefresh?: () => void;
}

export function ProfileCard({ profile, compatibility, onRefresh }: ProfileCardProps) {
  const { sendLike } = useMatches();
  const [liked, setLiked] = useState(false);
  const [superLiked, setSuperLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (liked || loading) return;

    setLoading(true);
    try {
      await sendLike(profile.id, 'like');
      setLiked(true);
      onRefresh?.();
    } catch (error) {
      console.error('Error sending like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuperLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (superLiked || loading) return;

    setLoading(true);
    try {
      await sendLike(profile.id, 'superlike');
      setSuperLiked(true);
      setLiked(true);
      onRefresh?.();
    } catch (error) {
      console.error('Error sending superlike:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/profile/${profile.id}`}>
        <div className="relative aspect-[3/4]">
          <Image
            src={profile.photos?.[0] || '/placeholder.svg'}
            alt={profile.displayName}
            fill
            className="object-cover"
            data-ai-hint="person"
          />
          {profile.isVerified && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              ✓ Verificada
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold text-lg font-headline">
              {profile.displayName}, {profile.age}
            </h3>
            <div className="flex items-center gap-1 text-sm text-pink-500 font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>{compatibility}%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{profile.city}</p>
        </div>

        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
            {profile.interests.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{profile.interests.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={liked ? "default" : "outline"}
            onClick={handleLike}
            disabled={liked || loading}
            className={cn(liked && "bg-pink-500 hover:bg-pink-600")}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Heart className={cn("h-4 w-4 mr-1", liked && "fill-current")} />
                {liked ? "Liked" : "Like"}
              </>
            )}
          </Button>

          <Button size="sm" variant="outline" asChild>
            <Link href={`/chat/${profile.id}`}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Link>
          </Button>

          <Button size="sm" variant="outline" asChild>
            <Link href={`/profile/${profile.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Link>
          </Button>
        </div>

        <Button
          size="sm"
          variant="secondary"
          className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600"
          onClick={handleSuperLike}
          disabled={superLiked || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1" />
              {superLiked ? "Super Match Enviado" : "Super Match"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
