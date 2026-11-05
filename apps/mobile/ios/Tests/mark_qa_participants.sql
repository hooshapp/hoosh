-- ADMIN ONLY: exclude the explicitly synthetic audit fixtures from researcher views.
-- This is idempotent and does not delete records or touch real participants.
-- Run after the native/API audit finishes, since UI test reruns create new identities.
update public.legacy_swift_participants
set is_test=true
where participant_name like 'QA Enrollment Smoke Test %'
  and contact_email like '%@example.invalid';

select count(*) as excluded_qa_participants
from public.legacy_swift_participants
where is_test
  and participant_name like 'QA Enrollment Smoke Test %'
  and contact_email like '%@example.invalid';
