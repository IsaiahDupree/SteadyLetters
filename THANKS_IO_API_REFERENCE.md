# Thanks.io API Reference & Limitations

**Date:** February 17, 2026
**Verified By:** Live API testing against production endpoints
**API Version:** v2
**Base URL:** `https://api.thanks.io/api/v2`

---

## 1. Authentication

- **Method:** Bearer token in `Authorization` header
- **Format:** `Authorization: Bearer YOUR_API_KEY`
- **Key Location:** [https://dashboard.thanks.io/profile/api](https://dashboard.thanks.io/profile/api)
- **Token Type:** JWT with scopes (empty scopes `[]` still works for all tested endpoints)
- **Key Expiry:** Tokens have very long expiry (~155 years based on `exp` field)

---

## 2. Product Types — Live Test Results

All tests sent to a real address on Feb 17, 2026.

| Product | Endpoint | Status | Cost (1 recipient) | Notes |
|---------|----------|--------|---------------------|-------|
| **Postcard 4x6** | `POST /send/postcard` | ✅ Works | $1.14 | Requires `front_image_url` or `image_template` |
| **Postcard 6x9** | `POST /send/postcard` | ✅ Works | $1.61 | Same endpoint, `size: "6x9"` |
| **Postcard 6x11** | `POST /send/postcard` | ✅ Works | $1.83 | Same endpoint, `size: "6x11"` |
| **Letter (Windowed)** | `POST /send/letter` | ✅ Works | $1.20 | Handwritten letter in windowed envelope |
| **Notecard (Greeting)** | `POST /send/notecard` | ✅ Works | $3.00 | Folded 4.25x5.5 notecard in envelope |
| **Windowless Letter** | `POST /send/windowlessletter` | ❌ Billing error | ~$2.52 | Requires sufficient account balance or billing setup |
| **Giftcard** | `POST /send/giftcard` | ✅ Preview works | $3.00 + gift value | Requires `giftcard_brand` and `giftcard_amount_in_cents` |

### Order IDs from Live Tests
- Postcard 4x6: #4261373
- Postcard 6x9: #4261374
- Postcard 6x11: #4261375
- Letter: #4261376
- Notecard: #4261377

---

## 3. Correct API Endpoints

| Purpose | Method | Path | Auth Required |
|---------|--------|------|---------------|
| List handwriting styles | GET | `/handwriting-styles` | No |
| Send postcard | POST | `/send/postcard` | Yes |
| Send letter | POST | `/send/letter` | Yes |
| Send notecard | POST | `/send/notecard` | Yes |
| Send windowless letter | POST | `/send/windowlessletter` | Yes |
| Send giftcard | POST | `/send/giftcard` | Yes |
| List giftcard brands | GET | `/giftcard-brands` | No |
| Build dynamic image | GET | `/build/image-template` | Yes |

### Previously Incorrect Endpoints (Fixed)
- ~~`/postcard/send`~~ → `/send/postcard`
- ~~`/letter/send`~~ → `/send/letter`
- ~~`/notecard/send`~~ → `/send/notecard`
- ~~`/handwriting`~~ → `/handwriting-styles`
- ~~`/orders/{id}`~~ → `/send/{id}` (order lookup by ID)

---

## 4. Required & Optional Fields by Product

### Postcard (`POST /send/postcard`)
**Required:**
- `recipients` — Array of recipient objects (name, address, city, province, postal_code, country)
- `message` — Handwritten message text
- `handwriting_style` — Numeric style ID (1-36+)
- `front_image_url` — URL to front image (OR `image_template`)

**Optional:**
- `size` — `"4x6"` (default), `"6x9"`, `"6x11"`
- `handwriting_color` — `"blue"`, `"black"`, `"green"`, or hex like `"#4287f5"`
- `preview` — `true` to generate preview without sending (free)
- `return_name`, `return_address`, `return_city`, `return_province`, `return_postal_code`, `return_country`

### Letter (`POST /send/letter`)
**Required:**
- `recipients` — Array of recipient objects
- `message` — Letter content
- `handwriting_style` — Numeric style ID

**Optional:**
- `front_image_url` — Background image for letter
- `handwriting_color`
- `preview`

### Notecard (`POST /send/notecard`)
**Required:**
- `recipients` — Array of recipient objects
- `message` — Handwritten message
- `handwriting_style` — Numeric style ID
- `front_image_url` — Front of notecard image

**Optional:**
- `handwriting_color`
- `preview`

### Windowless Letter (`POST /send/windowlessletter`)
**Required:**
- `recipients` — Array of recipient objects
- `pdf_only_url` — URL to PDF document

**Optional:**
- `message`, `handwriting_style` (for cover page)
- `preview`

### Giftcard (`POST /send/giftcard`)
**Required:**
- `recipients` — Array of recipient objects
- `message` — Handwritten message
- `handwriting_style` — Numeric style ID
- `front_image_url` — Front of notecard image
- `giftcard_brand` — Brand code (e.g., `"amazonus"`, `"starbucks"`)
- `giftcard_amount_in_cents` — Amount in cents (e.g., `500` for $5)

---

## 5. Handwriting Styles

**36 styles available** as of Feb 2026:
- **9 Realistic** styles — natural handwriting appearance
- **16 AI** styles — AI-generated handwriting
- **7 International** styles — support for non-Latin scripts

Styles are identified by numeric ID (e.g., 1, 4, 5, 7, 101).

---

## 6. Giftcard Brands

**7 categories, 65 total brands** including:
- **Main:** Amazon, Target, Walmart, Visa
- **Food:** Starbucks, Chipotle, DoorDash, Grubhub, Domino's, Dunkin', etc.
- **Entertainment:** Netflix, Spotify, Xbox, PlayStation, etc.
- **Gifts:** Sephora, Nordstrom, etc.
- **Travel:** Airbnb, Hotels.com, etc.
- **Big Box:** Best Buy, Home Depot, etc.

Gift amounts vary by brand (typically $5–$200 in preset increments).

---

## 7. Order Status Lifecycle

Thanks.io orders follow this lifecycle:

```
Reviewing → Printing → Printed → Fulfilled → Shipped → Delivered
                                                    ↘ Error
                                         ↗ Cancelled
```

| Status | Description |
|--------|-------------|
| **Reviewing** | Within cancellation window (~1 hour) |
| **Printing** | Being sent to printer network |
| **Printed** | All pieces sent to printer |
| **Fulfilled** | All processing complete, order settled |
| **Shipped** | Mail pieces shipped |
| **Delivered** | Confirmed delivery |
| **Cancelled** | Cancelled by client (during review window) |
| **Error** | All items failed to print |

---

## 8. Webhooks

Thanks.io supports 4 webhook event types:

| Event Type | Fires When |
|------------|------------|
| `order.status_update` | Order changes status (Reviewing → Printing → etc.) |
| `order_item.status_change` | Individual mail piece status changes |
| `order_item.delivered` | A mail piece is confirmed delivered |
| `qr_code.scan` | Recipient scans QR code on mailer |

### Webhook Payload Format
```json
{
  "event_type": "order.status_update",
  "event_id": "a8a59df0-516d-11f0-9ca2-31daad0e4f7f",
  "data": {
    "order.id": 42401,
    "order.status": "Printing"
  },
  "timestamp": 1750819187,
  "date_time": "2025-06-25 02:39:47"
}
```

**Note:** Data keys use dot-notation (e.g., `"order.id"`, not `"orderId"`).

### Webhook Management
Configure at: [https://dashboard.thanks.io/profile/webhooks](https://dashboard.thanks.io/profile/webhooks)

---

## 9. Known Limitations & Edge Cases

### Discovered via Live Testing

1. **Windowless letter requires billing setup** — Returns 400 "Error Submitting Order - Usually related to billing failure" even with valid credentials. May require prepaid balance.

2. **`front_image_url` is strictly required for postcards** — Cannot send a postcard without it, even with `message` provided. Returns 422.

3. **Long messages (5000+ chars) rejected** — Returns 422 for very long message bodies. Message length limit not explicitly documented.

4. **Multiple recipients work** — Tested with 3 recipients in one call, returns 200 with all recipients queued.

5. **Preview mode is free** — Adding `preview: true` to any send endpoint generates a preview image without creating an order or charging the account.

6. **Invalid handwriting style ID** — Returns 422 with validation errors rather than falling back to a default style.

7. **No GET endpoint for order status by ID** — Order status is returned in the send response. Status updates come via webhooks. The endpoint `GET /send/{id}` returns the original order data.

8. **Recipient `address2` supported** — Separate field for apartment/suite numbers.

### Image Requirements
- Front images must be publicly accessible URLs
- Recommended formats: PNG, JPG
- Postcard 4x6: 1875 x 1275 px (300 DPI)
- Postcard 6x9: 2775 x 1875 px (300 DPI)
- Postcard 6x11: 3375 x 1875 px (300 DPI)
- Notecard: 1275 x 1875 px (300 DPI, portrait)

---

## 10. Cost Summary

| Product | Per Piece |
|---------|-----------|
| Postcard 4x6 | $1.14 |
| Postcard 6x9 | $1.61 |
| Postcard 6x11 | $1.83 |
| Letter (windowed) | $1.20 |
| Notecard (greeting card) | $3.00 |
| Windowless letter | ~$2.52 |
| Giftcard | $3.00 + gift amount |

*Prices as of Feb 2026. Includes printing & postage for US domestic.*

---

## 11. Test Scripts

- **`scripts/test-all-products.mjs`** — Comprehensive test of all product types
  - `--preview-only` — Free preview mode
  - `--product <type>` — Test single product
  - `--skip <type>` — Skip a product
- **`scripts/test-live-send.mjs`** — Original postcard/letter test script
- **`tests/integration/thanks-io-live.test.ts`** — Jest integration tests (opt-in with `THANKS_IO_LIVE_TEST=true`)
