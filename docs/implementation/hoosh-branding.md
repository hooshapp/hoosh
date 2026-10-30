# Hoosh branding

Owner explicitly requested renaming the visible app from Disconnect to Hoosh before
resuming Apple sign-in. This overrides the old wordmark text in the Figma frames;
original layout, colors, typography and dinosaur artwork remain in place.

Updated shared app name in Expo config; signup/login visible and accessibility
headings; Home heading; introduction loading and app-load error copy; recovery
email prompt; browser title/application-name metadata. React 19 browser metadata
is rendered from the root layout only on web, preserving Expo's default document
and hydration assets. No custom +html document remains.

Google Auth Platform Branding app name and Supabase SMTP sender name are saved as
Hoosh. SMTP sender/login use the owner's renamed Hoosh Google account. Earlier
messages still had the old owned alternate From address despite those address
settings; that independent Gmail sender issue is not claimed fixed by the rename.

Continuity: keep com.AnishaDasgupta.DisconnectApp, team KBW8M9TJN2,
group.com.AnishaDasgupta.DisconnectApp, extension IDs, disconnect-dev scheme,
intro/session storage keys, internal workspace package names and Expo slug.
Changing those is not necessary for the displayed name and could break continuity.
All 80 original native import files remain byte-identical to the source manifest.
The standalone Swift host is not converted to React Native, rebuilt or renamed
by this increment. Existing App Store listing remains DisconnectApp until its
metadata/name availability and release steps are completed. Intended release name
is Hoosh; no published rename/name reservation is claimed.

Validation: 118 mobile tests, workspace typecheck and mobile lint pass; web and iOS
Hermes exports pass. Exported HTML has Hoosh title plus hydration scripts. Live web
signup/login and browser title show Hoosh; Google login reaches Hoosh Home and the
correct account after the rename. Google and SMTP branding were checked on fresh
pages. Native signed build, App Store publication and full Apple sign-in acceptance
remain separate. Changes stay uncommitted; owner handles commits and pushes.
