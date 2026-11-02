# Remaining work from onboarding and authentication

- Improve verification email inbox placement; a new-account confirmation email was delivered to Gmail Spam on November 1, 2026.
- Validate signup/login and Google and Apple sign-in on native devices.
- Persist gender and age as requested. They are currently transient; settle PD-17's supported-age, purpose, consent and privacy details before implementing persistence or using the answers for personalization.
- Complete iOS native build integration using a supported Xcode version and validate Screen Time authorization on a signed iPhone, including allow, deny and revoke.
- Validate Android Usage Access on a physical device, including allow, deny, return to app and revoke. The debug build compiles; runtime permission has not been verified.
- Validate onboarding with device keyboards and VoiceOver/TalkBack.

The confirmation email for a new test account was delivered and confirmed on November 1, 2026. Browser and build checks do not establish native-device acceptance.
