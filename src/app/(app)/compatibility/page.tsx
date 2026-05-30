'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { COMPATIBILITY_QUIZZES, Quiz, QuizQuestion } from '@/lib/compatibility/quizzes';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, Heart, MessageCircle, Zap, Target, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);

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

      setCompletedQuizzes(prev => [...prev, selectedQuiz.id]);
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
        <h3 className="text-xl font-medium text-pink-700 leading-tight">
          {question.text || question.question}
        </h3>

        {question.type === 'scale' && (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>Sinceramente No</span>
              <span>Totalmente Sí</span>
            </div>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  onClick={() => handleAnswer(question.id, val)}
                  className={`h-12 w-full rounded-xl transition-all border-2 ${answers[question.id] === val
                      ? 'bg-pink-100 border-pink-500 scale-105 shadow-md text-pink-700'
                      : 'bg-white border-pink-50 text-gray-400 hover:border-pink-200'
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
                    ? 'bg-pink-100 border-pink-500 shadow-md text-pink-700'
                    : 'bg-white border-pink-50 text-gray-600 hover:border-pink-100'
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
          <div className="flex justify-between items-center text-sm font-medium text-pink-400">
            <span>Paso {currentStep + 1} de {selectedQuiz.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-pink-50" />
        </div>

        <AnimatePresence mode="wait">
          <Card key={currentStep} className="border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
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
            className="flex-1 rounded-2xl h-14 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold text-lg hover:shadow-lg transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : (
              currentStep === selectedQuiz.questions.length - 1 ? 'Finalizar' : <ArrowRight className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto p-4 pb-24">
      <header className="py-8 space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-400 bg-clip-text text-transparent">
          Compatibilidad
        </h1>
        <p className="text-gray-500">
          Completa estos quizzes para mejorar tus matches y encontrar a alguien que comparta tus valores.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {COMPATIBILITY_QUIZZES.map((quiz) => {
          const Icon = icons[quiz.icon] || Heart;
          const isCompleted = completedQuizzes.includes(quiz.id);

          return (
            <Card
              key={quiz.id}
              onClick={() => !isCompleted && handleStartQuiz(quiz)}
              className={`group border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-3xl overflow-hidden ${isCompleted ? 'opacity-70 grayscale bg-gray-50' : 'bg-white'
                }`}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${isCompleted ? 'bg-gray-200' : 'bg-pink-100 group-hover:bg-pink-200'
                  } transition-colors`}>
                  <Icon className={`w-6 h-6 ${isCompleted ? 'text-gray-500' : 'text-pink-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    {quiz.title}
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {quiz.description}
                  </p>
                </div>
                {!isCompleted && (
                  <ArrowRight className="w-5 h-5 text-pink-300 group-hover:text-pink-500 transition-colors" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-pink-50 border border-white/50 space-y-3">
        <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
          <Zap className="w-4 h-4" /> ¿Cómo funciona?
        </h4>
        <p className="text-sm text-indigo-700/80 leading-relaxed">
          Usamos tus respuestas para calcular un score de compatibilidad 0-100% con otros usuarios. Priorizamos valores y estilo de comunicación.
        </p>
      </div>
    </div>
  );
}
