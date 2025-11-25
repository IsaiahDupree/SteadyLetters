# KindLetters Phase 2 Implementation Plan

## Goal
Enhance KindLetters with real database integration, dashboard analytics, order tracking, and full Thanks.io API integration.

## Proposed Changes

### Dashboard & Analytics
#### [NEW] [Dashboard Page](file:///Users/isaiahdupree/Documents/Software/KindLetters/src/app/dashboard/page.tsx)
- Create `/dashboard` as the home page
- Display key metrics:
  - Total letters sent (all time)
  - Letters sent this week
  - Recent orders (last 5)
  - Status breakdown (pending, sent, delivered)
- Use ShadCN Card components for metric cards

---

### Database Integration
#### [NEW] [Server Actions](file:///Users/isaiahdupree/Documents/Software/KindLetters/src/app/actions/)
Create server actions for:
- **Recipients**: `createRecipient`, `getRecipients`, `updateRecipient`, `deleteRecipient`
- **Templates**: `createTemplate`, `getTemplates`, `updateTemplate`, `deleteTemplate`
- **Orders**: `createOrder`, `getOrders`, `getOrderById`

#### [MODIFY] Existing Forms
Update forms to use server actions instead of mock data:
- `recipient-form.tsx` - call `createRecipient`
- `template-form.tsx` - call `createTemplate`
- `send-form.tsx` - call `createOrder`

---

### Thanks.io API Integration
#### [MODIFY] [Thanks.io Client](file:///Users/isaiahdupree/Documents/Software/KindLetters/src/lib/thanks-io.ts)
- Add `getHandwritingStyles()` method
- Implement proper error handling
- Add TypeScript types for API responses

#### [NEW] [API Route for Handwriting Styles](file:///Users/isaiahdupree/Documents/Software/KindLetters/src/app/api/handwriting-styles/route.ts)
- Fetch styles from Thanks.io
- Cache results in memory or Redis (optional)
- Return to frontend

#### [MODIFY] Template Form
- Fetch real handwriting styles on mount
- Display in dropdown with style names

---

### Order History
#### [NEW] [Orders Page](file:///Users/isaiahdupree/Documents/Software/KindLetters/src/app/orders/page.tsx)
- Table view of all sent orders
- Columns: Date, Recipient, Template, Status, Thanks.io Order ID
- Link to Thanks.io tracking (if available)
- Filter by status

---

### Image Upload
#### [NEW] [Image Upload Component](file:///Users/isaiahdupree/Documents/Software/KindLetters/src/components/image-upload.tsx)
- Use Supabase Storage for image uploads
- Support drag-and-drop
- Image preview
- Store public URL in database

#### [MODIFY] Template Form
- Replace URL input with image upload component
- Upload to `templates` bucket in Supabase Storage

---

## Verification Plan

### Testing
- Verify Recipients CRUD operations work with real database
- Verify Templates CRUD operations work with real database
- Test order creation and tracking
- Verify handwriting styles load from Thanks.io (with API key)

### Manual Verification
- Create a recipient via UI → verify in Supabase Studio
- Create a template with uploaded image → verify image in Supabase Storage
- Send a test order → verify order record in database
