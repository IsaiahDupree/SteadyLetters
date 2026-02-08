# Photo/Image Attachment Feature (SL-115)

## Overview

The Photo/Image Attachment feature allows users to upload and attach photos to their letters, which will be printed alongside the handwritten message. This enhances personalization and visual appeal of physical mail.

## Feature Status

✅ **COMPLETE** - All acceptance criteria met, 14 tests passing

## User Flow

1. User navigates to the Send page (`/send`)
2. User fills in recipient, message, and other letter details
3. User optionally uploads a photo (drag-and-drop or click to upload)
4. Photo is automatically uploaded to Supabase Storage
5. Preview shows the attached photo
6. When letter is sent, photo URL is included in the order
7. Thanks.io prints the photo alongside the letter

## Technical Implementation

### Components

#### 1. PhotoUpload Component (`src/components/photo-upload.tsx`)

**Features:**
- Drag-and-drop file upload
- Click to browse for files
- Automatic upload on file selection
- Image preview with remove button
- File type validation (image/* only)
- File size validation (10MB max)
- Loading states during upload
- Disabled state support

**Props:**
```typescript
interface PhotoUploadProps {
  value?: string;              // Current photo URL
  onChange: (url: string | null) => void;  // Callback with uploaded URL
  maxSizeMB?: number;          // Max file size (default: 10MB)
  bucket?: string;             // Supabase bucket (default: 'images')
  disabled?: boolean;          // Disable upload
}
```

**Usage:**
```tsx
<PhotoUpload
  value={attachedPhotoUrl || undefined}
  onChange={setAttachedPhotoUrl}
  maxSizeMB={10}
  disabled={submitting}
/>
```

#### 2. SendForm Integration (`src/features/send/send-form.tsx`)

**Changes:**
- Added `attachedPhotoUrl` state
- User-attached photo takes precedence over template images
- Photo preview in preview panel
- Shows indicator when custom photo overrides template

**Logic:**
```typescript
// Prefer user-attached photo over template image
const imageUrl = attachedPhotoUrl || template?.frontImageUrl || undefined;

const result = await createOrder({
  recipientId,
  message,
  frontImageUrl: imageUrl,
  // ... other fields
});
```

### API Endpoints

#### POST `/api/upload/image`

Uploads an image to Supabase Storage and returns the public URL.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required (Supabase Auth)

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file to upload |
| `bucket` | string | No | Storage bucket (default: 'images') |

**Validation:**
- Must be authenticated
- File must be an image (`image/*`)
- File size must be ≤ 10MB

**Response (Success):**
```json
{
  "success": true,
  "url": "https://...supabase.co/.../user-123/1675845600000.jpg",
  "fileName": "photo.jpg",
  "size": 524288,
  "type": "image/jpeg"
}
```

**Response (Error):**
```json
{
  "error": "File too large. Maximum size is 10MB."
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid file (type or size)
- `401` - Unauthorized
- `500` - Upload failed

### Storage

Images are stored in Supabase Storage with the following structure:

```
bucket: images/
  user-abc123/
    1675845600000.jpg
    1675845700000.png
  user-xyz789/
    1675845800000.jpg
```

**Path Format:** `{userId}/{timestamp}.{extension}`

**Benefits:**
- User isolation (privacy)
- Unique filenames (timestamp-based)
- Easy cleanup per user
- Organized by owner

## Supported Product Types

Photo attachment is supported for all Thanks.io product types:

| Product Type | Supported | Notes |
|--------------|-----------|-------|
| Postcard | ✅ Yes | Uses `front_image_url` |
| Letter | ✅ Yes | Uses `front_image_url` |
| Greeting Card | ✅ Yes | Uses `front_image_url` |
| Windowless Letter | ✅ Yes | Uses `front_image_url` |

## File Specifications

### Supported Formats
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WEBP (`.webp`)
- GIF (`.gif`)

### Size Limits
- **Maximum file size:** 10MB
- **Recommended dimensions:** 1200x1200px or larger
- **Aspect ratio:** Any (Thanks.io will crop as needed)

### Best Practices
- Use high-resolution images for best print quality
- Avoid heavily compressed JPEGs
- Ensure photos are well-lit and in focus
- Portrait orientation works best for most products

## User Experience

### Upload States

1. **Empty State**
   ```
   [Upload icon]
   Drop a photo here or click to upload
   PNG, JPG, WEBP up to 10MB
   Optional - Adds a visual element to your letter
   ```

2. **Uploading State**
   ```
   [Spinner overlay]
   Image preview with loading indicator
   ```

3. **Uploaded State**
   ```
   [Image preview]
   [Remove button]
   This photo will be printed alongside your letter
   ```

### Error Handling

The component provides user-friendly error messages:

| Error | Message |
|-------|---------|
| Invalid file type | "Please select an image file" |
| File too large | "Image too large. Maximum size is 10MB." |
| Upload failed | "Failed to upload photo. Please try again." |

All errors are shown via toast notifications (Sonner).

## Testing

### Test Coverage

**Integration Tests:** `tests/integration/photo-attachment.test.mjs`

14 tests covering:
- Image file type validation
- File size validation (10MB max)
- Unique filename generation
- Photo URL handling (user vs template priority)
- Order creation with photo attachment
- Storage path organization
- Support for all product types
- Feature requirements compliance

**Test Results:**
```
✓ Photo Attachment Feature (SL-115) (14 tests)
  ✓ Image Upload API Validation (3 tests)
  ✓ Photo URL Handling (3 tests)
  ✓ Order Creation with Photo Attachment (3 tests)
  ✓ Storage Path Generation (2 tests)
  ✓ Feature Requirements (3 tests)
```

### Running Tests

```bash
# Run all integration tests
npm test tests/integration/photo-attachment.test.mjs

# Run all tests
npm test
```

## Security

### Authentication
- API endpoint requires valid Supabase authentication
- Unauthenticated requests return `401 Unauthorized`

### User Isolation
- Files stored in user-specific directories
- Users can only access their own uploads
- No cross-user file access

### Validation
- Server-side file type validation
- Server-side file size validation
- Extension preserved but filename randomized

### Future Considerations
- Add virus scanning for uploaded files
- Implement file cleanup for deleted orders
- Add image optimization/compression

## Usage Tracking

Photo uploads count toward usage limits:
- **Storage:** Each image counts toward user's storage quota
- **API calls:** Upload API calls may count toward rate limits
- **Bandwidth:** Download bandwidth applies when sending orders

## Pricing Impact

Attaching photos does not change Thanks.io pricing:
- Postcard: $1.14 (4x6) with or without image
- Letter: $1.20 with or without image
- Greeting Card: $3.00 with or without image

The `front_image_url` parameter is free on all Thanks.io products.

## Migration Notes

### Existing Users
- No migration required
- Feature is opt-in (images are optional)
- Existing template images continue to work
- User photos override template images

### Backwards Compatibility
- `frontImageUrl` field already existed
- Component is additive (no breaking changes)
- Orders without images work as before

## Future Enhancements

Potential improvements for future iterations:

1. **Image Editing**
   - Crop/rotate before upload
   - Filters and adjustments
   - Text overlay

2. **Photo Library**
   - Gallery of user's uploaded photos
   - Reuse photos across orders
   - Photo management page

3. **AI Enhancements**
   - Auto-enhance photo quality
   - Remove backgrounds
   - Suggest optimal crop

4. **Multiple Photos**
   - Attach multiple photos to one letter
   - Photo collages
   - Photo grid layouts

5. **Stock Photos**
   - Library of stock images
   - Themed collections
   - Seasonal photos

## Documentation Updates

This feature affects the following documentation:

- ✅ PRD_STEADYLETTERS.md - Core features
- ✅ feature_list.json - Feature tracking
- ✅ PHOTO_ATTACHMENT.md - This file

## Support

For issues or questions:
- Check error messages in toast notifications
- Review browser console for detailed errors
- Verify Supabase Storage bucket is configured
- Ensure NEXT_PUBLIC_SUPABASE_URL is set

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-08 | Initial implementation |

---

**Feature ID:** SL-115
**Status:** ✅ Complete
**Priority:** P1
**Category:** Core
