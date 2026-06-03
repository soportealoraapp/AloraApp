import { calculateActivationScore } from './activation-score';

export interface ActivationTask {
  id: string;
  title: string;
  completed: boolean;
  rewardText: string;
}

const TASK_DEFINITIONS: Record<string, { title: string; rewardText: string }> = {
  'Completar el onboarding': {
    title: 'Completa tu registro',
    rewardText: 'Desbloquea el acceso completo a la app',
  },
  'Escribir una biografía': {
    title: 'Escribe tu biografía',
    rewardText: 'Los perfiles con bio reciben 2x más visitas',
  },
  'Seleccionar al menos 3 intereses': {
    title: 'Elige 3 intereses',
    rewardText: 'Ayuda a encontrar personas compatibles',
  },
  'Seleccionar al menos 2 valores': {
    title: 'Define tus valores',
    rewardText: 'Mejora la calidad de tus matches',
  },
  'Subir al menos 3 fotos': {
    title: 'Sube 3 fotos',
    rewardText: 'Los perfiles con fotos tienen 5x más matches',
  },
  'Grabar una introducción de voz': {
    title: 'Graba tu voz',
    rewardText: 'Tu voz aumenta tu visibilidad',
  },
  'Completar un quiz de compatibilidad': {
    title: 'Haz un quiz',
    rewardText: 'Mejora tu score de compatibilidad',
  },
  'Responder la pregunta del día': {
    title: 'Responde la pregunta diaria',
    rewardText: 'Muestra tu personalidad en los perfiles',
  },
  'Verificar tu identidad': {
    title: 'Verifícate',
    rewardText: 'Los verificados reciben más respuestas',
  },
  'Dar tu primer like': {
    title: 'Da tu primer like',
    rewardText: 'El primer paso para conectar',
  },
  'Conseguir tu primer match': {
    title: 'Consigue tu primer match',
    rewardText: 'Comienza a conversar',
  },
  'Enviar tu primer mensaje': {
    title: 'Envía tu primer mensaje',
    rewardText: 'Las conversaciones generan conexiones reales',
  },
};

export async function getActivationTasks(userId: string): Promise<ActivationTask[]> {
  if (!userId) return [];

  const result = await calculateActivationScore(userId);

  const allTaskIds = Object.keys(TASK_DEFINITIONS);
  const completedSet = new Set(
    allTaskIds.filter(id => !result.missingActions.includes(id))
  );

  const tasks: ActivationTask[] = allTaskIds.map((id, index) => ({
    id: `task-${index}`,
    title: TASK_DEFINITIONS[id].title,
    completed: completedSet.has(id),
    rewardText: TASK_DEFINITIONS[id].rewardText,
  }));

  return tasks;
}
