# 📸 Address Extraction Feature

## Overview

The Address Extraction feature allows users to take a photo of a letter they received and automatically extract the return address (sender's address) from the image. Once extracted, users can review and add it as a recipient with a single click.

## User Flow

1. **Navigate to Recipients Page** (`/recipients`)
2. **Upload Letter Image**
   - Click "Take Photo & Add Recipient" card
   - Upload an image file or use device camera
   - Supports drag-and-drop
3. **Extract Address**
   - Click "Extract Return Address" button
   - AI analyzes the image using GPT-4 Vision
   - System extracts return address information
4. **Review & Add**
   - If address is found, a prompt appears: "We found this return address. Would you like to add this as a recipient?"
   - Review and edit the extracted fields if needed
   - Click "Add Recipient" to save

## Technical Implementation

### API Endpoint

**`POST /api/extract-address`**

- **Authentication**: Required (uses `getAuthenticatedUser`)
- **Input**: FormData with `image` file
- **Output**: JSON with extracted address or error message

**Response Format:**
```json
{
  "address": {
    "name": "John Doe",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90210",
    "country": "US"
  },
  "message": "Return address found! Would you like to add this as a recipient?"
}
```

**Error Response:**
```json
{
  "address": null,
  "message": "No return address found in the image. Please try a different image."
}
```

### Components

1. **`AddressExtractor`** (`src/components/address-extractor.tsx`)
   - Main component for photo upload and address extraction
   - Handles file upload, image preview, extraction, and recipient creation
   - Shows success/error states

2. **Recipients Page** (`src/app/recipients/page.tsx`)
   - Displays the `AddressExtractor` component above the recipient list
   - Marked as dynamic to support authentication

### Server Actions

**Updated `src/app/actions/recipients.ts`**
- Now uses authenticated user (replaced `'default-user'` with actual user ID)
- `createRecipient()` - Creates recipient with user authentication
- `getRecipients()` - Fetches recipients for authenticated user
- `deleteRecipient()` - Deletes recipient with ownership verification

### AI Integration

- **Model**: GPT-4o with Vision
- **Prompt**: Specifically asks for RETURN ADDRESS (sender's address, not delivery address)
- **Response Format**: JSON object with structured address fields
- **Error Handling**: Handles cases where no address is found or JSON parsing fails

### Usage Tracking

- Uses `imageGenerations` limit (same as image analysis)
- Increments usage counter after successful extraction
- Tracks events for analytics (`image_analyzed` with type `address_extraction`)
- Enforces tier-based limits (FREE, PRO, BUSINESS)

## Features

✅ **Photo Upload**
- Drag-and-drop support
- Click to upload
- Camera capture support (mobile)
- Image preview
- File validation (type, size)

✅ **AI-Powered Extraction**
- GPT-4 Vision analysis
- Structured JSON response
- Handles various letter/envelope formats
- Extracts: name, address lines, city, state, ZIP, country

✅ **User-Friendly UI**
- Clear success/error messages
- Editable address fields
- Validation before saving
- Loading states during extraction

✅ **Security**
- Authentication required
- User-specific data isolation
- Usage limit enforcement

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── extract-address/
│   │       └── route.ts          # API endpoint
│   ├── actions/
│   │   └── recipients.ts         # Server actions (updated)
│   └── recipients/
│       └── page.tsx              # Recipients page (updated)
├── components/
│   └── address-extractor.tsx     # Main component
tests/
├── address-extraction.test.mjs   # API tests
└── e2e/
    └── address-extraction.spec.ts # E2E tests
```

## Testing

### API Tests (`tests/address-extraction.test.mjs`)
- Authentication requirements
- File validation
- Response format validation
- Address parsing
- Usage tracking
- Error handling

### E2E Tests (`tests/e2e/address-extraction.spec.ts`)
- Complete user flow
- UI interactions
- Form validation
- Error states

## Usage Limits

Address extraction uses the same limits as image analysis:
- **FREE**: 10 image analyses/month
- **PRO**: 100 image analyses/month
- **BUSINESS**: 400 image analyses/month

## Error Handling

The system handles:
- Missing or invalid image files
- Files too large (>20MB)
- No address found in image
- OpenAI API errors
- JSON parsing errors
- Authentication failures
- Usage limit exceeded

## Future Enhancements

Potential improvements:
- Separate `imageAnalyses` usage counter (currently uses `imageGenerations`)
- Batch address extraction from multiple images
- Address validation and standardization
- OCR fallback for better accuracy
- Support for international addresses
- Address book suggestions based on extracted addresses

## Notes

- The feature specifically extracts the **return address** (sender's address), not the delivery address
- State codes are normalized to 2-letter abbreviations (e.g., "CA", "NY")
- ZIP codes support both 5-digit and 9-digit formats
- Country defaults to "US" if not visible in the image
- All address fields are editable before saving


