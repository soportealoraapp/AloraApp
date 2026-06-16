'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Check, Send, Heart, Target, MessageSquare, Link2, Sun, TrendingUp, Sparkles, Smile, Users, MapPin, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/contexts/AuthContext';
import { HeartArrow } from '@/components/ui/custom/HeartArrow';
import { MatchScreen } from '@/components/ui/premium/MatchScreen';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
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

const cardVariants = {
    enter: (direction: 'left' | 'right' | 'up') => ({
        x: direction === 'left' ? -350 : direction === 'right' ? 350 : 0,
        y: direction === 'up' ? 350 : 0,
        opacity: 0,
        scale: 0.95
    }),
    center: {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
    },
    exit: (direction: 'left' | 'right' | 'up') => ({
        x: direction === 'left' ? -350 : direction === 'right' ? 350 : 0,
        y: direction === 'up' ? -350 : 0,
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 }
    })
};

export function DailyQuestionCard() {
    const { toast } = useToast();
    const { sendLike } = useMatches();
    const { profile: currentUserProfile } = useAuth();
    const [data, setData] = useState<DailyQuestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState(false);

    // Modal state for viewing others' answers
    const [showAnswersModal, setShowAnswersModal] = useState(false);
    const [otherAnswers, setOtherAnswers] = useState<any[]>([]);
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right' | 'up'>('right');

    // Match screen state
    const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
    const [matchId, setMatchId] = useState<string | undefined>(undefined);
    const [showMatchScreen, setShowMatchScreen] = useState(false);

    useEffect(() => {
        fetchQuestion();
    }, []);

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
                setOtherAnswers(result.answers || []);
                setCurrentIndex(0);
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

    const handleAction = async (targetUserId: string, actionType: 'like' | 'superlike' | 'pass') => {
        const dir = actionType === 'pass' ? 'left' : actionType === 'superlike' ? 'up' : 'right';
        setDirection(dir);

        // Capture profile before changing index
        const currentAnswerItem = otherAnswers[currentIndex];
        
        // Advance deck index
        setCurrentIndex(prev => prev + 1);

        if (actionType === 'pass') {
            await sendLike(targetUserId, 'pass', 'dating').catch(() => {});
            return;
        }

        try {
            const result = await sendLike(targetUserId, actionType, 'dating');
            if (result?.matched && currentAnswerItem?.profile) {
                setMatchedProfile(currentAnswerItem.profile);
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

    const currentAnswer = otherAnswers[currentIndex];

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
                                <span className={`text-xs ${(answer.length / 300) >= 0.9 ? 'text-red-500 font-medium' : (answer.length / 300) >= 0.7 ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
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
            <Dialog open={showAnswersModal} onOpenChange={setShowAnswersModal}>
                <DialogContent className="max-w-[400px] w-[95%] p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-gradient-to-b from-background to-muted/20">
                    <DialogHeader className="p-5 pb-2 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-black flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Respuestas
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {data.question}
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setShowAnswersModal(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>

                    <div className="p-5 h-[450px] flex flex-col justify-between relative overflow-hidden">
                        {loadingAnswers ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary h-8 w-8" />
                            </div>
                        ) : otherAnswers.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-bold text-foreground">Aún no hay respuestas</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                                    Parece que eres de los primeros en responder hoy. Vuelve más tarde para ver qué dicen otras personas.
                                </p>
                            </div>
                        ) : currentIndex >= otherAnswers.length ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-full">
                                    <Check className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="font-bold text-foreground">¡Eso es todo por hoy!</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                                    Has visto todas las respuestas disponibles de hoy. ¡Vuelve mañana para más reflexiones!
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentIndex}
                                    custom={direction}
                                    variants={cardVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="flex-1 flex flex-col justify-between h-full w-full"
                                >
                                    {/* Card */}
                                    <div className="flex-1 bg-card border rounded-3xl overflow-hidden shadow-md flex flex-col relative group">
                                        {/* Avatar header */}
                                        <div className="p-4 flex items-center gap-3 border-b bg-muted/10">
                                            <Link
                                                href={`/profile/${currentAnswer.profile.userId}`}
                                                className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 hover:opacity-90 transition-opacity"
                                                onClick={() => setShowAnswersModal(false)}
                                            >
                                                <Image
                                                    src={currentAnswer.profile.photos?.[0] || '/placeholder.svg'}
                                                    alt={currentAnswer.profile.displayName}
                                                    fill
                                                    className="object-cover"
                                                    loading="lazy"
                                                />
                                            </Link>
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/profile/${currentAnswer.profile.userId}`}
                                                    className="font-bold text-foreground hover:text-primary transition-colors hover:underline text-sm flex items-center gap-1.5"
                                                    onClick={() => setShowAnswersModal(false)}
                                                >
                                                    {currentAnswer.profile.displayName}, {currentAnswer.profile.age}
                                                    {currentAnswer.profile.isVerified && (
                                                        <Badge variant="secondary" className="px-1 py-0 h-4 bg-blue-500/10 text-blue-500 border-none font-bold text-[9px]">
                                                            ✓
                                                        </Badge>
                                                    )}
                                                </Link>
                                                {currentAnswer.profile.city && (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3" /> {currentAnswer.profile.city}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Answer text */}
                                        <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-b from-transparent to-primary/5">
                                            <div className="text-primary/40 text-4xl font-serif leading-none -mt-4 mb-2 select-none">&ldquo;</div>
                                            <p className="text-sm font-medium text-foreground leading-relaxed italic px-2">
                                                {currentAnswer.answer}
                                            </p>
                                            <div className="text-primary/40 text-4xl font-serif leading-none mt-2 text-right select-none">&rdquo;</div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-center gap-4 pt-4 shrink-0">
                                        <button
                                            onClick={() => handleAction(currentAnswer.profile.userId, 'pass')}
                                            className="bg-card hover:bg-muted text-destructive rounded-full w-12 h-12 flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 border border-border"
                                            title="Pasar"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(currentAnswer.profile.userId, 'superlike')}
                                            className="bg-accent hover:bg-accent/90 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border border-accent/20"
                                            title="Flechado"
                                        >
                                            <HeartArrow className="h-6 w-6" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(currentAnswer.profile.userId, 'like')}
                                            className="bg-primary hover:bg-primary/95 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
                                            title="Like"
                                        >
                                            <Heart className="h-5 w-5 fill-current" />
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Match Screen animation fallback overlay */}
            {showMatchScreen && matchedProfile && currentUserProfile && (
                <MatchScreen
                    userProfile={currentUserProfile as unknown as UserProfile}
                    matchedProfile={matchedProfile}
                    matchId={matchId}
                    onChat={() => {
                        setShowMatchScreen(false);
                        setShowAnswersModal(false);
                        window.location.href = `/chat/${matchId}`;
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
