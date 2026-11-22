import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupDraft } from '@/features/onboarding/setup-draft';
import { FigmaManualPlan } from '@/features/onboarding/figma-manual-plan';
import { PlanCompletionScreen, PlanLoadingScreen } from '@/features/onboarding/figma-plan-screens';
import type { OnboardingProgress } from '@/features/onboarding/progress-repository';
import { starterPlan } from '@/features/onboarding/setup-model';
import type { PlanDraftInput } from '@/features/plans/plan-draft-model';

/** Same production components, explicit sample inputs; no test-native port/Auth/storage. */
export function PlanDesignReview({ width = 393 }: { width?: number }) {
  const [page, setPage] = useState<'plan' | 'manual' | 'loading' | 'complete'>('plan');
  const [progress, setProgress] = useState<OnboardingProgress>({ version: 1, step: 'plan',
    activities: { selected_activity_ids: ['gym', 'reading'], custom_text: null },
    planDraft: { weekdays: [0,1,2,3,4,5,6], hours: { start_local: '09:00', end_local: '22:00', next_day: false }, timezone_id: 'America/New_York', session_count: 1, session_minutes: 10 } });
  const [input, setInput] = useState<Exclude<PlanDraftInput, null>>(() => starterPlan('America/New_York'));
  const [notice, setNotice] = useState('');
  return <main data-testid="HOOSH_PLAN_DESIGN_REVIEW_ONLY" style={{ padding: 16, minHeight: '100vh' }}>
    <div style={{ maxWidth: 560, margin: '0 auto 16px', fontSize: 13 }}>
      <strong>Hoosh plan screens</strong><p>These are the production onboarding components with Figma’s sample selections. This preview does not save an account or activate Screen Time.</p>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{(['plan','manual','loading','complete'] as const).map(value =>
        <button key={value} onClick={() => { setPage(value); setNotice(''); }} aria-current={page === value ? 'page' : undefined} style={{ padding: 8 }}>{({ plan: 'Suggested plan', manual: 'Manual setup', loading: 'Preparing plan', complete: 'Completion' })[value]}</button>)}</nav>
      <p role="status">{notice || 'Use the phone controls below to review the flow.'}</p>
    </div>
    <div className="phone" style={{ width: `min(${width}px, 100%)`, height: 852, margin: '0 auto', position: 'relative', background: '#222' }}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 852 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
        {page === 'loading' ? <PlanLoadingScreen apps="Instagram · Snapchat" hobbies="Gym · Reading" onSkip={() => setPage('plan')} />
          : page === 'complete' ? <PlanCompletionScreen hobbies={['Gym','Reading']} onFinish={() => { setNotice('Preview finished. No account or device settings changed.'); setPage('plan'); }} />
          : page === 'manual' ? <FigmaManualPlan input={input} onChange={setInput} busy={false} appSummary="Instagram, TikTok, YouTube"
            onBack={() => setPage('plan')} onSave={() => { setNotice('Manual draft reviewed in this preview only. In the app, account save and device review follow.'); setPage('complete'); }} />
          : <SetupDraft progress={progress} busy={false} failed={false} onSave={next => { setProgress({ ...next, step: 'plan' }); setNotice('Suggestion reviewed. In the app, account save and device review follow.'); setPage('complete'); }}
            onLeave={() => setNotice('Preview skipped. No account data changed.')} onDiscard={() => undefined}
            suggestion={{ planDraft: progress.planDraft!, description: 'Protect Instagram and Snapchat with 10-minute breaks. Make room for Gym and Reading.',
              apps: [{ name: 'Instagram', icon: 'instagram', minutes: 10, detail: 'Replaces one 10-minute scroll session daily, so you can keep more time for Gym.' },
                { name: 'Snapchat', icon: 'snapchat', minutes: 10, detail: 'Replaces one 10-minute scroll session daily, so you can keep more time for Reading.' }],
              estimate: { label: 'UP TO 2H 20M', detail: 'This is an illustrative estimate based on replacing one 10-minute scroll session on each app daily.' } }} />}
      </SafeAreaProvider>
      <div aria-hidden style={{ position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#adadad', pointerEvents: 'none' }}>9:41</div>
      <div aria-hidden style={{ position: 'absolute', bottom: 12, width: 97, height: 4, background: 'rgba(255,255,255,.19)', borderRadius: 2, left: 'calc(50% - 48.5px)', pointerEvents: 'none' }} />
    </div>
  </main>;
}
