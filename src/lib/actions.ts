"use server";

export interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  isFiltered?: boolean;
  timestamp: string;
}
