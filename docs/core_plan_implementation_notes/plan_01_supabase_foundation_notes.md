# Plan 01 — Supabase foundation implementation notes

**Owner:** Anisha (SB-01–03; SB-06 lead). **Branch:** `landing-page`. **Status:** In progress; see [ledger](../core_plan/01_supabase_foundation.md).

## Resume checkpoint — November 1, 2026

A development Supabase project, callback configuration, email provider and development SMTP were configured. Public signing metadata was observed; confirm the actual audience and backend handoff. A fresh confirmation email was received in Gmail Spam and the account was confirmed, but delivery placement and full two-account/API acceptance remain open. Ishmum owns SB-04/05. See [Supabase runbook](../runbooks/supabase-development.md), [credentials map](../runbooks/credentials-map.md), and [Auth QA](../qa/auth-foundation.md). Dashboard settings can change; these notes record observed evidence, not current state. Keep secrets and account addresses out of notes.

## SB-01–03 — Development Auth setup, commit 32165ea

**Date:** 2026-10-30. **Commit:** `32165ea` — `Completed sign in and sign up authentications set up`. **Owner:** Anisha; branch `landing-page`. This commit combines Plan 01 setup evidence with Plan 02 client work; the complete changed-file inventory and commit ranges are recorded in [Plan 02 notes](plan_02_auth_onboarding_notes.md#auth-0107-and-auth-13--authentication-commit-32165ea). The project/provider changes were made in external dashboards and are documented in the runbooks, not created by the commit.

**Validation and limits:** use the dated runbook/QA entries for the checks actually performed. Public JWKS was observed; do not infer API token verification, native acceptance, or completion of both test accounts. **Next:** reconcile teammate access and trust metadata, then complete SB-06 jointly.

## Current documentation update — pending commit

Moved the context files into the structure introduced on `main`, added this record, and updated the Plan 01 ledger. This is a working-tree change, not a completed commit. Reconcile it with `main` before integration.
