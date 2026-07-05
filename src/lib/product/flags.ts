import { prisma } from '@/lib/prisma';

export interface FlagConfig {
  voiceIntroBoost: number;
  verificationPriority: number;
  activationCardEnabled: boolean;
  dailyPickReasoning: 'engine' | 'simple';
}

const DEFAULT_FLAGS: FlagConfig = {
  voiceIntroBoost: 15,
  verificationPriority: 20,
  activationCardEnabled: true,
  dailyPickReasoning: 'engine',
};

export async function getFlags(userId: string): Promise<FlagConfig> {
  if (!userId) return DEFAULT_FLAGS;

  const assignments = await prisma.experimentAssignment.findMany({
    where: { userId },
    include: { variant: true, experiment: true },
  });

  const flags = { ...DEFAULT_FLAGS };

  for (const a of assignments) {
    if (a.experiment.status !== 'running') continue;
    const vName = a.variant.name;

    switch (a.experiment.name) {
      case 'discover_scoring_v2':
        if (vName === 'treatment') {
          flags.voiceIntroBoost = 20;
          flags.verificationPriority = 25;
        } else {
          flags.voiceIntroBoost = 10;
          flags.verificationPriority = 15;
        }
        break;
      case 'activation_card_test':
        flags.activationCardEnabled = vName === 'treatment';
        break;
      case 'daily_pick_reasoning_test':
        flags.dailyPickReasoning = vName === 'treatment' ? 'engine' : 'simple';
        break;
    }
  }

  return flags;
}

export async function getFlag(userId: string, flagName: keyof FlagConfig): Promise<FlagConfig[keyof FlagConfig]> {
  const flags = await getFlags(userId);
  return flags[flagName];
}
