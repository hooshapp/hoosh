import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ManualPlanScreen } from './ManualPlanScreen';
import { defaultManualPlan, manualPlanDraftKey, manualPlanKey } from './manual-plan';
const mockStorage=new Map<string,string>();const mockSaved=jest.fn();const mockBack=jest.fn();
jest.mock('@react-native-async-storage/async-storage',()=>({__esModule:true,default:{
 getItem:jest.fn(async(key:string)=>mockStorage.get(key)??null),
 setItem:jest.fn(async(key:string,value:string)=>{mockStorage.set(key,value);}),
}}));
function Wrapper({children}:PropsWithChildren){return <SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:393,height:852},insets:{top:0,right:0,bottom:0,left:0}}}>{children}</SafeAreaProvider>;}
beforeEach(()=>{jest.clearAllMocks();mockStorage.clear();jest.mocked(AsyncStorage.getItem).mockImplementation(async key=>mockStorage.get(key)??null);jest.mocked(AsyncStorage.setItem).mockImplementation(async(key,value)=>{mockStorage.set(key,value);});});
async function open(id='account-a'){await render(<ManualPlanScreen accountId={id} initialApps={['Instagram','Snapchat']} onBack={mockBack} onSaved={mockSaved}/>,{wrapper:Wrapper});await screen.findByText('Set up on your own');}
it('edits all four sections, persists the selected plan, and finishes only after saving',async()=>{
 await open();await fireEvent.press(screen.getByRole('button',{name:'Active Days'}));await fireEvent.press(screen.getByRole('button',{name:'Weekends'}));
 expect(screen.getByText('Sat – Sun')).toBeTruthy();
 await fireEvent.press(screen.getByRole('button',{name:'Active Hours'}));await fireEvent.changeText(screen.getByLabelText('Start time'),'10:00 AM');await fireEvent.changeText(screen.getByLabelText('End time'),'8:00 PM');
 await fireEvent.press(screen.getByRole('button',{name:'App Sessions'}));await fireEvent.press(screen.getByRole('button',{name:'4 sessions per day'}));await fireEvent.press(screen.getByRole('button',{name:'30 minutes per session'}));
 await fireEvent.press(screen.getByRole('button',{name:'Select Apps'}));await fireEvent.press(screen.getByRole('checkbox',{name:'Facebook'}));
 expect(mockSaved).not.toHaveBeenCalled();await fireEvent.press(screen.getByRole('button',{name:'Save my plan'}));
 await waitFor(()=>expect(mockSaved).toHaveBeenCalledTimes(1));
 expect(JSON.parse(mockStorage.get(manualPlanKey('account-a'))!)).toMatchObject({days:[5,6],startMinutes:600,endMinutes:1200,sessionsPerDay:4,durationMinutes:30,apps:['Instagram','Snapchat','Facebook']});
 expect(mockStorage.has(manualPlanKey('account-b'))).toBe(false);
});
it('blocks equal/reversed hours and empty selections until corrected',async()=>{
 await open();await fireEvent.press(screen.getByRole('button',{name:'Active Hours'}));await fireEvent.changeText(screen.getByLabelText('End time'),'8:00 AM');
 expect(screen.getByRole('button',{name:'Save my plan'}).props.accessibilityState.disabled).toBe(true);
 await fireEvent.press(screen.getByRole('button',{name:'Active Hours'}));
 expect(screen.getByText(/End time must be later/)).toBeTruthy();
 await fireEvent.press(screen.getByRole('button',{name:'Active Hours'}));await fireEvent.changeText(screen.getByLabelText('End time'),'11:00 PM');
 await fireEvent.press(screen.getByRole('button',{name:'Select Apps'}));await fireEvent.press(screen.getByRole('checkbox',{name:'Instagram'}));await fireEvent.press(screen.getByRole('checkbox',{name:'Snapchat'}));
 expect(screen.getByRole('button',{name:'Save my plan'}).props.accessibilityState.disabled).toBe(true);
 expect(screen.getByText('Choose at least one app.')).toBeTruthy();
 await fireEvent.press(screen.getByRole('checkbox',{name:'YouTube'}));expect(screen.getByRole('button',{name:'Save my plan'}).props.accessibilityState.disabled).toBe(false);
});
it('restores account-scoped drafts and keeps edits when going Back',async()=>{
 mockStorage.set(manualPlanDraftKey('account-a'),JSON.stringify({...defaultManualPlan(['Facebook']),days:[6],sessionsPerDay:3}));
 await open();expect(screen.getByText('Sun')).toBeTruthy();expect(screen.getByText('3 sessions/day · 15 min each')).toBeTruthy();
 await fireEvent.press(screen.getByRole('button',{name:'‹  Back'}));expect(mockBack).toHaveBeenCalledTimes(1);expect(mockSaved).not.toHaveBeenCalled();
});
it('shows storage failure and allows a successful explicit retry',async()=>{
 await open();const original=jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
 jest.mocked(AsyncStorage.setItem).mockImplementation(async(key,value)=>{if(key===manualPlanKey('account-a'))throw new Error('full');return original(key,value);});
 await fireEvent.press(screen.getByRole('button',{name:'Save my plan'}));await screen.findByText('Your plan could not be saved. Please try again.');expect(mockSaved).not.toHaveBeenCalled();
 jest.mocked(AsyncStorage.setItem).mockImplementation(original);await fireEvent.press(screen.getByRole('button',{name:'Save my plan'}));await waitFor(()=>expect(mockSaved).toHaveBeenCalledTimes(1));
});
it('keeps load failure retryable without overwriting an unread draft',async()=>{
 jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('read failure'));
 await render(<ManualPlanScreen accountId="account-a" initialApps={['Instagram']} onBack={mockBack} onSaved={mockSaved}/>,{wrapper:Wrapper});
 await screen.findByText('Couldn’t load your plan');expect(AsyncStorage.setItem).not.toHaveBeenCalled();await fireEvent.press(screen.getByRole('button',{name:'Try again'}));await screen.findByText('Set up on your own');
});
it('single-flights rapid saves while the accepted record is pending',async()=>{
 await open();const original=jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});let acceptedWrites=0;
 jest.mocked(AsyncStorage.setItem).mockImplementation(async(key,value)=>{if(key===manualPlanKey('account-a')){acceptedWrites++;await pending;}return original(key,value);});
 const button=screen.getByRole('button',{name:'Save my plan'});await fireEvent.press(button);await fireEvent.press(button);
 await waitFor(()=>expect(acceptedWrites).toBe(1));expect(mockSaved).not.toHaveBeenCalled();release();await waitFor(()=>expect(mockSaved).toHaveBeenCalledTimes(1));
});
it('does not navigate after the editor is unmounted during a save',async()=>{
 const view=await render(<ManualPlanScreen accountId="account-a" initialApps={['Instagram']} onBack={mockBack} onSaved={mockSaved}/>,{wrapper:Wrapper});await screen.findByText('Set up on your own');
 const original=jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});let accepted=false;
 jest.mocked(AsyncStorage.setItem).mockImplementation(async(key,value)=>{if(key===manualPlanKey('account-a')){accepted=true;await pending;}return original(key,value);});
 await fireEvent.press(screen.getByRole('button',{name:'Save my plan'}));await waitFor(()=>expect(accepted).toBe(true));await view.unmount();release();
 await waitFor(()=>expect(mockStorage.has(manualPlanKey('account-a'))).toBe(true));expect(mockSaved).not.toHaveBeenCalled();
});
