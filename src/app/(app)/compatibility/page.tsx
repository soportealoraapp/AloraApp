'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { COMPATIBILITY_QUIZZES, Quiz, QuizQuestion } from '@/lib/compatibility/quizzes';
import { useAuth } from '@/contexts/AuthContext';
import { useSendLike } from '@/hooks/use-send-like';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Heart, MessageCircle, Zap, Target, ArrowRight, ArrowLeft, Trophy, Sparkles, X, Users, ChevronRight, Sun, Home, Shield, Gamepad2, Brain } from 'lucide-react';
import { ARCHETYPES } from '@/lib/compatibility/quizzes';
import { DailyQuestionCard } from '@/components/daily-question/DailyQuestionCard';
import { DailyCompatibilityCard } from '@/components/compatibility/DailyCompatibilityCard';
import { Lightbulb, Star } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const icons: Record<string, any> = {
  Heart,
  MessageCircle,
  Zap,
  Target,
  Sun,
  Home,
  Shield,
  Users,
  Gamepad2,
  Brain,
};

interface QuizResult { quizId: string; score: number; archetype: string; completedAt: string; }

interface SimilarUser {
  id: string;
  name: string;
  age?: number;
  photo?: string;
  archetype?: string;
  score?: number;
  city?: string;
  isVerified?: boolean;
  sharedInterests?: string[];
  sharedValues?: string[];
}

export default function CompatibilityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { sendLike } = useSendLike();

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<QuizResult[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Quiz Result Modal state
  const [selectedResult, setSelectedResult] = useState<{ quiz: Quiz; result: QuizResult } | null>(null);
  const [similarUsers, setSimilarUsers] = useState<SimilarUser[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [interactingId, setInteractingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoadingCompleted(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/compatibility/list', { cache: 'no-store' });
        if (!res.ok) throw new Error('list failed');
        const data = await res.json();
        if (!cancelled) {
          setCompletedQuizzes(
            Array.isArray(data.completedQuizzes) ? data.completedQuizzes : []
          );
        }
      } catch (err) {
        console.error('Error loading completed quizzes:', err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoadingCompleted(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentStep(0);
    setAnswers({});
  };

  const handleOpenResult = async (quiz: Quiz, result: QuizResult) => {
    setSelectedResult({ quiz, result });
    setLoadingSimilar(true);
    setSimilarUsers([]);
    try {
      const scoreParam = result.score !== undefined ? `&score=${result.score}` : '';
      const res = await fetch(`/api/compatibility/similar?archetype=${result.archetype}&quizId=${result.quizId}${scoreParam}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarUsers(Array.isArray(data.profiles) ? data.profiles : []);
      }
    } catch (e) {
      console.error('Error loading similar users:', e);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (selectedQuiz && currentStep < selectedQuiz.questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (selectedQuiz) {
      saveResults();
    }
  };

  const saveResults = async () => {
    if (!user || !selectedQuiz) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/compatibility/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          answers
        })
      });

      if (!response.ok) throw new Error('Error al guardar');
      const saved = await response.json();

      setCompletedQuizzes(prev =>
        prev.some(r => r.quizId === selectedQuiz.id)
          ? prev
          : [...prev, { quizId: selectedQuiz.id, score: saved.score ?? 0, archetype: saved.archetype ?? '', completedAt: new Date().toISOString() }]
      );
      setSelectedQuiz(null);
      toast({
        title: "¡Quiz completado!",
        description: `Tus respuestas para ${selectedQuiz.title} han sido guardadas.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLikeSimilar = async (targetId: string, type: 'like' | 'superlike') => {
    setInteractingId(targetId);
    try {
      await sendLike(targetId, type, 'dating', false);
      toast({ title: type === 'superlike' ? '💘 Flechado enviado' : '❤️ Like enviado' });
      setSimilarUsers(prev => prev.filter(u => u.id !== targetId));
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar', variant: 'destructive' });
    } finally {
      setInteractingId(null);
    }
  };

  const renderQuestion = (question: QuizQuestion) => {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <h3 className="text-xl font-medium text-foreground leading-tight">
          {question.text || question.question}
        </h3>

        {question.type === 'scale' && (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Totalmente en desacuerdo</span>
              <span>Totalmente de acuerdo</span>
            </div>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  onClick={() => handleAnswer(question.id, val)}
                  className={`h-12 w-full rounded-xl transition-all border-2 ${answers[question.id] === val
                      ? 'bg-primary/20 border-primary scale-105 shadow-md text-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                    }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        {(question.type === 'choice' || !question.type) && question.options && (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt: any) => (
              <button
                key={String(opt.value || opt.id)}
                onClick={() => handleAnswer(question.id, opt.value || opt.id)}
                className={`p-4 text-left rounded-2xl border-2 transition-all ${answers[question.id] === (opt.value || opt.id)
                    ? 'bg-primary/20 border-primary shadow-md text-primary'
                    : 'bg-card border-border text-foreground/70 hover:border-primary/30'
                  }`}
              >
                {opt.label || opt.text}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  if (selectedQuiz) {
    const question = selectedQuiz.questions[currentStep];
    const progress = ((currentStep + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="container max-w-lg mx-auto p-4 min-h-[90dvh] flex flex-col justify-center">
        <div className="mb-8 space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
            <span>Paso {currentStep + 1} de {selectedQuiz.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>

        <AnimatePresence mode="wait">
          <Card key={currentStep} className="border shadow-xl bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-0" />
            <CardContent className="p-8">
              {renderQuestion(question)}
            </CardContent>
          </Card>
        </AnimatePresence>

        <div className="mt-8 flex gap-4">
          <Button
            variant="ghost"
            onClick={() => currentStep > 0 ? setCurrentStep(prev => prev - 1) : setSelectedQuiz(null)}
            className="rounded-2xl h-14"
          >
            {currentStep === 0 ? 'Cancelar' : <ArrowLeft className="w-5 h-5" />}
          </Button>
          <Button
            onClick={handleNext}
            disabled={answers[question.id] === undefined || isSaving}
            className="flex-1 rounded-2xl h-14 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground font-semibold text-lg hover:shadow-lg transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : (
              currentStep === selectedQuiz.questions.length - 1 ? 'Finalizar' : <ArrowRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  const archetypeData = selectedResult ? ARCHETYPES[selectedResult.result.archetype] : null;

  return (
    <>
      <div className="container max-w-lg mx-auto p-4 pb-24 pt-safe">
        <header className="py-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            Conexión Profunda
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-tr from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
            Almas
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Donde la ciencia de la personalidad y el destino se encuentran para encontrar a tu alma gemela.
          </p>
        </header>

        {/* Sección Destacada: Tu Alma del Día */}
        <div className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-1 flex items-center gap-2">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            Tu Conexión del Día
          </h2>
          <DailyCompatibilityCard />
        </div>

        {/* Consejos de Alora */}
        <Card className="mb-10 border-none bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl overflow-hidden relative group cursor-pointer hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Lightbulb className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300">Consejo de Alora</h3>
                <p className="text-sm text-indigo-800/70 dark:text-indigo-400/70 leading-snug">
                  &quot;Las almas gemelas no se encuentran, se construyen sobre valores compartidos y comunicación honesta.&quot;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-1">
            Reflexión Diaria
          </h2>
          <DailyQuestionCard />
        </div>

        <div className="space-y-6">
          <div className="flex items-end justify-between px-1">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Viaje de Autodescubrimiento</h2>
              <p className="text-[10px] text-muted-foreground mt-1 italic">Toca un quiz completado para ver tu arquetipo y personas similares.</p>
            </div>
            <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded-lg">
              {completedQuizzes.length}/{COMPATIBILITY_QUIZZES.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
          {COMPATIBILITY_QUIZZES.map((quiz) => {
            const Icon = icons[quiz.icon] || Heart;
            const result = completedQuizzes.find(q => q.quizId === quiz.id);
            const isCompleted = !!result;
            const archetypeInfo = result ? ARCHETYPES[result.archetype] : null;

            return (
              <Card
                key={quiz.id}
                onClick={() => {
                  if (isCompleted && result) {
                    handleOpenResult(quiz, result);
                  } else if (!loadingCompleted) {
                    handleStartQuiz(quiz);
                  }
                }}
                className={cn(
                  'group border shadow-sm hover:shadow-lg transition-all rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98]',
                  isCompleted
                    ? 'bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                    : 'bg-card hover:border-primary/30',
                  loadingCompleted && !isCompleted && 'opacity-60 cursor-not-allowed'
                )}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-primary/10 group-hover:bg-primary/20'} transition-colors`}>
                    <Icon className={`w-6 h-6 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {quiz.title}
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {quiz.description}
                    </p>
                    {isCompleted && result && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-700/50">
                          {result.score}/100
                        </span>
                        {archetypeInfo && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            ✦ {archetypeInfo.name}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">Ver resultados →</span>
                      </div>
                    )}
                  </div>
                  {!isCompleted && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>

        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border border-border/50 space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" /> ¿Cómo funciona?
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Usamos tus respuestas para calcular un score de compatibilidad 0-100% con otros usuarios. Priorizamos valores y estilo de comunicación.
          </p>
        </div>
      </div>

      {/* Quiz Result Modal */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Resultados del quiz</DialogTitle>
            <DialogDescription>Tu arquetipo y personas con resultados similares</DialogDescription>
          </DialogHeader>

          {selectedResult && archetypeData && (
            <>
              {/* Hero gradient */}
              <div className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Trophy className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-widest font-bold">{selectedResult.quiz.title}</p>
                      <h2 className="text-2xl font-black">{archetypeData.name}</h2>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-4xl font-black">{selectedResult.result.score}</div>
                      <div className="text-white/70 text-xs">/100</div>
                    </div>
                  </div>
                  <p className="text-white/85 text-sm leading-relaxed">{archetypeData.description}</p>
                </div>
              </div>

              <div className="p-6 space-y-6 bg-background">
                {/* Perception */}
                {archetypeData.perception && (
                  <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">¿Cómo te perciben?</p>
                    <p className="text-sm text-foreground/80 leading-relaxed italic">&ldquo;{archetypeData.perception}&rdquo;</p>
                  </div>
                )}

                {/* Strengths & Risks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Fortalezas
                    </p>
                    <div className="space-y-1.5">
                      {archetypeData.strengths?.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-foreground/80">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> A trabajar
                    </p>
                    <div className="space-y-1.5">
                      {archetypeData.risks?.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          <span className="text-foreground/80">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ideal partners */}
                {archetypeData.idealPartner && archetypeData.idealPartner.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mejor conectas con</p>
                    <div className="flex flex-wrap gap-2">
                      {archetypeData.idealPartner.map((p, i) => (
                        <Badge key={i} variant="secondary" className="rounded-full px-3 text-xs">
                          ✦ {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Similar users */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">Personas con resultados similares</p>
                  </div>

                  {loadingSimilar ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : similarUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Aún no hay suficientes perfiles similares.<br />¡Invita amigos para descubrir más almas compatibles!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {similarUsers.map((u) => (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card/80 hover:border-primary/30 transition-all"
                        >
                          <div
                            className="h-12 w-12 rounded-2xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                            onClick={() => { setSelectedResult(null); router.push(`/profile/${u.id}`); }}
                          >
                            {u.photo ? (
                              <Image src={u.photo} alt={u.name} width={48} height={48} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {u.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {u.name}{u.age ? `, ${u.age}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{u.city || u.archetype || 'Alma similar'}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleLikeSimilar(u.id, 'like')}
                              disabled={interactingId === u.id}
                              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all active:scale-95"
                            >
                              {interactingId === u.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Heart className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleLikeSimilar(u.id, 'superlike')}
                              disabled={interactingId === u.id}
                              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl bg-muted hover:bg-pink-100 hover:text-pink-500 dark:hover:bg-pink-950/40 flex items-center justify-center transition-all active:scale-95"
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402zM7.6 2c-2.497 0-4.6 1.939-4.6 4.191 0 3.633 4.87 8.044 9 12.384 4.13-4.34 9-8.75 9-12.384 0-2.25-2.067-4.181-4.274-4.181-1.164 0-3.422.576-4.726 4.063l-.5 1.3-.5-1.3C10.195 2.58 8.97 2 7.6 2z"/>
                                <path d="M12 8l1.5-3 1.5 3 3.2.465-2.317 2.257.547 3.189L14 13l-2.43 1.278.547-3.167L9.8 8.465z"/>
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setSelectedResult(null)}
                  variant="outline"
                  className="w-full rounded-2xl"
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
