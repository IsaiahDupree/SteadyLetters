# KindLetters Backend

Express.js backend API for KindLetters application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_database_url
STRIPE_SECRET_KEY=your_stripe_secret_key
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

## API Routes

### Health Check
- `GET /api/health` - Health check endpoint

### Letter Generation
- `POST /api/generate/letter` - Generate letter content

### Transcription
- `POST /api/transcribe` - Transcribe audio file (multipart/form-data with 'audio' field)

### Orders
- `GET /api/orders` - Get all orders for authenticated user
- `POST /api/orders` - Create a new order
- `PATCH /api/orders` - Update order status

## Migration Status

### ✅ Completed Routes
- `/api/health`
- `/api/generate/letter`
- `/api/transcribe`
- `/api/orders`

### 🔄 Remaining Routes to Migrate
- `/api/analyze-image`
- `/api/extract-address`
- `/api/generate/images`
- `/api/generate/card-image`
- `/api/handwriting-styles`
- `/api/billing/usage`
- `/api/auth/sync-user`
- `/api/stripe/checkout`
- `/api/stripe/portal`
- `/api/stripe/webhook`
- `/api/thanks-io/products`
- `/api/thanks-io/styles`
- `/api/thanks-io/send`
- `/api/settings/return-address`
- `/api/settings/run-tests`
- `/api/analytics/orders`
- `/api/post-deploy`
- `/api/debug`

## Architecture

- **Express.js** - Web framework
- **Prisma** - Database ORM
- **Supabase** - Authentication
- **OpenAI** - AI services
- **Stripe** - Payment processing

## Development

The backend uses TypeScript and is compiled to JavaScript in the `dist/` directory.

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

