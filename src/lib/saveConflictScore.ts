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
    await supabase
      .from('app_users')
      .update({
        conflict_grade: grade.overallGrade,
        conflict_summary: grade.summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appUserId);
  } catch (err) {
    console.error('Failed to save conflict score:', err);
  }
};
