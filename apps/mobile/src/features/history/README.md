# History presentation — RN-09c

Figma `27:153`, read-only session `26dd22ea-c87c-4b6c-a571-5e74d6eff5e8`.
`HistoryScreen` composes the original summary typography, dividers, metric hierarchy,
comparison and optional next-page affordance. `Screen` owns scrolling/safe areas and
measured tab clearance; the OS owns the status bar. No fixed phone-sized app canvas.

`HistoryModel` is a local presentation interface, not an insights API contract.
Each independent reading is loading, error, unavailable or ready. Ready readings
require finite nonnegative values, display text, period, source and coverage. Zero
is valid; missing evidence is unavailable. Before/now requires explicit producer
eligibility plus valid evidence for both readings. The view never computes saved
time by subtraction, percentages, rewards or forecasts. Evidence is visible below
each reading: a deliberate accessibility/transparency adaptation to the source.
Small green text uses the existing readableSuccess token. Optional next/retry
callbacks delegate intent only. No handler means no dead navigation control.

The actual route supplies `unavailableHistory`. Source numbers exist only in the
separate developer specimen. New SVGs are unchanged original-pack copies at
20×20, 20×20 and 32×8, recorded in the asset manifest and browser byte/bounds checks.

Remaining: **RN09C-D01** approved measurement semantics, permitted sources and
insights schema (PD-11); **RN09C-D02** real account/generation-scoped data, coverage,
comparison eligibility and recovery; **RN09C-D03** detail frames `10570:192` and
`10570:193`/navigation once their supported data exists, forecast excluded until
PD-12; **RN09C-D04** signed-device/screen-reader acceptance. The summary UI does not
complete live History acceptance or RN-11.
