import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface PromptItem {
    id: string;
    promptId: string;
    question: string;
    answer: string;
    position: number;
}

export function PromptCards({ prompts }: { prompts: PromptItem[] }) {
    if (!prompts || prompts.length === 0) return null;

    return (
        <div className="space-y-3">
            {prompts.map((p, i) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.25) }}
                >
                    <Card
                        className="app-prose-section rounded-2xl border-l-4 border-l-primary/60 bg-gradient-to-r from-primary/5 to-transparent"
                        style={{ boxShadow: '0 1px 0 0 hsl(var(--border) / 0.4)' }}
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-primary/10">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-xs font-bold text-primary uppercase tracking-wider">Pregunta</p>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-2">{p.question}</p>
                            <div className="bg-card/60 rounded-xl p-3 border border-primary/10">
                                <p className="text-sm text-foreground leading-relaxed">&ldquo;{p.answer}&rdquo;</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
