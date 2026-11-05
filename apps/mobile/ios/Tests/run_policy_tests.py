#!/usr/bin/env python3
"""Run real shared Swift policy/model regression tests without an iPhone.
Usage: python3 apps/mobile/ios/Tests/run_policy_tests.py --output /tmp/ios-policy-results.json
"""
import argparse,json,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[4]
ios=root/'apps/mobile/ios'
shared=ios/'SharedPresentation'
host=ios/'DisconnectApp'
policy=ios/'SharedProtection/DailyLimitPolicy.swift'
cases={
 'history-progress':[ios/'SharedHistory/HistoryPeriod.swift',ios/'SharedHistory/HistoryUsageComparison.swift'],
 'account-workspace':[host/'AccountWorkspace.swift'],
 'study-enrollment-gate':[host/'StudyEnrollmentGate.swift'],
 'onboarding-goal-draft':[host/'OnboardingGoalDraft.swift',shared/'ShieldPresentation.swift'],
 'daily-limit-policy':[policy],
 'session-policy':[policy],
 'study-enrollment':[host/'StudyParticipant.swift',host/'NativeSessionModels.swift'],
 'nudge-response-decoder':[host/'NudgeResponseDecoder.swift'],
 'nudge-library':[shared/'ShieldPresentation.swift'],
 'local-productivity-nudge':[shared/'ShieldPresentation.swift',shared/'LocalProductivityNudge.swift'],
 'balanced-nudge-selection':[shared/'ShieldPresentation.swift',shared/'BalancedNudgeSelection.swift'],
 'day-two-settings-tips':[shared/'ShieldPresentation.swift',shared/'DayTwoSettingsTips.swift'],
 'study-configuration':[host/'OnboardingResponseStore.swift',host/'StudyConfigurationModels.swift',shared/'ShieldPresentation.swift',shared/'DayTwoSettingsTips.swift'],
 'verified-study-progress':[host/'VerifiedStudyProgress.swift',host/'NudgeResponseDecoder.swift',shared/'ShieldPresentation.swift'],
}
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
results=[]
with tempfile.TemporaryDirectory(prefix='hoosh-ios-tests-') as tmp:
 for name,sources in cases.items():
  binary=Path(tmp)/name
  compile=subprocess.run(['swiftc',*map(str,sources),str(root/'scripts/tests'/f'{name}.swift'),'-o',str(binary)],capture_output=True,text=True)
  run=subprocess.run([str(binary)],capture_output=True,text=True) if compile.returncode==0 else compile
  result={'case':name,'passed':run.returncode==0,'evidence':(run.stdout+run.stderr).strip()[:4000]}
  results.append(result);print(('PASS' if result['passed'] else 'FAIL')+': '+name,flush=True)
args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(results,indent=2)+'\n')
raise SystemExit(0 if all(r['passed'] for r in results) else 1)
