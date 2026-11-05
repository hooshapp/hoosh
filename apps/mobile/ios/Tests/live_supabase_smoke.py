#!/usr/bin/env python3
"""Owner-authorized live pilot test. Creates TWO clearly named synthetic participants.
No credentials are logged or written. Requires --allow-live-writes. Produces admin SQL
that marks retained QA rows is_test=true, excluding them from researcher views.
"""
import argparse,json,uuid,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timezone
parser=argparse.ArgumentParser();parser.add_argument('--allow-live-writes',action='store_true');parser.add_argument('--output-dir',type=Path,required=True);args=parser.parse_args()
if not args.allow_live_writes: parser.error('Explicit --allow-live-writes required')
root=Path(__file__).resolve().parents[4];env={}
for line in (root/'apps/mobile/.env').read_text().splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  key,value=line.split('=',1);env[key.strip()]=value.strip().strip('\"\'')
base=env['EXPO_PUBLIC_SUPABASE_URL'];key=env['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
results=[];fixtures=[]
def call(path,method='GET',body=None,token=None,prefer=None):
 headers={'apikey':key,'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 if prefer:headers['Prefer']=prefer
 request=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(request,timeout=25) as response:
   raw=response.read();return response.status,json.loads(raw) if raw else None
 except urllib.error.HTTPError as error:
  raw=error.read()
  try: value=json.loads(raw)
  except Exception:value={}
  return error.code,{'code':value.get('code'),'error_code':value.get('error_code')}
def check(name,condition):
 results.append({'case':name,'passed':bool(condition)});print(('PASS' if condition else 'FAIL')+': '+name,flush=True)
 if not condition:raise RuntimeError('Check failed: '+name)
try:
 status,settings=call('/auth/v1/settings')
 check('study enrollment enabled; ordinary email verification unchanged',status==200 and settings.get('external',{}).get('anonymous_users') is True and settings.get('mailer_autoconfirm') is False)
 sessions=[]
 for label in ['A','B']:
  suffix=uuid.uuid4().hex[:8];name='QA Enrollment Smoke Test '+suffix;email='qa-native-'+suffix+'@example.invalid'
  status,session=call('/auth/v1/signup','POST',{'data':{'participant_name':name,'study_email':email,'qa_smoke_test':True}})
  check('new study participant '+label,status==200 and bool(session.get('access_token')) and session.get('user',{}).get('is_anonymous') is True)
  owner=session['user']['id'];fixtures.append(owner);token=session['access_token'];sessions.append(session)
  row={'user_id':owner,'participant_name':name,'contact_email':email,'telemetry_gap_detected':False}
  status,_=call('/rest/v1/legacy_swift_participants?on_conflict=user_id','POST',row,token,'resolution=merge-duplicates,return=minimal')
  check('named enrollment save '+label,status in [200,201,204])
  status,rows=call('/rest/v1/legacy_swift_participants?select=participant_name,contact_email',token=token)
  check('named enrollment readback '+label,status==200 and rows==[{'participant_name':name,'contact_email':email}])
 a,b=sessions;owner=a['user']['id'];peer=b['user']['id'];token=a['access_token'];now=datetime.now(timezone.utc).isoformat()
 # No fabricated measured usage: only a labelled QA audit event.
 event={'id':str(uuid.uuid4()),'user_id':owner,'event_name':'qa_audit_fixture','occurred_at':now,'properties':{'qa_fixture':'true'}}
 for attempt in range(2):
  status,_=call('/rest/v1/legacy_swift_events?on_conflict=id','POST',event,token,'resolution=ignore-duplicates,return=minimal')
  check('stable event retry '+str(attempt+1),status in [200,201,204])
 status,rows=call('/rest/v1/legacy_swift_events?select=id&event_name=eq.qa_audit_fixture',token=token)
 check('no duplicate events',status==200 and len(rows)==1)
 profile={'user_id':owner,'preferences':{'primaryGoal':'QA: Read more books','customQuestion':'QA: Is this the break I chose?','selectedQuestions':['QA test question']},'plan':[{'localRuleID':'qa-rule','appLabel':'QA Instagram','appLabelSource':'participant_entered','dailyMinutes':30,'sessionMinutes':15}],'updated_at':now}
 status,_=call('/rest/v1/legacy_swift_profiles?on_conflict=user_id','POST',profile,token,'resolution=merge-duplicates,return=minimal')
 check('questionnaire and named app plan save',status in [200,201,204])
 status,rows=call('/rest/v1/legacy_swift_profiles?select=preferences,plan',token=token)
 check('questionnaire and app plan exact readback',status==200 and rows==[{'preferences':profile['preferences'],'plan':profile['plan']}])
 history={'id':str(uuid.uuid4()),'user_id':owner,'recorded_at':now,'study_day':datetime.now(timezone.utc).strftime('%Y-%m-%d'),'timezone':'America/New_York','reason':'qa_audit_fixture','snapshot':{'preferences':profile['preferences'],'plan':profile['plan'],'onboardingCompleted':True}}
 for attempt in range(2):
  status,_=call('/rest/v1/legacy_swift_configuration_history?on_conflict=id','POST',history,token,'resolution=ignore-duplicates,return=minimal')
  check('immutable settings-history retry '+str(attempt+1),status in [200,201,204])
 status,rows=call('/rest/v1/legacy_swift_configuration_history?select=snapshot',token=token)
 check('settings history exact readback',status==200 and rows==[{'snapshot':history['snapshot']}])
 for table,row in [
  ('legacy_swift_feedback',{'id':str(uuid.uuid4()),'user_id':owner,'rating':4,'message':'QA audit fixture: feedback path verification.','context':'qa_audit_fixture'}),
  ('legacy_swift_research',{'id':str(uuid.uuid4()),'user_id':owner,'answers':{'name':'QA Audit','contact':'qa@example.invalid','userType':'Student','biggestDistraction':'QA fixture','notes':'QA interview opt-in test'}})]:
  status,rows=call('/rest/v1/'+table,'POST',row,token,'return=representation')
  check(table+' save and readback',status in [200,201] and len(rows)==1 and all(rows[0].get(k)==v for k,v in row.items()))
 for table in ['legacy_swift_participants','legacy_swift_profiles','legacy_swift_events','legacy_swift_feedback','legacy_swift_research','legacy_swift_configuration_history']:
  status,rows=call('/rest/v1/'+table+'?select=user_id&user_id=eq.'+owner,token=b['access_token'])
  check(table+' cross-user read denied',status==200 and rows==[])
 forged=dict(event,id=str(uuid.uuid4()),user_id=peer)
 status,_=call('/rest/v1/legacy_swift_events','POST',forged,token)
 check('forged event owner rejected',status in [401,403])
 for view in ['enrollment_records','questionnaires','app_plans','feedback_records','settings_changes','daily_research','session_records','intervention_records','connection_records']:
  status,error=call('/rest/v1/legacy_swift_'+view+'?select=*&limit=0',token=token)
  check('private researcher view '+view,status in [401,403] and error.get('code')=='42501')
 status,refresh=call('/auth/v1/token?grant_type=refresh_token','POST',{'refresh_token':a['refresh_token']})
 check('refresh preserves participant identity',status==200 and refresh.get('user',{}).get('id')==owner)
 status,rows=call('/rest/v1/legacy_swift_profiles?select=user_id',token=refresh['access_token'])
 check('database read after refresh',status==200 and rows==[{'user_id':owner}])
 status,_=call('/auth/v1/token?grant_type=password','POST',{'email':'nonexistent-qa-'+uuid.uuid4().hex+'@example.invalid','password':uuid.uuid4().hex})
 check('invalid password login rejected',status==400)
finally:
 args.output_dir.mkdir(parents=True,exist_ok=True)
 (args.output_dir/'ios-live-database-results.json').write_text(json.dumps(results,indent=2)+'\n')
 if fixtures:
  ids=','.join("'"+str(uuid.UUID(uid))+"'" for uid in fixtures)
  (args.output_dir/'mark-native-audit-fixtures.sql').write_text('-- Run as project administrator; preserve QA records but exclude them from researcher views.\nupdate public.legacy_swift_participants set is_test=true where user_id in ('+ids+');\n')
 print('Synthetic named QA records retained; admin marking SQL written. No measured-usage events fabricated.')
