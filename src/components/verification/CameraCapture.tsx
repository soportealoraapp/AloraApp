"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Upload } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (blob: Blob) => void;
    onCancel: () => void;
    onGalleryUpload?: () => void;
}

export function CameraCapture({ onCapture, onCancel, onGalleryUpload }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function startCamera() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
                    audio: false,
                });

                if (cancelled) {
                    s.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }
                setCameraReady(true);
            } catch (err) {
                if (cancelled) return;
                const msg = (err as DOMException)?.name;
                if (msg === 'NotAllowedError') {
                    setError("Permiso de cámara denegado. Puedes subir una foto desde tu galería.");
                } else if (msg === 'NotFoundError') {
                    setError("No se encontró ninguna cámara en este dispositivo.");
                } else {
                    setError("No se pudo acceder a la cámara. Verifica los permisos.");
                }
            }
        }

        startCamera();

        const handleVisibility = () => {
            if (document.hidden) {
                stopCamera();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            stopCamera();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [stopCamera]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !cameraReady) return;

        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    stopCamera();
                    onCapture(blob);
                }
            }, "image/jpeg", 0.85);
        }
    }, [cameraReady, stopCamera, onCapture]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-[3/4] bg-muted rounded-2xl overflow-hidden border-2 border-primary/20">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-white">
                        <X className="h-12 w-12 text-destructive mb-4" />
                        <p className="text-sm mb-4">{error}</p>
                        {onGalleryUpload && (
                            <Button onClick={() => { stopCamera(); onGalleryUpload(); }} variant="secondary" className="mb-2 w-full">
                                <Upload className="h-4 w-4 mr-2" /> Subir desde galería
                            </Button>
                        )}
                        <Button onClick={onCancel} variant="outline" className="text-foreground">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
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
                        onClick={() => { stopCamera(); onCancel(); }}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <Button
                        size="lg"
                        className="rounded-full h-20 w-20 bg-primary hover:bg-primary/90 disabled:opacity-50"
                        onClick={capturePhoto}
                        disabled={!cameraReady}
                    >
                        <Camera className="h-8 w-8" />
                    </Button>

                    {onGalleryUpload && (
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-full h-16 w-16 bg-white/10 border-white/20 text-white"
                            onClick={() => { stopCamera(); onGalleryUpload(); }}
                        >
                            <Upload className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
