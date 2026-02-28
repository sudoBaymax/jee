

## Plan: Improve Assessment with ECR-R Questions + AI-Powered Analysis

### What changes

1. **Expand questionnaire to 20 items** based on the ECR-R (Experiences in Close Relationships - Revised) scale — the gold standard for attachment measurement. Include reverse-coded items for accuracy. Organize into two validated subscales: Anxiety (fear of abandonment) and Avoidance (discomfort with closeness). Secure = low on both.

2. **Add "Fearful-Avoidant / Disorganized" category** — high anxiety + high avoidance. Update `AssessmentResult` interface to include this fourth style and add `aiInsight` and `patterns` fields.

3. **Enable Lovable Cloud + create an edge function** (`supabase/functions/assess/index.ts`) that sends the raw answers + scores to Gemini via Lovable AI Gateway. The AI will:
   - Validate the scoring against known attachment research
   - Generate a personalized narrative explanation of the user's style
   - Identify specific triggers based on their answer patterns (not just a hardcoded map)
   - Suggest tailored growth areas

4. **Update the Assessment page** to:
   - Show a loading state while AI analyzes results
   - Display the AI-generated personalized insight alongside the bar chart scores
   - Show AI-identified triggers instead of hardcoded ones
   - Handle errors gracefully (fall back to rule-based results if AI fails)

5. **Update `AppContext.tsx`** — extend `AssessmentResult` with `aiInsight?: string`, `patterns?: string[]`, and `fearfulAvoidant?: number`.

### Technical details

- **Scoring**: Two-axis model (Anxiety score, Avoidance score) from 1-7 scale across 20 items. Reverse-code ~half the items. Classification: Secure (low/low), Anxious-Preoccupied (high anxiety/low avoidance), Dismissive-Avoidant (low anxiety/high avoidance), Fearful-Avoidant (high/high).
- **Edge function**: Non-streaming call to `google/gemini-3-flash-preview` with structured tool-calling output for triggers, patterns, and narrative.
- **Fallback**: If AI call fails (network, rate limit), the app still shows rule-based results from local scoring — AI insight section simply hidden.
- **Config**: Add `[functions.assess]` with `verify_jwt = false` to `supabase/config.toml`.

### Files to create/modify

| File | Action |
|------|--------|
| `supabase/config.toml` | Create — register `assess` function |
| `supabase/functions/assess/index.ts` | Create — edge function calling Gemini for personalized analysis |
| `src/context/AppContext.tsx` | Modify — extend `AssessmentResult` interface |
| `src/pages/Assessment.tsx` | Modify — new 20-question ECR-R questionnaire, two-axis scoring, AI analysis call, updated results UI |

