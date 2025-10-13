"use server";

import { filterOffensiveMessages } from "@/ai/flows/filter-offensive-messages";
import { z } from "zod";

export interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  isFiltered?: boolean;
  timestamp: string;
}

const chatSchema = z.object({
  message: z.string().min(1, "El mensaje no puede estar vacío."),
});

type ChatState = {
  message?: string;
  error?: string;
  newMessage?: ChatMessage;
};

export async function sendChatMessage(
  prevState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const validatedFields = chatSchema.safeParse({
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      error: "Mensaje inválido.",
    };
  }

  const { message } = validatedFields.data;

  try {
    const moderationResult = await filterOffensiveMessages({ text: message });

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "me",
      text: moderationResult.filteredText,
      isFiltered: moderationResult.isOffensive,
      timestamp: new Date().toISOString(),
    };

    return { message: "Mensaje enviado.", newMessage };
  } catch (e) {
    console.error(e);
    return { error: "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo." };
  }
}
