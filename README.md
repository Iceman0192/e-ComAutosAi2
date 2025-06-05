# Vehicle Auction Intelligence Platform

A comprehensive automotive market intelligence platform for Copart and IAAI auction analysis.

## Features

### Core Functionality
- **Sales History Search** - Browse 14,650+ authentic vehicle records across 10+ manufacturers
- **Live Lot Lookup** - Real-time auction data from Copart and IAAI
- **VIN Search** - Detailed vehicle history and specifications
- **Import Calculator** - CAFTA-DR duty calculations for Central American markets
- **Active Lots Finder** - Current auction listings with detailed filters

### Data Coverage
- **Toyota**: 8,237 vehicles
- **Hyundai**: 3,954 vehicles  
- **Ford**: 1,400 vehicles
- **Honda**: 117 vehicles
- **Tesla**: 25 vehicles
- **Plus 5+ additional manufacturers**

### Subscription Plans
- **Freemium**: 10 daily searches, 5 VIN lookups/month
- **Basic ($29/month)**: 50 daily searches, 25 VIN lookups/month
- **Gold ($79/month)**: 200 daily searches, 100 VIN lookups/month
- **Platinum ($149/month)**: Unlimited access with advanced features

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- Security middleware (Helmet, Rate Limiting, Compression)
- Production monitoring and health checks

### Frontend
- React with TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- Wouter for routing
- Error boundaries and loading states

## Production Features

### Security
- Rate limiting (100 requests/15min general, 5 requests/15min auth)
- Helmet security headers
- CSRF protection
- Input validation and sanitization

### Performance
- Database indexing for optimized queries
- Response compression
- Query caching with TTL
- Memory usage monitoring

### Monitoring
- Health check endpoint (`/health`)
- Performance metrics tracking
- Error logging and handling
- Database connection monitoring

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=dbname

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
SESSION_SECRET=your-secret-key

# Optional API Keys
OPENAI_API_KEY=sk-your-key
STRIPE_SECRET_KEY=sk_your-key
VITE_STRIPE_PUBLIC_KEY=pk_your-key
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (copy from `.env.example`)

3. Initialize database:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

## Deployment

### Health Check
The application includes a comprehensive health monitoring system:
- Database connectivity checks
- Performance metrics
- Memory usage tracking
- Uptime monitoring

Access health status at: `GET /health`

### Production Optimizations
- Optimized database queries with proper indexing
- Compressed responses for faster load times
- Error boundaries for graceful failure handling
- Production-ready logging and monitoring

## Database Schema

### Core Tables
- `sales_history` - Vehicle auction records
- `users` - User accounts and authentication
- `user_subscriptions` - Subscription management
- `user_usage` - Usage tracking and limits
- `subscription_plans` - Available plans and features

### Indexes
- `idx_sales_history_make_model` - Make/model searches
- `idx_sales_history_vin` - VIN lookups
- `idx_sales_history_year_site` - Year/site filtering
- `idx_sales_history_sale_date` - Date-based queries

## Contributing

This is a production-ready platform with comprehensive error handling, security measures, and performance optimizations suitable for immediate deployment.