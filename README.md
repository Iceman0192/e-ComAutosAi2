# EcomaAutos.ai - Vehicle Auction Intelligence Platform

A sophisticated automotive market intelligence platform that transforms complex auction data into actionable insights through advanced analytics and user-friendly design.

## Features

- **Multi-Platform Data Collection**: Comprehensive auction data from Copart and IAAI
- **AI-Powered Analysis**: Advanced vehicle valuation and market insights
- **Real-Time Monitoring**: Live auction lot tracking and analysis
- **VIN History Search**: Complete vehicle history with auction records
- **Import Calculator**: Cost analysis for international vehicle imports
- **Tier-Based Access**: Flexible subscription plans from Free to Enterprise
- **Admin Controls**: Complete platform management and monitoring tools

## Technology Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT-based auth system
- **APIs**: Copart and IAAI data integration
- **Deployment**: Replit-ready configuration

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ecomautos-ai.git
   cd ecomautos-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and API credentials
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
COPART_API_KEY=your_copart_api_key
IAAI_API_KEY=your_iaai_api_key
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── contexts/       # React contexts
│   │   └── lib/           # Utility functions
├── server/                 # Express backend
│   ├── routes/            # API route handlers
│   ├── middleware/        # Custom middleware
│   └── services/          # Business logic
├── shared/                # Shared types and schemas
└── docs/                  # Documentation
```

## Subscription Tiers

- **Free**: Basic cached sales history access
- **Basic ($19/mo)**: Fresh API data access
- **Gold ($49/mo)**: Live analysis tools
- **Platinum ($99/mo)**: AI-powered insights
- **Enterprise ($299/mo)**: Full feature access
- **Admin**: Complete platform control

## API Documentation

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
```

### Vehicle Data
```bash
GET /api/sales-history/:platform
GET /api/vin-history/:vin
GET /api/active-lots
```

### Admin Controls
```bash
GET /api/admin/users
POST /api/admin/data-collection
GET /api/admin/system-stats
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and subscriptions
- `sales_records` - Vehicle auction data
- `vin_history` - Complete vehicle histories
- `active_lots` - Current auction listings
- `subscriptions` - User subscription management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@ecomautos.ai or create an issue in this repository.

## Deployment

The application is configured for deployment on Replit with automatic scaling and database management.

### Manual Deployment Steps

1. Set up your production database
2. Configure environment variables
3. Run database migrations: `npm run db:push`
4. Start the production server: `npm start`

## Performance

- Database indexes optimized for fast searches
- Caching layer for frequently accessed data
- Rate limiting and API throttling
- Efficient pagination for large datasets

## Security

- JWT-based authentication
- Role-based access control
- API rate limiting
- Input validation and sanitization
- SQL injection protection via Drizzle ORM