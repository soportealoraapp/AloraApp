"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Image as ImageIcon, X, Mic, Square } from "lucide-react";
import { useUploadThing } from "@/utils/uploadthing";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  onSendImage?: (imageUrl: string) => Promise<void>;
  onSendVoice?: (audioUrl: string, duration: number) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onSendImage, onSendVoice, onTyping, disabled, placeholder = "Escribe un mensaje..." }: ChatInputProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const { startUpload: startVoiceUpload } = useUploadThing("voiceUploader", {
    onClientUploadComplete: async (res: any) => {
      if (res && res.length > 0) {
        const url = res[0].url;
        const duration = recordingTime;
        setRecordedBlob(null);
        setRecordedUrl(null);
        setUploadingVoice(false);
        setRecordingTime(0);
        if (onSendVoice) {
          await onSendVoice(url, duration);
        }
      }
    },
    onUploadError: () => {
      setUploadingVoice(false);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecordingTime(0);
    },
  });

  const getAudioMimeType = () => {
    if (typeof window === 'undefined') return 'audio/webm';
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isSafari || isIOS) return 'audio/mp4';
    return 'audio/webm';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getAudioMimeType();
      const options = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const type = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
        toast({ title: 'Permiso de micrófono denegado', description: 'Habilita el permiso en la configuración de tu navegador.', variant: 'destructive' });
      } else {
        toast({ title: 'No se pudo acceder al micrófono', description: 'Verifica los permisos de tu navegador.', variant: 'destructive' });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecordingTime(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendVoiceMessage = async () => {
    if (!recordedBlob) return;
    setUploadingVoice(true);
    const mimeType = getAudioMimeType();
    const ext = mimeType === 'audio/mp4' ? 'm4a' : 'webm';
    const file = new File([recordedBlob], `voice-${Date.now()}.${ext}`, { type: mimeType });
    await startVoiceUpload([file]);
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

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

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato no soportado', description: 'Solo se permiten imágenes.', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({ title: 'Imagen muy grande', description: 'El tamaño máximo es 10 MB.', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    await startUpload([file]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordedUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-muted rounded-2xl">
          <audio src={recordedUrl} controls className="flex-1 h-8" />
          <Button size="sm" variant="ghost" onClick={() => { setRecordedBlob(null); setRecordedUrl(null); setRecordingTime(0); }}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={sendVoiceMessage} disabled={uploadingVoice}>
            {uploadingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  const recordingBars = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    height: 4 + (((i * 7 + 3) % 11) / 11) * 12,
    delay: `${i * 0.05}s`,
  })), []);

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">{formatTime(recordingTime)}</span>
          <div className="flex-1 flex items-center gap-[2px] px-2">
            {recordingBars.map((bar, i) => (
              <div
                key={i}
                className="w-[2px] bg-red-400 rounded-full animate-pulse"
                style={{
                  height: bar.height,
                  animationDelay: bar.delay,
                }}
              />
            ))}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={cancelRecording} className="text-red-600">
          <X className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={stopRecording} className="bg-red-500 hover:bg-red-600">
          <Square className="h-4 w-4 fill-current" />
        </Button>
      </div>
    );
  }

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
          enterKeyHint="send"
        />
        {message.trim() ? (
          <Button
            type="submit"
            size="icon"
            disabled={disabled || sending}
            className="rounded-2xl"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled}
            onClick={startRecording}
            className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </form>
    </div>
  );
}
