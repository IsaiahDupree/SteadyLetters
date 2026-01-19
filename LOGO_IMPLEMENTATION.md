# Logo Implementation Guide

The logo (`/public/logo.png`) is now referenced throughout the application in the following locations:

## ✅ Logo References

### 1. **Favicon & Browser Icons**
- **Location:** `src/app/layout.tsx`
- **Metadata Icons:**
  - Standard favicon (16x16, 32x32, any size)
  - Apple touch icon (180x180)
  - Shortcut icon
- **File:** `src/app/favicon.ico` (exists, but metadata uses logo.png)

### 2. **Open Graph (Social Media)**
- **Location:** `src/app/layout.tsx`
- **Includes:**
  - Open Graph image for Facebook, LinkedIn, etc.
  - Twitter Card image
  - Image dimensions: 1200x630 (standard OG image size)

### 3. **Web App Manifest**
- **Location:** `public/site.webmanifest`
- **Includes:**
  - PWA icons (192x192, 512x512)
  - App name and description
  - Theme colors

### 4. **Navigation Bar**
- **Location:** `src/components/navbar.tsx`
- **Component:** Uses `<Logo />` component
- **Display:** Logo with wordmark on all pages

### 5. **Logo Component**
- **Location:** `src/components/logo.tsx`
- **Features:**
  - Displays `/logo.png` image
  - Includes "SteadyLetters" wordmark
  - Responsive sizing (40x40 default)
  - Priority loading for performance

### 6. **Footer**
- **Location:** `src/components/footer.tsx`
- **Display:** Logo with wordmark (scaled to 75%)
- **Link:** Clickable, links to homepage

## 📁 File Locations

```
public/
  └── logo.png          # Main logo file (referenced everywhere)

src/
  ├── app/
  │   ├── favicon.ico    # Legacy favicon (Next.js will use this if metadata doesn't override)
  │   └── layout.tsx     # Metadata with logo references
  └── components/
      ├── logo.tsx       # Logo component
      ├── navbar.tsx     # Uses Logo component
      └── footer.tsx     # Uses Logo component
```

## 🎨 Usage Guidelines

1. **Always use the Logo component** (`<Logo />`) instead of directly referencing the image
2. **Logo path:** Always use `/logo.png` (public folder)
3. **Sizing:** Component handles default sizing, can be customized with className
4. **Accessibility:** Alt text is included in the component

## 🔄 How to Update Logo

1. Replace `public/logo.png` with new logo file
2. Keep the same filename (`logo.png`)
3. Recommended sizes:
   - Main logo: 512x512px or larger (square)
   - For favicon: 32x32px minimum
   - For OG images: 1200x630px (if creating separate OG image)

## ✅ All Logo References Verified

- ✅ Favicon (browser tab)
- ✅ Apple touch icon (iOS home screen)
- ✅ Open Graph image (social media sharing)
- ✅ Twitter Card image
- ✅ PWA manifest icons
- ✅ Navigation bar
- ✅ Footer
- ✅ Logo component

---

**Last Updated:** November 25, 2024


