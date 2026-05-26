"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Image as ImageIcon, X } from "lucide-react";
import { useUploadThing } from "@/utils/uploadthing";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  onSendImage?: (imageUrl: string) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onSendImage, onTyping, disabled, placeholder = "Escribe un mensaje..." }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { startUpload } = useUploadThing("chatImageUploader", {
    onClientUploadComplete: async (res: any) => {
      if (res && res.length > 0) {
        const url = res[0].url;
        setPreviewImage(null);
        setUploadingImage(false);
        if (onSendImage) {
          await onSendImage(url);
        }
      }
    },
    onUploadError: () => {
      setUploadingImage(false);
      setPreviewImage(null);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTyping && e.target.value) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => onTyping(), 500);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    await startUpload([file]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative inline-block rounded-xl overflow-hidden border border-muted"
          >
            <div className="relative h-20 w-20">
              <Image src={previewImage} alt="Preview" fill className="object-cover" />
            </div>
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
            <button
              onClick={() => { setPreviewImage(null); setUploadingImage(false); }}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploadingImage}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadingImage}
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
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
    </div>
  );
}
