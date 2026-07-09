import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

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
            {prompts.map((p) => (
                <Card key={p.id} className="app-prose-section rounded-2xl border-primary/10">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold text-primary uppercase tracking-wider">Pregunta</p>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-2">{p.question}</p>
                        <div className="bg-card/50 rounded-xl p-3 border border-primary/10">
                            <p className="text-sm text-foreground leading-relaxed">&ldquo;{p.answer}&rdquo;</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
