import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { colors, fonts } from '@/design/tokens';
import { manualPlanIcons } from './manual-plan-icons';
import { TimeRangeSlider } from './TimeRangeSlider';
import { DAYS, PLAN_APPS, defaultManualPlan, formatDays, formatTime, manualPlanDraftKey, manualPlanKey, parseManualPlan, parseTime, validateManualPlan, type ManualPlan, type PlanPanel } from './manual-plan';

export function ManualPlanScreen({ accountId, initialApps, onBack, onSaved }: { accountId: string; initialApps: string[]; onBack(): void; onSaved(): void }) {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState(() => defaultManualPlan(initialApps));
  const [expanded, setExpanded] = useState<PlanPanel>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftError, setDraftError] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const mounted = useRef(false);
  const busy = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(manualPlanDraftKey(accountId)).then(raw => {
      if (!alive) return;
      const restored = parseManualPlan(raw);
      if (restored) setPlan(restored);
      else if (raw) setNotice('Your saved plan draft could not be read. Please review your choices.');
      setStatus('ready');
    }).catch(() => { if (alive) setStatus('failed'); });
    return () => { alive = false; };
  }, [accountId, attempt]);
  const persistDraft = useCallback(() => {
    const value = JSON.stringify(plan);
    const next = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem(manualPlanDraftKey(accountId), value));
    writes.current = next;
    void next.then(() => { if (mounted.current) setDraftError(false); }).catch(() => { if (mounted.current) setDraftError(true); });
    return next;
  }, [accountId, plan]);
  useEffect(() => { if (status === 'ready') void persistDraft().catch(() => undefined); }, [persistDraft, status]);
  const save = async () => {
    const invalid = timeError || validateManualPlan(plan);
    if (invalid) { setNotice(invalid); return; }
    if (busy.current) return;
    busy.current = true; setSaving(true); setNotice(null);
    try {
      await persistDraft();
      if (!mounted.current) return;
      await AsyncStorage.setItem(manualPlanKey(accountId), JSON.stringify(plan));
      if (mounted.current) onSaved();
    } catch { if (mounted.current) setNotice('Your plan could not be saved. Please try again.'); }
    finally { busy.current = false; if (mounted.current) setSaving(false); }
  };
  const toggle = (panel: Exclude<PlanPanel, null>) => { setExpanded(current => current === panel ? null : panel); setNotice(null); };
  const patch = (change: Partial<ManualPlan>) => { setPlan(p => ({ ...p, ...change })); setNotice(null); };
  const invalid = timeError || validateManualPlan(plan);
  if (status !== 'ready' || saving) return <View style={s.loading}>{status === 'loading' || saving ? <><ActivityIndicator color={colors.action} /><Text style={s.footer}>{saving ? 'Saving your plan…' : 'Loading your plan…'}</Text></> : <><Text style={s.label}>Couldn’t load your plan</Text><Pressable accessibilityRole="button" onPress={() => { setStatus('loading'); setAttempt(n=>n+1); }} style={s.primary}><Text style={s.primaryText}>Try again</Text></Pressable></>}</View>;
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.page, { paddingTop: Math.max(insets.top, 44) + 4, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <Pressable accessibilityRole="button" disabled={saving} onPress={onBack} style={s.back}><Text style={s.backText}>‹  Back</Text></Pressable>
      <Text accessibilityRole="header" style={s.title}>Set up on your own</Text>
      <Text style={s.description}>Customize when and where do you want your personalized nudges to be</Text>
      <Text style={s.eyebrow}>MY PLAN</Text>
      <Section title="Active Days" summary={formatDays(plan.days)} icon="calendar" expanded={expanded === 'days'} onPress={() => toggle('days')}>
        <View style={s.dayRow}>{DAYS.map((day, i) => <Choice key={day} label={day} accessibilityLabel={day} selected={plan.days.includes(i)} onPress={() => patch({ days: plan.days.includes(i) ? plan.days.filter(d=>d!==i) : [...plan.days,i].sort((a,b)=>a-b) })} compact />)}</View>
        <View style={s.presets}>{[['Weekdays',[0,1,2,3,4]],['Every day',[0,1,2,3,4,5,6]],['Weekends',[5,6]]].map(([label, days]) => <Choice key={label as string} label={label as string} selected={plan.days.join() === (days as number[]).join()} onPress={() => patch({days:days as number[]})} />)}</View>
      </Section>
      <Section title="Active Hours" summary={`${formatTime(plan.startMinutes)} – ${formatTime(plan.endMinutes)}`} icon="clock" expanded={expanded === 'hours'} onPress={() => toggle('hours')}>
        <Text style={s.helper}>Nudges are active only within this time range. Move either handle to adjust.</Text>
        <HoursFields plan={plan} onChange={patch} onError={setTimeError} />
      </Section>
      <Section title="App Sessions" summary={`${plan.sessionsPerDay} ${plan.sessionsPerDay === 1 ? 'session' : 'sessions'}/day · ${plan.durationMinutes} min each`} icon="timer" expanded={expanded === 'sessions'} onPress={() => toggle('sessions')}>
        <View style={s.optionRow}><Text style={s.optionLabel}>Sessions per day</Text><View style={s.options}>{[1,2,3,4].map(n=><Choice key={n} label={String(n)} accessibilityLabel={`${n} ${n === 1 ? 'session' : 'sessions'} per day`} selected={plan.sessionsPerDay === n} onPress={()=>patch({sessionsPerDay:n})} />)}</View></View>
        <View style={s.optionRow}><Text style={s.optionLabel}>Duration (min)</Text><View style={s.options}>{[5,10,15,30].map(n=><Choice key={n} label={String(n)} accessibilityLabel={`${n} minutes per session`} selected={plan.durationMinutes === n} onPress={()=>patch({durationMinutes:n})} />)}</View></View>
      </Section>
      <View style={s.explanation}><Icon name="info" size={14} /><Text style={s.explanationText}>These are your planned times to use distracting apps — not how long nudges run.</Text></View>
      <Section title="Select Apps" summary={plan.apps.join(', ') || 'Choose apps'} icon="apps" expanded={expanded === 'apps'} onPress={() => toggle('apps')}>
        <View style={s.appGrid}>{PLAN_APPS.filter(app => app !== 'X' || initialApps.includes('X') || plan.apps.includes('X')).map(app=><View key={app} style={s.appCell}><Choice label={app} accessibilityLabel={app} selected={plan.apps.includes(app)} onPress={()=>patch({apps:plan.apps.includes(app)?plan.apps.filter(a=>a!==app):PLAN_APPS.filter(a=>a===app||plan.apps.includes(a))})} checkbox /></View>)}</View>
        <Text style={s.helper}>App preferences only. System app selection and protection are not activated.</Text>
      </Section>
      {draftError && <View style={s.warning}><Text style={s.error}>Couldn’t save your draft.</Text><Pressable accessibilityRole="button" onPress={()=>{void persistDraft().catch(()=>undefined);}} style={s.retry}><Text style={s.retryText}>Retry draft save</Text></Pressable></View>}
      {(notice || invalid) && <Text accessibilityRole="alert" style={s.error}>{notice || invalid}</Text>}
      <View style={s.divider} />
      <Pressable accessibilityRole="button" disabled={saving || !!invalid} accessibilityState={{disabled:saving || !!invalid}} onPress={()=>{void save();}} style={({pressed})=>[s.primary,(pressed||saving||!!invalid)&&s.disabled]}><Text style={s.primaryText}>{saving?'Saving…':'Save my plan'}</Text></Pressable>
      <Text style={s.footer}>Saved on this device. App protection has not been activated.</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Section({ title, summary, icon, expanded, onPress, children }: { title: string; summary: string; icon: keyof typeof manualPlanIcons; expanded: boolean; onPress(): void; children: ReactNode }) {
  // Keep hours inputs mounted when collapsed so invalid text cannot disappear behind Save.
  return <View style={[s.section,expanded&&s.expanded]}><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{expanded}} onPress={onPress} style={s.sectionHeader}>
    <View style={s.icon}><Icon name={icon} /></View><View style={s.sectionCopy}><Text style={s.label}>{title}</Text><Text style={s.summary}>{summary}</Text></View><View style={expanded&&s.rotate}><Icon name="chevron" size={18} /></View>
  </Pressable><View style={!expanded&&s.hidden}>{children}</View></View>;
}
function Choice({ label, accessibilityLabel, selected, onPress, checkbox=false, compact=false }: { label:string; accessibilityLabel?:string; selected:boolean; onPress():void; checkbox?:boolean; compact?:boolean }) {
  return <Pressable accessibilityRole={checkbox?'checkbox':'button'} accessibilityLabel={accessibilityLabel||label} accessibilityState={checkbox?{checked:selected}:{selected}} onPress={onPress} style={[s.choice,selected&&s.selected,compact&&s.compact]}>{checkbox && <View style={[s.checkbox,selected&&s.checkboxSelected]}>{selected&&<Text style={s.checkmark}>✓</Text>}</View>}<Text style={[s.choiceText,selected&&s.selectedText]}>{label}</Text></Pressable>;
}
function Icon({name,size=20}:{name:keyof typeof manualPlanIcons;size?:number}) { return <SvgXml xml={manualPlanIcons[name]} width={size} height={size} />; }
function HoursFields({plan,onChange,onError}:{plan:ManualPlan;onChange(p:Partial<ManualPlan>):void;onError(error:string|null):void}) {
  const [start,setStart]=useState(()=>formatTime(plan.startMinutes));const [end,setEnd]=useState(()=>formatTime(plan.endMinutes));
  const edit=(kind:'start'|'end',text:string)=>{
    const a=kind==='start'?text:start,b=kind==='end'?text:end;
    if(kind==='start')setStart(text);else setEnd(text);
    const from=parseTime(a),to=parseTime(b);
    const error=from===null||to===null?'Enter a valid time, such as 9:00 AM.':from>=to?'End time must be later than start time. Choose a range within the same day.':null;
    onError(error);
    if(!error)onChange({startMinutes:from!,endMinutes:to!});
  };
  const range=(from:number,to:number)=>{setStart(formatTime(from));setEnd(formatTime(to));onError(null);onChange({startMinutes:from,endMinutes:to});};
  return <><View style={s.timeRow}><View style={s.timeField}><Text style={s.timeLabel}>Start time</Text><TextInput accessibilityLabel="Start time" value={start} onChangeText={t=>edit('start',t)} style={s.timeValue} autoCorrect={false} selectTextOnFocus /></View><View style={s.timeField}><Text style={s.timeLabel}>End time</Text><TextInput accessibilityLabel="End time" value={end} onChangeText={t=>edit('end',t)} style={s.timeValue} autoCorrect={false} selectTextOnFocus /></View></View>
    <TimeRangeSlider start={plan.startMinutes} end={plan.endMinutes} onChange={range} /><View style={s.timeLegend}><Text style={s.legendText}>12:00 AM</Text><Text style={s.legendText}>12:00 PM</Text><Text style={s.legendText}>11:59 PM</Text></View></>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.darkCanvas},loading:{flex:1,backgroundColor:colors.darkCanvas,justifyContent:'center',padding:24,gap:20},page:{width:'100%',maxWidth:480,alignSelf:'center',paddingHorizontal:24},back:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',paddingRight:20},backText:{fontFamily:fonts.regular,color:colors.darkMuted,fontSize:13},title:{fontFamily:fonts.bold,color:colors.white,fontSize:26,lineHeight:34,marginTop:12},description:{fontFamily:fonts.light,color:colors.darkMuted,fontSize:14,lineHeight:19,marginTop:10},eyebrow:{fontFamily:fonts.medium,color:colors.darkMuted,fontSize:10,letterSpacing:1,marginTop:22,marginBottom:10},
  section:{borderRadius:14,backgroundColor:colors.darkCard,borderWidth:1,borderColor:'#393939',marginBottom:12,overflow:'hidden'},expanded:{borderColor:'#375940'},sectionHeader:{flexDirection:'row',alignItems:'center',gap:12,minHeight:68,padding:16},sectionCopy:{flex:1,minWidth:0,gap:4},icon:{width:36,height:36,borderRadius:10,backgroundColor:'#313131',alignItems:'center',justifyContent:'center'},label:{fontFamily:fonts.bold,color:colors.white,fontSize:14},summary:{fontFamily:fonts.light,color:colors.darkMuted,fontSize:12,lineHeight:16},rotate:{transform:[{rotate:'-90deg'}]},hidden:{display:'none'},
  dayRow:{flexDirection:'row',paddingHorizontal:12,gap:4},presets:{flexDirection:'row',gap:6,paddingHorizontal:16,paddingBottom:12},choice:{minHeight:44,flex:1,flexDirection:'row',gap:4,justifyContent:'center',alignItems:'center',paddingHorizontal:6,paddingVertical:8,backgroundColor:'#303030',borderRadius:7,borderWidth:1,borderColor:'#414141'},compact:{paddingHorizontal:0},checkbox:{width:12,height:12,borderWidth:1,borderColor:'#888888',borderRadius:2,alignItems:'center',justifyContent:'center'},checkboxSelected:{backgroundColor:colors.action,borderColor:colors.action},checkmark:{fontSize:10,lineHeight:11,color:'#111111'},selected:{backgroundColor:'#2b3c2f',borderColor:'#478953'},choiceText:{fontFamily:fonts.regular,color:colors.darkMuted,fontSize:11,textAlign:'center'},selectedText:{color:colors.action},optionRow:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,marginBottom:8},optionLabel:{fontFamily:fonts.light,color:colors.darkMuted,fontSize:11,width:96},options:{flex:1,flexDirection:'row',gap:5},helper:{fontFamily:fonts.light,color:colors.darkMuted,fontSize:12,lineHeight:17,paddingHorizontal:16,marginBottom:10},
  explanation:{flexDirection:'row',alignItems:'center',gap:8,padding:12,borderRadius:10,backgroundColor:'#26332a',borderWidth:1,borderColor:'#304a36',marginTop:-2,marginBottom:18},explanationText:{flex:1,fontFamily:fonts.light,color:colors.darkMuted,fontSize:12,lineHeight:16},appGrid:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:12,gap:6,paddingBottom:12},appCell:{width:'31.5%'},divider:{height:1,backgroundColor:'#363636',marginTop:4,marginBottom:20},primary:{minHeight:52,borderRadius:10,backgroundColor:colors.action,alignItems:'center',justifyContent:'center',padding:14},primaryText:{fontFamily:fonts.bold,color:'#111111',fontSize:16},disabled:{opacity:0.5},footer:{fontFamily:fonts.light,color:colors.darkMuted,fontSize:11,lineHeight:16,textAlign:'center',marginTop:12},warning:{gap:8},error:{fontFamily:fonts.regular,color:'#FFB9B9',fontSize:13,lineHeight:18,marginVertical:8},retry:{minHeight:44,justifyContent:'center'},retryText:{fontFamily:fonts.medium,color:colors.action,fontSize:14},
  timeRow:{flexDirection:'row',gap:10,paddingHorizontal:16},timeField:{flex:1,minWidth:0,backgroundColor:'#2d392f',borderWidth:1,borderColor:'#45634a',borderRadius:8,paddingHorizontal:10,paddingVertical:8},timeLabel:{fontFamily:fonts.light,color:colors.darkMuted,fontSize:11},timeValue:{fontFamily:fonts.medium,color:colors.action,fontSize:16,minHeight:32,paddingVertical:4},timeLegend:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:16,paddingBottom:16},legendText:{fontFamily:fonts.light,color:colors.darkMuted,fontSize:10},
});
