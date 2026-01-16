"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (blob: Blob) => void;
    onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function startCamera() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: false,
                });
                setStream(s);
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
            }
        }

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    onCapture(blob);
                    if (stream) {
                        stream.getTracks().forEach((track) => track.stop());
                    }
                }
            }, "image/jpeg", 0.85);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-[3/4] bg-muted rounded-2xl overflow-hidden border-2 border-primary/20">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-white">
                        <X className="h-12 w-12 text-destructive mb-4" />
                        <p>{error}</p>
                        <Button onClick={onCancel} variant="outline" className="mt-4 text-black">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20 flex items-center justify-center">
                            <div className="w-64 h-80 border-2 border-dashed border-white/50 rounded-full" />
                        </div>
                    </>
                )}
            </div>

            {!error && (
                <div className="flex gap-6 mt-8">
                    <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full h-16 w-16 bg-white/10 border-white/20 text-white"
                        onClick={onCancel}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <Button
                        size="lg"
                        className="rounded-full h-20 w-20 bg-primary hover:bg-primary/90"
                        onClick={capturePhoto}
                    >
                        <Camera className="h-8 w-8" />
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full h-16 w-16 bg-white/10 border-white/20 text-white"
                        disabled // In a real app, this would switch camera
                    >
                        <RefreshCw className="h-6 w-6" />
                    </Button>
                </div>
            )}
        </div>
    );
}
