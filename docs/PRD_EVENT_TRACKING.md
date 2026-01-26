# PRD: Event Tracking System for SteadyLetters

**Status:** Active  
**Created:** 2026-01-25  
**Based On:** BlankLogo Event Tracking Pattern

## Overview

Implement sophisticated user event tracking for SteadyLetters to optimize the handwritten letter funnel from signup → compose → render → send.

## Event Categories

| Category | Events |
|----------|--------|
| **Acquisition** | `landing_view`, `cta_click`, `pricing_view`, `sample_viewed` |
| **Activation** | `signup_start`, `login_success`, `activation_complete`, `first_font_selected` |
| **Core Value** | `letter_created`, `letter_rendered`, `letter_sent`, `font_selected`, `recipient_added`, `campaign_created` |
| **Monetization** | `checkout_started`, `purchase_completed`, `credits_purchased`, `subscription_started` |
| **Retention** | `return_session`, `letter_returning_user`, `campaign_recurring` |
| **Reliability** | `error_shown`, `render_failed`, `send_failed` |

## Core Value Event Properties

### letter_created
```json
{
  "letter_id": "string",
  "font_id": "string",
  "word_count": "number",
  "template_used": "string"
}
```

### letter_sent
```json
{
  "letter_id": "string",
  "recipient_count": "number",
  "mail_class": "first_class | priority",
  "cost": "number"
}
```

## 4 North Star Milestones

1. **Activated** = `first_font_selected`
2. **First Value** = first `letter_rendered`
3. **Aha Moment** = first `letter_sent`
4. **Monetized** = `purchase_completed`

## Features

| ID | Name | Priority |
|----|------|----------|
| TRACK-001 | Tracking SDK Integration | P1 |
| TRACK-002 | Acquisition Event Tracking | P1 |
| TRACK-003 | Activation Event Tracking | P1 |
| TRACK-004 | Core Value Event Tracking | P1 |
| TRACK-005 | Monetization Event Tracking | P1 |
| TRACK-006 | Retention Event Tracking | P2 |
| TRACK-007 | Error & Performance Tracking | P2 |
| TRACK-008 | User Identification | P1 |
