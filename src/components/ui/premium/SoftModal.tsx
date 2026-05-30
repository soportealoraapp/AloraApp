'use client';

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { AnimatePresence, motion } from "framer-motion";

interface SoftModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function SoftModal({ isOpen, onClose, title, children }: SoftModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <AnimatePresence>
                {isOpen && (
                    <DialogContent className="bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-3xl max-w-md">
                        {title ? (
                            <DialogTitle className="text-center text-xl font-bold text-pink-500 mb-4">{title}</DialogTitle>
                        ) : (
                            <VisuallyHidden><DialogTitle>Modal</DialogTitle></VisuallyHidden>
                        )}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            {children}
                        </motion.div>
                    </DialogContent>
                )}
            </AnimatePresence>
        </Dialog>
    );
}
