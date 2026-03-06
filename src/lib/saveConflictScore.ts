import { supabase } from '@/integrations/supabase/client';

interface GradeResult {
  overallGrade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  rewriteExample: string;
}

export const saveConflictScore = async (appUserId: string | null, grade: GradeResult) => {
  if (!appUserId) return;
  try {
    await supabase.functions.invoke('update-conflict-score', {
      body: {
        appUserId,
        overallGrade: grade.overallGrade,
        summary: grade.summary,
      },
    });
  } catch (err) {
    console.error('Failed to save conflict score:', err);
  }
};
