# Remaining work from onboarding and authentication

- Improve verification email inbox placement; a new-account confirmation email was delivered to Gmail Spam on November 1, 2026.
- Validate signup/login and Google and Apple sign-in on native devices.
- The owner requested removing the signup age field and using the honor system. The later questionnaire saves an age from 18–80 and the neutral “Other” avatar locally; signup eligibility is not verified. Settings edits, cross-device storage, privacy notice and personalization use remain pending.
- Complete iOS native build integration using a supported Xcode version and validate Screen Time authorization on a signed iPhone, including allow, deny and revoke.
- Validate Android Usage Access on a physical device, including allow, deny, return to app and revoke. The debug build compiles; runtime permission has not been verified.
- Validate onboarding with device keyboards and VoiceOver/TalkBack.

The confirmation email for a new test account was delivered and confirmed on November 1, 2026. Browser and build checks do not establish native-device acceptance.
