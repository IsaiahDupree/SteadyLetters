# PRD: Meta Pixel & CAPI Integration for SteadyLetters

**Status:** Active  
**Created:** 2026-01-25  
**Priority:** P1

## Overview

Implement Facebook Meta Pixel and Conversions API for SteadyLetters to optimize for letter orders and recurring campaigns.

## Standard Events Mapping

| SteadyLetters Event | Meta Standard Event | Parameters |
|---------------------|---------------------|------------|
| `landing_view` | `PageView` | - |
| `sample_viewed` | `ViewContent` | `content_type: 'sample'` |
| `signup_complete` | `CompleteRegistration` | `content_name`, `status` |
| `letter_created` | `AddToCart` | `content_type: 'letter'` |
| `letter_rendered` | `ViewContent` | `content_ids` |
| `checkout_started` | `InitiateCheckout` | `value`, `currency`, `num_items` |
| `letter_sent` | `Purchase` | `value`, `currency`, `num_items` |
| `campaign_created` | `Subscribe` | `value`, `currency` |

## Features

| ID | Name | Priority |
|----|------|----------|
| META-001 | Meta Pixel Installation | P1 |
| META-002 | PageView Tracking | P1 |
| META-003 | Standard Events Mapping | P1 |
| META-004 | CAPI Server-Side Events | P1 |
| META-005 | Event Deduplication | P1 |
| META-006 | User Data Hashing (PII) | P1 |
| META-007 | Custom Audiences Setup | P2 |
| META-008 | Conversion Optimization | P2 |
