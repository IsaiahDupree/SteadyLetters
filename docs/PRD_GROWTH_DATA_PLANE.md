# PRD: Growth Data Plane for SteadyLetters

**Status:** Active  
**Created:** 2026-01-25  
**Priority:** P0  
**Reference:** `autonomous-coding-dashboard/harness/prompts/PRD_GROWTH_DATA_PLANE.md`

## Overview

Implement the Growth Data Plane for SteadyLetters: unified event tracking for handwritten letter funnel from signup → compose → render → send → campaign.

## SteadyLetters-Specific Events

| Event | Source | Segment Trigger |
|-------|--------|-----------------|
| `landing_view` | web | - |
| `sample_viewed` | web | warm_lead |
| `signup_completed` | web | new_signup |
| `font_selected` | app | activated |
| `letter_created` | app | - |
| `letter_rendered` | app | first_value |
| `letter_sent` | app | aha_moment |
| `campaign_created` | app | power_user |
| `checkout_started` | web | checkout_started |
| `credits_purchased` | stripe | - |
| `email.clicked` | resend | newsletter_clicker |

## Segments for SteadyLetters

1. **signup_no_letter_48h** → email: "Write your first handwritten letter"
2. **letter_created_no_send_72h** → email: "Your letter is ready to mail"
3. **first_letter_sent** → email: "Create a recurring campaign"
4. **high_volume_user** → email: "Bulk discounts available"
5. **sample_viewed_not_signed_up** → email: "See your handwriting come to life"

## Features

| ID | Name | Priority |
|----|------|----------|
| GDP-001 | Supabase Schema Setup | P0 |
| GDP-002 | Person & Identity Tables | P0 |
| GDP-003 | Unified Events Table | P0 |
| GDP-004 | Resend Webhook Edge Function | P0 |
| GDP-005 | Email Event Tracking | P0 |
| GDP-006 | Click Redirect Tracker | P1 |
| GDP-007 | Stripe Webhook Integration | P1 |
| GDP-008 | Subscription Snapshot | P1 |
| GDP-009 | PostHog Identity Stitching | P1 |
| GDP-010 | Meta Pixel + CAPI Dedup | P1 |
| GDP-011 | Person Features Computation | P1 |
| GDP-012 | Segment Engine | P1 |
