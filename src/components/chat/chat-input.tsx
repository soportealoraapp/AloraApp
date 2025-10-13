"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { sendChatMessage, type ChatMessage } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending}>
      <SendHorizonal className="h-5 w-5" />
      <span className="sr-only">Enviar</span>
    </Button>
  );
}

export function ChatInput({ onNewMessage }: { onNewMessage: (message: ChatMessage) => void }) {
  const [state, formAction] = useActionState(sendChatMessage, {});
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      formRef.current?.reset();
    }
    if (state?.newMessage) {
        onNewMessage(state.newMessage);
    }
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
  }, [state, onNewMessage, toast]);

  return (
    <form ref={formRef} action={formAction} className="flex w-full items-center space-x-2">
      <Input
        id="message"
        name="message"
        placeholder="Escribe un mensaje..."
        className="flex-1"
        autoComplete="off"
        required
      />
      <SubmitButton />
    </form>
  );
}
