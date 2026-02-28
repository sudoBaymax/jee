import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserProfile {
  goals: string[];
  context: string;
  privacyMode: boolean;
  onboardingComplete: boolean;
}

export interface AssessmentResult {
  secure: number;
  anxious: number;
  avoidant: number;
  fearfulAvoidant: number;
  lean: string;
  triggers: string[];
  completedAt?: string;
  aiInsight?: string;
  patterns?: string[];
  growthAreas?: string[];
}

export interface DayProgress {
  day: number;
  completed: boolean;
  mood?: string;
  activation?: number;
  wins?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'partner' | 'coach';
  text: string;
  timestamp: Date;
}

interface AppState {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  assessment: AssessmentResult | null;
  setAssessment: (a: AssessmentResult) => void;
  progress: DayProgress[];
  setProgress: (p: DayProgress[]) => void;
  currentDay: number;
  setCurrentDay: (d: number) => void;
  chatActive: boolean;
  setChatActive: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be inside AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile>({
    goals: [],
    context: '',
    privacyMode: false,
    onboardingComplete: false,
  });
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [progress, setProgress] = useState<DayProgress[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [chatActive, setChatActive] = useState(false);

  return (
    <AppContext.Provider value={{ profile, setProfile, assessment, setAssessment, progress, setProgress, currentDay, setCurrentDay, chatActive, setChatActive }}>
      {children}
    </AppContext.Provider>
  );
};
