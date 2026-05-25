"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onTyping, disabled, placeholder = "Escribe un mensaje..." }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Emit typing indicator (throttled)
    if (onTyping && e.target.value) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping();
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled || sending) return;

    const messageToSend = message;
    setMessage("");
    setSending(true);

    try {
      await onSend(messageToSend);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={message}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled || sending}
        className="flex-1 rounded-2xl bg-muted/50 border-muted focus-visible:ring-primary/20"
        maxLength={500}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || sending || !message.trim()}
        className="rounded-2xl"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
