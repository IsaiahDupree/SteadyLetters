# Browser Testing Guide

Step-by-step guide for testing the frontend/backend integration in your browser.

## Prerequisites

✅ Both servers running:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Step 1: Open the Application

1. Open your browser
2. Navigate to: **http://localhost:3000**
3. You should see the SteadyLetters homepage

## Step 2: Open Developer Tools

**Chrome/Edge:**
- Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

**Firefox:**
- Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

**Safari:**
- Enable Developer menu: Preferences → Advanced → Show Develop menu
- Press `Cmd+Option+I`

## Step 3: Check Console for Errors

1. Go to the **Console** tab
2. Look for any red error messages
3. **Expected**: No errors (or only warnings about missing API keys)

**Common Issues:**
- ❌ CORS errors → Check backend CORS configuration
- ❌ Network errors → Check backend is running
- ❌ 401 errors → Expected for protected routes (need authentication)

## Step 4: Monitor Network Requests

1. Go to the **Network** tab
2. Refresh the page (`Cmd+R` / `Ctrl+R`)
3. Filter by "Fetch/XHR" to see API calls
4. Look for requests to `http://localhost:3001`

**What to Check:**
- ✅ Requests go to `localhost:3001` (backend)
- ✅ Status codes: 200 (success) or 401 (auth required)
- ✅ No CORS errors
- ✅ Response times are reasonable

## Step 5: Test Authentication

### Sign Up
1. Click "Sign Up" or navigate to `/signup`
2. Enter email and password
3. Submit the form
4. **Check Network tab**: Should see request to `/api/auth/sync-user`
5. **Expected**: Redirect to dashboard or success message

### Sign In
1. Click "Sign In" or navigate to `/login`
2. Enter credentials
3. Submit the form
4. **Check Network tab**: Should see auth-related requests
5. **Expected**: Redirect to dashboard

### Verify Session
1. After signing in, check browser cookies
2. **DevTools → Application → Cookies**
3. Look for Supabase auth cookies
4. **Expected**: Cookies present with auth tokens

## Step 6: Test Letter Generation

1. Navigate to `/generate`
2. Fill in the letter form:
   - Context: "Write a thank you letter to my friend"
   - Tone: Select "Warm"
   - Occasion: Select "Thank You"
3. Click "Generate Letter"
4. **Check Network tab**: 
   - Should see `POST /api/generate/letter` to `localhost:3001`
   - Status: 200 (if authenticated) or 401 (if not)
5. **Expected**: Letter appears below the form

## Step 7: Test Voice Transcription

1. On the generate page, find the voice recorder
2. Click the microphone button
3. Speak for a few seconds
4. Click stop
5. **Check Network tab**:
   - Should see `POST /api/transcribe` to `localhost:3001`
   - Request includes FormData with audio file
6. **Expected**: Transcribed text appears in context field

**Note**: Requires microphone permissions in browser

## Step 8: Test Image Analysis

1. On the generate page, find the image upload section
2. Click to upload an image or drag & drop
3. Click "Analyze Image"
4. **Check Network tab**:
   - Should see `POST /api/analyze-image` to `localhost:3001`
   - Request includes FormData with image file
5. **Expected**: Image analysis text appears

## Step 9: Test Image Generation

1. After generating a letter, look for image generation options
2. Click "Generate Card Designs" or similar
3. **Check Network tab**:
   - Should see `POST /api/generate/images` to `localhost:3001`
4. **Expected**: 4 card images appear

## Step 10: Test Billing/Usage

1. Navigate to `/billing`
2. **Check Network tab**:
   - Should see `GET /api/billing/usage` to `localhost:3001`
3. **Expected**: Usage statistics display

## Step 11: Test Address Extraction

1. Navigate to a page with address extraction (if available)
2. Upload an image of an envelope or letter
3. Click "Extract Address"
4. **Check Network tab**:
   - Should see `POST /api/extract-address` to `localhost:3001`
5. **Expected**: Extracted address appears

## Step 12: Test Orders

1. Navigate to `/orders` or similar
2. **Check Network tab**:
   - Should see `GET /api/orders` to `localhost:3001`
3. **Expected**: Order list displays (may be empty)

## Common Issues & Solutions

### Issue: All API calls return 401
**Solution**: 
- Sign in first
- Check cookies are being sent (Network tab → Request Headers → Cookie)
- Verify Supabase credentials in `.env.local`

### Issue: CORS errors
**Solution**:
- Check `FRONTEND_URL` in backend `.env` matches frontend URL exactly
- Verify CORS middleware is configured correctly
- Check browser console for specific CORS error

### Issue: Network errors (failed to fetch)
**Solution**:
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local` is `http://localhost:3001`
- Restart both servers

### Issue: API calls go to wrong URL
**Solution**:
- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Verify `api-config.ts` is using the correct base URL
- Clear browser cache and hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`)

### Issue: Features don't work (but API calls succeed)
**Solution**:
- Check API response in Network tab
- Look for error messages in response body
- Check console for JavaScript errors
- Verify required environment variables are set (OpenAI key, etc.)

## Testing Checklist

- [ ] Homepage loads
- [ ] No console errors
- [ ] Network requests go to `localhost:3001`
- [ ] Sign up works
- [ ] Sign in works
- [ ] Cookies are set after auth
- [ ] Letter generation works (if authenticated)
- [ ] Voice transcription works (if authenticated)
- [ ] Image analysis works (if authenticated)
- [ ] Image generation works (if authenticated)
- [ ] Billing page loads usage data
- [ ] Orders page loads (if authenticated)
- [ ] No CORS errors
- [ ] API responses are reasonable (< 5 seconds)

## Performance Checks

1. **Response Times**: Check Network tab timing
   - ✅ < 1s: Excellent
   - ✅ 1-3s: Good
   - ⚠️  3-5s: Acceptable
   - ❌ > 5s: Needs optimization

2. **File Uploads**: 
   - Image uploads should show progress
   - Audio uploads should complete within 30s

3. **Error Handling**:
   - Errors should display user-friendly messages
   - Network errors should be caught and handled

## Next Steps

After browser testing:
1. ✅ All features working
2. ✅ No critical errors
3. 📝 Document any issues found
4. 🔧 Fix any bugs discovered
5. 🚀 Ready for deployment

---

**Tip**: Keep the Network tab open while testing to see all API interactions in real-time!

