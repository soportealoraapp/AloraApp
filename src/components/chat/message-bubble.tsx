import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage } from '@/lib/actions';
import type { UserProfile } from '@/lib/mock-data';
import { mockUser } from '@/lib/mock-data';
import { AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


interface MessageBubbleProps {
  message: ChatMessage;
  participant: UserProfile;
}

export function MessageBubble({ message, participant }: MessageBubbleProps) {
  const isMe = message.sender === 'me';
  const senderAvatar = isMe ? mockUser.photos[0] : participant.photos[0];
  const senderName = isMe ? mockUser.name : participant.name;

  return (
    <div className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={senderAvatar} alt={senderName} data-ai-hint="person" />
          <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2',
          isMe ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-secondary text-secondary-foreground'
        )}
      >
        <p className="text-sm">{message.text}</p>
        {message.isFiltered && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                  <AlertCircle className="h-3 w-3" />
                  <span>Filtrado</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Este mensaje fue filtrado por contenido potencialmente ofensivo.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {isMe && (
         <Avatar className="h-8 w-8 border">
          <AvatarImage src={senderAvatar} alt={senderName} data-ai-hint="person" />
          <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
