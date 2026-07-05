'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Sparkles, Camera, Heart, MessageCircle, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/domain/types';
import { useRouter } from 'next/navigation';

interface Mission {
  id: string;
  day: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  route: string;
  completed: boolean;
}

const getMissions = (profile: Partial<UserProfile>): Mission[] => [
  {
    id: 'bio',
    day: 1,
    title: 'Escribe tu bio',
    description: 'Cuéntanos quién eres en tus propias palabras',
    icon: <BookOpen className="h-5 w-5" />,
    action: 'Escribir bio',
    route: '/profile/edit',
    completed: (profile?.bio?.length ?? 0) > 50,
  },
  {
    id: 'interests',
    day: 2,
    title: 'Selecciona 3 intereses',
    description: 'Ayúdanos a encontrar personas afines a ti',
    icon: <Heart className="h-5 w-5" />,
    action: 'Seleccionar intereses',
    route: '/profile/edit',
    completed: (profile?.interests?.length ?? 0) >= 3,
  },
  {
    id: 'values',
    day: 3,
    title: 'Selecciona 2 valores',
    description: 'Los valores son la base de las conexiones reales',
    icon: <Sparkles className="h-5 w-5" />,
    action: 'Seleccionar valores',
    route: '/profile/edit',
    completed: (profile?.values?.length ?? 0) >= 2,
  },
  {
    id: 'daily-question',
    day: 4,
    title: 'Responde la pregunta del día',
    description: 'Aparece en tu perfil y mejora tu compatibilidad',
    icon: <MessageCircle className="h-5 w-5" />,
    action: 'Responder pregunta',
    route: '/discover',
    completed: profile?.latestAnswer?.answered ?? false,
  },
  {
    id: 'photos',
    day: 5,
    title: 'Sube 2 fotos más',
    description: 'Las fotos aumentan tus posibilidades de match',
    icon: <Camera className="h-5 w-5" />,
    action: 'Subir fotos',
    route: '/profile/edit',
    completed: (profile?.photos?.length ?? 0) >= 3,
  },
  {
    id: 'quiz',
    day: 6,
    title: 'Haz un quiz',
    description: 'Descubre tu estilo de conexión y mejora tu compatibilidad',
    icon: <BookOpen className="h-5 w-5" />,
    action: 'Hacer quiz',
    route: '/compatibility',
    completed: (profile?.completedQuizzes ?? 0) > 0,
  },
  {
    id: 'verification',
    day: 7,
    title: 'Verifícate',
    description: 'Gana confianza y prioridad en discover',
    icon: <Shield className="h-5 w-5" />,
    action: 'Verificar identidad',
    route: '/settings/verification',
    completed: profile?.isVerified ?? false,
  },
];

export function PostOnboardingJourney() {
  const { profile } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    if (profile) {
      setMissions(getMissions(profile));
    }
  }, [profile]);

  useEffect(() => {
    const handleAnswered = () => {
      if (profile) {
        setMissions(getMissions({
          ...profile,
          latestAnswer: {
            questionId: profile.latestAnswer?.questionId ?? '',
            question: profile.latestAnswer?.question ?? null,
            category: profile.latestAnswer?.category ?? null,
            answer: profile.latestAnswer?.answer ?? '',
            createdAt: profile.latestAnswer?.createdAt ?? '',
            answered: true,
          }
        }));
      }
    };
    window.addEventListener('daily-question-answered', handleAnswered);
    return () => window.removeEventListener('daily-question-answered', handleAnswered);
  }, [profile]);

  const completedCount = missions.filter(m => m.completed).length;
  const progress = missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

  if (completedCount === missions.length && missions.length > 0) {
    return null;
  }

  const nextMission = missions.find(m => !m.completed);

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Tu semana en Alora</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{missions.length} misiones completadas</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {Math.round(progress)}%
        </Badge>
      </div>

      <Progress value={progress} className="h-1.5 mb-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de misiones" />

      {nextMission && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3"
        >
          <p className="text-xs text-muted-foreground mb-1">Próxima misión:</p>
          <button 
            onClick={() => router.push(nextMission.route)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              {nextMission.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{nextMission.title}</p>
              <p className="text-xs text-muted-foreground truncate">{nextMission.description}</p>
            </div>
            <div className="h-8 px-2 text-primary flex-shrink-0 flex items-center">
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </motion.div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors flex-shrink-0 min-w-[40px] ${
              mission.completed ? 'bg-primary/10' : 'bg-muted/30'
            }`}
          >
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${
              mission.completed
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {mission.completed ? <Check className="h-3.5 w-3.5" /> : mission.day}
            </div>
            <span className="text-[10px] text-muted-foreground text-center leading-tight whitespace-nowrap">
              {mission.day === nextMission?.day && !mission.completed ? 'Ahora' : `D${mission.day}`}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
