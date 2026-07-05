'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Check, Send, Heart, Target, MessageSquare, Link2, Sun, TrendingUp, Sparkles, Smile, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSendLike } from '@/hooks/use-send-like';
import { useAuth } from '@/contexts/AuthContext';
import { DailyAnswersModal } from '@/components/daily-question/DailyAnswersModal';
import dynamic from 'next/dynamic';
const MatchScreen = dynamic(() => import('@/components/ui/premium/MatchScreen').then(m => m.MatchScreen), { ssr: false });

import { UserProfile } from '@/lib/domain/types';

interface DailyQuestionData {
    question: string;
    category: string;
    questionId: string;
    userAnswer: string | null;
    answered: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    values: 'Valores',
    goals: 'Metas',
    communication: 'Comunicación',
    connection: 'Conexión',
    lifestyle: 'Estilo de vida',
    growth: 'Crecimiento',
    dating: 'Citas',
    personality: 'Personalidad',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    values: Heart,
    goals: Target,
    communication: MessageSquare,
    connection: Link2,
    lifestyle: Sun,
    growth: TrendingUp,
    dating: Sparkles,
    personality: Smile,
};

export function DailyQuestionCard() {
    const { toast } = useToast();
    const router = useRouter();
    const { sendLike } = useSendLike();
    const { profile: currentUserProfile } = useAuth();
    const [data, setData] = useState<DailyQuestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState(false);

    // Modal state for viewing others' answers
    const [showAnswersModal, setShowAnswersModal] = useState(false);
    const [otherAnswers, setOtherAnswers] = useState<{ id: string; userId: string; answer: string; profile: { userId: string; displayName: string; age?: number; city?: string; isVerified?: boolean; photos?: string[] } }[]>([]);
    const [loadingAnswers, setLoadingAnswers] = useState(false);

    // Match screen state
    const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
    const [matchId, setMatchId] = useState<string | undefined>(undefined);
    const [showMatchScreen, setShowMatchScreen] = useState(false);
    const [nextQuestionCountdown, setNextQuestionCountdown] = useState('');

    const updateCountdown = useCallback(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCHours(24, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(msUntilMidnight / (1000 * 60 * 60));
        const minutes = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
        setNextQuestionCountdown(`${hours}h ${minutes}m`);
    }, []);

    useEffect(() => {
        fetchQuestion();
        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, []);

    // Re-fetch question at midnight UTC for daily rollover
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCHours(24, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        const timeout = setTimeout(() => {
            fetchQuestion();
        }, msUntilMidnight + 1000); // +1s buffer after midnight
        return () => clearTimeout(timeout);
    }, [data?.questionId]);

    useEffect(() => {
        if (showAnswersModal && data?.questionId) {
            fetchOtherAnswers();
        }
    }, [showAnswersModal, data?.questionId]);

    const fetchQuestion = async () => {
        try {
            setFetchError(false);
            const res = await fetch('/api/daily-question', {
                headers: { 'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const result = await res.json();
            setData(result);
            if (result.userAnswer) {
                setAnswer(result.userAnswer);
            }
        } catch (error) {
            console.error('Error fetching daily question:', error);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchOtherAnswers = async () => {
        if (!data?.questionId) return;
        setLoadingAnswers(true);
        try {
            const res = await fetch(`/api/compatibility/question-answers?questionId=${data.questionId}`);
            if (res.ok) {
                const result = await res.json();
                const answers = (result.answers || []).filter(
                    (a: any) => a.profile?.userId !== currentUserProfile?.id
                );
                setOtherAnswers(answers);
            }
        } catch (err) {
            console.error('Error fetching other answers:', err);
        } finally {
            setLoadingAnswers(false);
        }
    };

    const handleSubmit = async () => {
        if (!answer.trim() || !data) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/daily-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId: data.questionId, answer: answer.trim() })
            });

            if (!res.ok) throw new Error('Error al guardar respuesta');

            toast({ title: 'Respuesta guardada', description: 'Tu respuesta ya influye en tu compatibilidad y se ve en tu perfil.' });
            setData({ ...data, userAnswer: answer.trim(), answered: true });
            setEditing(false);
            
            // Dispatch custom event for mission completion tracking
            window.dispatchEvent(new CustomEvent('daily-question-answered'));
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAction = async (answerItem: any, actionType: 'like' | 'superlike' | 'pass') => {
        if (actionType === 'pass') {
            await sendLike(answerItem.userId || answerItem.profile.userId, 'pass', 'dating').catch(() => {});
            return;
        }

        try {
            const result = await sendLike(answerItem.userId || answerItem.profile.userId, actionType, 'dating');
            if (result?.matched && answerItem?.profile) {
                setMatchedProfile(answerItem.profile);
                setMatchId(result.matchId);
                setShowMatchScreen(true);
            }
        } catch (err) {
            console.error('Failed to process interaction:', err);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-primary h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    if (fetchError) {
        return (
            <Card>
                <CardContent className="py-6 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">No se pudo cargar la pregunta del día</p>
                    <Button size="sm" variant="outline" onClick={fetchQuestion}>
                        Reintentar
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <>
            <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            Pregunta del día
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs gap-1">
                            {(() => {
                                const Icon = CATEGORY_ICONS[data.category];
                                return Icon ? <Icon className="h-3 w-3" /> : null;
                            })()}
                            {CATEGORY_LABELS[data.category] || data.category}
                        </Badge>
                    </div>
                    {data.answered && nextQuestionCountdown && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Siguiente pregunta en: {nextQuestionCountdown}
                        </p>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                        {data.question}
                    </p>

                    {data.answered && !editing ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                <div className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-foreground mb-1">Tu respuesta:</p>
                                        <p className="text-sm text-foreground">{data.userAnswer}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="text-xs font-medium text-primary hover:underline shrink-0 mt-0.5"
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                            
                            <Button
                                onClick={() => setShowAnswersModal(true)}
                                className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:shadow-md transition-all"
                            >
                                <Users className="h-4 w-4" />
                                Ver qué contestaron otros
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Comparte tu respuesta..."
                                className="min-h-[80px] max-h-[200px] overflow-y-auto resize-none text-sm"
                                maxLength={300}
                            />
                            <div className="flex items-center justify-between">
                                <span className={`text-xs ${(answer.length / 300) >= 0.9 ? 'text-red-500 font-medium' : (answer.length / 300) >= 0.7 ? 'text-amber-500 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                                    {answer.length}/300
                                </span>
                                <div className="flex items-center gap-2">
                                    {editing && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditing(false);
                                                setAnswer(data?.userAnswer || '');
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={!answer.trim() || submitting}
                                        className="bg-gradient-to-r from-primary to-primary/80"
                                    >
                                        {submitting ? (
                                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                                        ) : (
                                            <Send className="h-3 w-3 mr-1" />
                                        )}
                                        {editing ? 'Actualizar' : 'Enviar'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Answers Modal */}
            <DailyAnswersModal
                open={showAnswersModal}
                onClose={() => setShowAnswersModal(false)}
                question={data.question}
                loading={loadingAnswers}
                answers={otherAnswers}
                onLike={(userId) => handleAction(otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId), 'like')}
                onSuperlike={(userId) => handleAction(otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId), 'superlike')}
                onPass={(userId) => handleAction(otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId), 'pass')}
            />

            {/* Match Screen animation fallback overlay */}
            {showMatchScreen && matchedProfile && currentUserProfile && (
                <MatchScreen
                    userProfile={currentUserProfile as unknown as UserProfile}
                    matchedProfile={matchedProfile}
                    matchId={matchId}
                    onChat={() => {
                        setShowMatchScreen(false);
                        setShowAnswersModal(false);
                        router.push(`/chat/${matchId}`);
                    }}
                    onKeepSwiping={() => {
                        setShowMatchScreen(false);
                        setMatchId(undefined);
                    }}
                />
            )}
        </>
    );
}
