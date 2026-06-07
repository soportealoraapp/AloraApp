export interface QuizQuestion {
    id: string;
    question: string;
    text?: string;
    type?: 'choice' | 'scale';
    options?: { id: string; text: string; score: number }[];
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    questions: QuizQuestion[];
}

export interface ArchetypeInfo {
    name: string;
    description: string;
    strengths: string[];
    risks: string[];
    idealPartner: string[];
    perception: string;
}
