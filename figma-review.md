# Figma review — App-UI

Reviewed October 28, 2026. This review covers the exact [App-UI file and Page 1 supplied in chat](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1&m=dev&t=gKdcTt0ToQxQqm5n-1): file key `ukmD2ZidJ9UR2XxUkvdPoJ`, page `0:1`.

The link identifies the current file and page. It does not select a saved historical version. All findings below refer to the design returned during this review.

## Scope and evidence

Reviewed all **40 top-level frames**, including reference boards and mascot assets, plus the three written canvas annotations. Coverage comprises 18 onboarding/authentication/personal-plan frames, eight settings frames, ten core application frames, and four reference/mascot frames. Used rendered screenshots, layer-derived copy and geometry, and the motion data exposed for the two Block screens. The stylebook was inspected section by section.

This establishes the visual design and its documented behavior. Prototype click-through navigation, native platform behavior, data persistence, permissions, and implementation were not tested. Flow order below is inferred from screen sequence, labels and controls where explicit navigation wiring was unavailable. No Figma changes were made. The `hoosh` folder, its code, and its docs have not been reviewed in this stage.

## Product and navigation

The Figma brand is **Disconnect**, with the message “Less scrolling. More you.” The folder name Hoosh does not establish whether a rename is intended.

The apparent journey is an introductory scrolling interaction → authentication → optional personalization → suggested or manual plan → completion → everyday app use. Everyday navigation has four destinations: **Home, Quests, History, Settings**. A dark floating capsule shows the active destination as a green pill with icon and label; inactive destinations are icon-only.

The reference sitemap also names 2FA, Forgot Password, Contact Us and Habits. These are rough labels on a reference board, not finished screens or proof of current navigation destinations.

## Onboarding and personal plans

The three introductory screens ask the user to scroll rapidly, show scrolling progress, then display the dinosaur and a Sign Up action. The required speed, amount of scrolling, repeat-visit behavior and accessible alternative are not specified.

Sign Up has name, email and password fields; Login has email/username and password. Both include Continue with Google. They share the dark surface, dinosaur artwork, green emphasis and centered composition. Error, submitting, recovery and Google cancellation states are not drawn.

Personalization uses seven progress segments and a Skip affordance during setup. The pictured selections are examples, not verified defaults:

1. **Gender:** Male, Female, Other / Prefer not to say. The screen explicitly describes setup as optional and says gender does not determine app restrictions.
2. **Age:** a wheel-style selection, with 24 highlighted in the example. Age also explicitly does not determine app restrictions. Supported bounds and scrolling behavior are undefined.
3. **Most-used apps:** choose 2–4 apps. The list shows Instagram, Snapchat, TikTok, YouTube, Reddit and X. Instagram and Snapchat are selected.
4. **Activities:** Gym, Reading, Arts & crafts, Walking, Music and Cooking, plus a custom activity input. Gym and Reading are selected.
5. **Screen Time:** an explanation before the system permission prompt, with Allow Screen Time access, Not now and Back. Actual OS prompt, denial and revoked-access states are not shown.
6. **Plan preparation and result:** a designed loading screen with dinosaur, progress ring and preparation rows, followed by the suggestion. It proposes 10-minute breaks for the sample apps and an illustrative weekly saving of up to 2h 20m, assuming one replaced 10-minute session per app per day. Actions are Go with suggestion and Set up on my own.
7. **Completion:** congratulatory dinosaur, selected interest chips, and Let’s start.

The manual plan branch contains Active Days, Active Hours, App Sessions and Select Apps, each with an expanded state. Active Days includes individual weekdays and presets. Active Hours has a dual-handle range, sample 9 AM–10 PM, with a midnight-to-11:59 PM scale. The expanded hours frame is 1040px tall and therefore demonstrates a need for scrolling.

Manual App Sessions offers 1/2/3/4 sessions and 5/10/15/30 minutes; the example is two sessions of 15 minutes. An explicit information strip says these are **planned times to use distracting apps, not nudge duration**. Select Apps shows Instagram, TikTok and YouTube selected; Snapchat, Reddit and Facebook unselected. This differs from the earlier onboarding list.

The suggested plan’s “10-minute breaks” and manual plan’s permitted app-use sessions are distinct wording that needs reconciliation with the docs. No timer policy should be inferred from their styling.

## Home, credits and dinosaur health

Home places a dinosaur health card beside credits and weekly time saved. Example values are 85% health, 240 credits and five hours saved. Feed displays a cost of 10 credits. Below, a temporary recommendation offers 50 credits for reading for 20 minutes, explains its context, and identifies Instagram and TikTok as locked during the quest. Skip and Accept are paired actions. A streak strip shows seven days.

A canvas annotation explicitly states that **Home recommendations are temporary and relevant to the moment; they do not attach to the user’s profile like items from Quests**.

The health expressions have defined bands:

| Health | Expression |
|---|---|
| 0–25% | Needs care |
| 26–50% | Feeling low |
| 51–75% | Doing okay |
| 76–100% | Happy |

The original vector artwork and expression changes are part of the design. Health decay, feeding recovery, cooldowns, insufficient-credit behavior and streak calculation are not specified.

## Blocking and nudges

Two Block screens represent different entry contexts:

| Context | Visible behavior |
|---|---|
| App opened out of habit | Instagram · paused; personalized reminder; Quit Now offers 5 credits |
| Session ended / stop mid-scroll | Instagram · session ended; return-to-activity reminder; Quit Now offers 20 credits |

The reward distinction is explicitly written beside the screens. Both show a sample 4/6 sessions used badge and an Open anyway option for another 10 minutes with no reward. Session counting, override limits, exhaustion behavior and the reward transaction are not defined.

Both Block frames contain actual **8-second looping typewriter animation timelines**. Their character reveal starts after 250ms; reveal duration differs between variants, and cursor blinking/position is animated. Implementation will need to preserve this intent while accounting for actual wrapped text. Reduced-motion behavior is not defined.

The Nudge is illustrated as a notification-style card over Instagram. It appears five minutes before the timer ends and offers 30 credits for closing the app and reading one page. Its lock notice says Instagram and TikTok stay locked until the goal is done. It has Skip and Accept actions. Completion verification, timer effects, dismissal and the native mechanism that can present this experience remain unspecified.

## Quests and editors

The Quests screen shows suggestions based on interests and schedule. Examples are an evening gym session on Monday/Wednesday/Friday, 6–8 PM, and nightly reading, 10–10:30 PM. Each card has a lock notice, Personalize and Accept. A separate action creates a custom quest.

Personalize and Custom Quest editors show quest name, activity, start/end time, duration, recurrence and day selection, followed by Save quest. The pictured sample is a weekly two-hour gym quest on Monday/Wednesday/Friday. The custom editor is prefilled with similar sample content; blank defaults are not established.

A canvas note explicitly requires users to choose which apps are blocked during that period. **Neither editor contains a visible blocked-app chooser.** That is a specification gap to reconcile later, not an instruction to invent a control now.

Accepted, active, completed and empty quest-list states, editing/deletion after acceptance, schedule overlap, overnight ranges and completion verification are not represented by the finished frames reviewed.

## History

History has three related pages with Back/Next controls and position dots:

1. **Your stats:** 51 turn-offs, weekly screen time from 12h 30m to 2h 30m, and 10 hours saved. This page labels its content as example stats.
2. **Your progress:** week/month segmentation, a narrative explanation, and an 80% reduction figure.
3. **Time reclaimed:** ten circles, eight green and two neutral, followed by an illustrative 1.8-year projection and a same-pace qualification.

The sample weekly arithmetic is coherent: ten hours saved from a 12.5-hour baseline equals 80%. The baseline window, event definitions, monthly calculation, first-week behavior, zero/negative improvement and long-term projection formula are not specified. The age/gender assumption in the projection copy should be reconciled with the product docs; the displayed 1.8 years is not a validated formula.

## Settings

The base Settings screen contains profile identity and dinosaur avatar, then Personal Info, Personalization, My Plan and Calendar Connections.

Dedicated detail screens cover Age, Distracting Apps and Redirect Me To. Age uses a wheel and Save age. Distracting Apps has search, a sample app list, selection count and Save selected apps; it explicitly labels the list as an example with no phone usage data connected. Redirect Me To has selectable activity rows and an expanded Custom text field. A note maps the earlier Exercising choice to Gym.

Expanded in-place settings cover Gender, Active Days, Active Hours and App Sessions. Gender uses Men/Women/Other radio choices. Days has presets and individual checkboxes. Hours has a two-handle range and explicitly controls the window in which nudges are active. Sessions uses plus/minus controls for daily count and minutes, and displays the computed allowance: two ×15 minutes =30 minutes/day. Its explanation again distinguishes allowed app use from nudge duration.

Both Google Calendar and Apple Calendar are shown as not connected. Connected, connecting, cancelled, failed and disconnected states are absent.

The base and expanded Settings frames are tall content layouts, with variants up to 1658px high. Runtime scrolling, safe-area clearance and navigation pinning need validation later; an absolute position in a sample frame does not prove runtime behavior.

## Visual system

The stylebook distinguishes **Observed** measurements, **Recommended** implementation guidance and **To define** specifications. Recommendations should not be mistaken for approved visual changes.

Dark onboarding/authentication/planning and warm everyday screens are contextual surfaces. There is no specified theme switch.

| Role | Observed value |
|---|---|
| Primary action and selection | `#33C659` |
| Positive metrics and reward accents | `#0B9968` |
| Everyday canvas | `#FFF1DD` |
| Raised warm cards | `#FFFAF2` |
| Settings rows | `#FFFFFF` |
| Warm card headers | `#FFD8A1` |
| Warm main text | `#3D2800` |
| Settings text / dark canvas | `#222222` |
| On-action text | `#0B3320` |
| Dark cards / backing | `#2A2A2A` / `#313131` |
| Floating navigation | `#1A1A1A` |
| Settings dividers | `#E8DCC8` |
| Warm card outline | `#E8D5B0` |

Space Grotesk uses Light 300, Regular 400, Medium 500 and Bold 700. The guide explicitly excludes synthetic Semi Bold. Large block statements are 45px with 55px leading; History metrics reach 96px. Onboarding headings are typically 28px, while contextual variants retain their original sizes.

Geometry is intentionally contextual: onboarding primary buttons 345×52/r10; auth buttons 244×48/r7; detail Save actions 353×54/r16; inline settings Save 42px high/r12; floating navigation 353×62/r31. Common screen insets differ: quests 16px, settings 20px, onboarding 24px, History 28px. Do not normalize everything to one spacing or corner-radius scale.

Preserve supplied dinosaur art, line icons, logo assets and their view bounds. Third-party brand colors and illustration greens are not replacements for semantic UI colors. Cards, row borders and elevation also differ by context; most settings rows are flat.

The stylebook recommends at least 44×44pt hit regions, including invisible extensions around small artwork, text scaling, safe areas, accessible icon names, screen-reader announcements and reduced motion. It explicitly says the current screens are not certified to pass accessibility checks. The visible stepper buttons are only 30×32 and inline Save actions are 42px high; preserving their artwork while considering larger hit regions is consistent with that guidance.

## Items to reconcile with the docs later

- Disconnect versus Hoosh naming.
- Suggested break duration, permitted app sessions, blocking windows and timer semantics.
- Quest-specific blocked-app selection and the missing chooser.
- Reward earning, duplicate prevention, completion verification, health and streak rules.
- Different sample app lists and the actual source of app choices.
- Skip/Back/save behavior, persistence and accepted-quest states.
- Scheduling bounds, recurrence, overnight periods, overlap, timezone and session limits.
- Native presentation and permission behavior for Block and Nudge.
- History baseline, monthly and projection calculations.
- Authentication recovery, field validation and failures.
- Empty, offline, failure, disabled, pressed and universal focus states, which the stylebook explicitly leaves to define.
- Loading timing, reduced motion, keyboard layouts, text scaling and smaller-phone behavior.

These are recorded questions, not implementation decisions. Reading the project instructions and docs remains the next user-directed step.

## Frame inventory

All frames below were reviewed. Node IDs allow the exact state to be located in Figma.

| Area | Frame | Node |
|---|---|---|
| Intro | 1.landing page | `1:2` |
| Intro | 2.landing page | `6:34` |
| Intro | 3.landing page | `6:71` |
| Auth | sign up | `18:2` |
| Auth | login | `27:59` |
| Setup | questions-gender | `27:113` |
| Setup | questions-age | `48:79` |
| Setup | questions-most used apps | `48:81` |
| Setup | questions-hobbies | `50:83` |
| Setup | questions-permission | `50:85` |
| Setup | questions-plan-loading | `52:690` |
| Setup | questions-plan | `50:87` |
| Plan | set up on my own | `10556:120` |
| Plan | Personal plan · Active Days expanded | `10596:1767` |
| Plan | Personal plan · Active Hours expanded | `10596:1861` |
| Plan | Personal plan · App Sessions expanded | `10596:1968` |
| Plan | Personal plan · Select Apps expanded | `10596:2062` |
| Setup | questions-congratulations | `50:89` |
| Home | Home Page | `22:4` |
| Block | Block | `65:91` |
| Block | Block · Intentional pause | `10514:168` |
| Nudge | nudge | `76:69` |
| Quests | Quests | `27:155` |
| Quests | Personalize quest | `10487:126` |
| Quests | Create custom quest | `10577:427` |
| History | history | `27:153` |
| History | History · Your progress | `10570:192` |
| History | History · Time reclaimed | `10570:193` |
| Settings | settings/profile | `27:157` |
| Settings | Age · Select age | `10601:5908` |
| Settings | Distracting Apps · Select apps | `10601:5968` |
| Settings | Redirect Me To · Choose activities | `10601:6057` |
| Settings | Settings · Gender expanded | `10601:6146` |
| Settings | Settings · Active Days expanded | `10601:6315` |
| Settings | Settings · Active Hours expanded | `10601:6513` |
| Settings | Settings · App Sessions expanded | `10601:6690` |
| Reference | Disconnect · Visual stylebook | `10611:12784` |
| Reference | Slide 4:3 - 1 | `1:3` |
| Mascot | Dino feelings · health states | `88:96` |
| Mascot | Disconnect dinosaur male | `10626:236` |

Canvas annotations reviewed: temporary Home recommendations `10517:138`; distinct Block rewards `10517:234`; quest-specific blocked-app choice `10565:254`.
