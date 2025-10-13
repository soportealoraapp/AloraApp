
"use client";

import { useState } from 'react';
import type { UserProfile } from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Eye, CheckCircle, Sparkles, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: UserProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
    const { toast } = useToast();
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setIsLiked(true);
        toast({
            title: `Te ha gustado ${profile.name} ✨`,
            description: "¡Ojalá hagan match! Te notificaremos.",
        });
    }

  return (
    <Card className="group w-full overflow-hidden rounded-xl shadow-lg transition-all hover:shadow-2xl">
      <CardContent className="relative p-0">
        <Image
          src={profile.photos[0]}
          alt={`Photo of ${profile.name}`}
          width={600}
          height={800}
          className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="person"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold font-headline">{profile.name}, {profile.age}</h3>
            {profile.isVerified && <CheckCircle className="h-5 w-5 text-white fill-primary stroke-background" />}
          </div>
           <p className="text-sm opacity-90 flex items-center gap-1.5 mt-1">
             <MapPin className="h-4 w-4" /> {profile.city.split(',')[0]}
            </p>
          <div className="mt-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white/80" />
            <span className="text-sm font-bold">{profile.compatibility}% Compatible</span>
          </div>
        </div>
        <div className="absolute bottom-[-100%] flex w-full justify-around bg-background/80 p-3 backdrop-blur-sm transition-all duration-300 group-hover:bottom-0">
          <Button onClick={handleLike} size="icon" variant="ghost" className={cn("h-14 w-14 rounded-full bg-white/20 shadow-lg", isLiked ? "text-white bg-primary" : "text-primary hover:bg-primary hover:text-primary-foreground")} disabled={isLiked}>
            <Heart className={cn("h-7 w-7", isLiked && "fill-current")} />
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-14 w-14 rounded-full bg-white/20 text-accent-foreground hover:bg-accent hover:text-primary-foreground shadow-lg">
             <Link href={`/chat/${profile.id}`}>
                <MessageSquare className="h-7 w-7" />
             </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-14 w-14 rounded-full bg-white/20 text-secondary-foreground hover:bg-secondary hover:text-primary-foreground shadow-lg">
            <Link href={`/profile/${profile.id}`}>
                <Eye className="h-7 w-7" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
