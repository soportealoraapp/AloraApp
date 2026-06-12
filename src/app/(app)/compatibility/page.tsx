'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { COMPATIBILITY_QUIZZES, Quiz, QuizQuestion } from '@/lib/compatibility/quizzes';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, Heart, MessageCircle, Zap, Target, ArrowRight, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { ARCHETYPES } from '@/lib/compatibility/quizzes';
import { DailyQuestionCard } from '@/components/daily-question/DailyQuestionCard';
import { DailyCompatibilityCard } from '@/components/compatibility/DailyCompatibilityCard';
import { Lightbulb, Info, Star } from 'lucide-react';

const icons: Record<string, any> = {
  Heart,
  MessageCircle,
  Zap,
  Target
};

export default function CompatibilityPage() {
  const { user } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  interface QuizResult { quizId: string; score: number; archetype: string; completedAt: string; }
  const [completedQuizzes, setCompletedQuizzes] = useState<QuizResult[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [loadError, setLoadError] = useState(false);

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
              <span>Sinceramente No</span>
              <span>Totalmente Sí</span>
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

  return (
    <div className="container max-w-lg mx-auto p-4 pb-24">
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
                "Las almas gemelas no se encuentran, se construyen sobre valores compartidos y comunicación honesta."
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
            <p className="text-[10px] text-muted-foreground mt-1 italic">Completa quizzes para desbloquear icebreakers exclusivos.</p>
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
          const isDisabled = isCompleted || loadingCompleted;
          const archetypeInfo = result ? ARCHETYPES[result.archetype] : null;

          return (
            <Card
              key={quiz.id}
              onClick={() => !isDisabled && handleStartQuiz(quiz)}
              className={`group border shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isCompleted ? 'bg-muted/30' : 'bg-card'}`}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${isCompleted ? 'bg-green-100' : 'bg-primary/10 group-hover:bg-primary/20'
                  } transition-colors`}>
                  <Icon className={`w-6 h-6 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {quiz.title}
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {quiz.description}
                  </p>
                  {isCompleted && result && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        {result.score}/100
                      </span>
                      {archetypeInfo && (
                        <span className="text-xs text-muted-foreground">
                          {archetypeInfo.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isCompleted && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
  );
}
