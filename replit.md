# Vehicle Sales History Analyzer Project Guide

## Overview
This project is a vehicle sales history analysis web application built with a React frontend and Node.js/Express backend. It allows users to track and analyze vehicle sales data across multiple auction sites, visualizing price trends, geographic distribution, and detailed sale information.

The application features:
- Vehicle information display 
- Sales history timeline visualization
- Geographic distribution of sales
- Tabular view of sales data
- Filtering capabilities by date range, price, sale status, and more
- Responsive design for mobile and desktop

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **UI Components**: Shadcn UI component library with Tailwind CSS for styling
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Data Visualization**: Recharts for timeline charts, custom US map for geographic data

### Backend
- **Framework**: Express.js running on Node.js
- **API**: RESTful API endpoints for sales history data
- **Data Fetching**: External API integration with APICAR (using axios with caching)
- **Database**: Drizzle ORM with PostgreSQL (configured but not fully implemented)

### Data Flow
1. Client makes requests to Express backend via REST API endpoints
2. Backend either:
   - Retrieves data from database (for user authentication, etc.)
   - Forwards requests to external APICAR API and processes responses
3. Processed data is sent back to the client as JSON
4. Client renders data using various visualization components

## Key Components

### Backend Components
- **Server Setup** (`server/index.ts`): Express application configuration with middleware for logging
- **Routes** (`server/routes.ts`): API endpoint definitions with caching for external API calls
- **Storage** (`server/storage.ts`): Interface and implementation for data persistence

### Frontend Components
- **App Structure** (`client/src/App.tsx`): Main application structure with routing
- **Pages**:
  - `Home`: Main dashboard with vehicle info and sales visualizations
  - `NotFound`: 404 error page
- **Sales Components**:
  - `VehicleInfo`: Displays basic vehicle information
  - `SummaryStatistics`: Shows key metrics (average price, success rate, etc.)
  - `SalesTimeline`: Timeline chart of sales prices
  - `SalesGeographic`: US map showing geographic distribution of sales
  - `SalesTable`: Tabular view of sales data with sorting and filtering
  - `SaleDetail`: Detailed view of an individual sale

### Shared Components
- **Schema** (`shared/schema.ts`): Database table definitions, validation schemas using Drizzle and Zod

## Data Models
- **User**: Basic user information for authentication
- **SaleHistory**: Sales records with auction details, prices, buyer info
- **Vehicle**: Vehicle specifications and identification data

## External Dependencies

### Backend Dependencies
- **Drizzle ORM**: Database ORM for PostgreSQL
- **@neondatabase/serverless**: PostgreSQL database client
- **Axios**: HTTP client for external API requests
- **Zod**: Schema validation

### Frontend Dependencies
- **React**: UI library
- **React Query**: Data fetching and caching
- **Radix UI**: Accessible UI primitives
- **Recharts**: Chart visualization library
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Component library (built on Radix UI)

## Development Workflow
1. Run `npm run dev` to start the development server
2. Backend runs on Express, serving API endpoints and also proxying to Vite dev server
3. Frontend is built with Vite and served through the Express backend in development
4. Use `npm run build` to build for production
5. Use `npm run start` to run the production build

## Deployment Strategy
The application is configured to deploy on Replit:
1. **Build Step**: `npm run build` to:
   - Build the React frontend with Vite
   - Bundle the server with esbuild
2. **Run Step**: `npm run start` to start the Express server that:
   - Serves the static frontend assets
   - Provides the backend API endpoints

## Database Setup
The project is configured to use PostgreSQL with Drizzle ORM:
1. Schema definitions are in `shared/schema.ts`
2. Drizzle configuration is in `drizzle.config.ts`
3. The database connection is established using the `DATABASE_URL` environment variable

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `APICAR_BASE_URL`: Base URL for the external vehicle API
- `APICAR_API_KEY`: API key for authentication with the external API
- `NODE_ENV`: Environment mode (development/production)

## Getting Started
1. Ensure PostgreSQL module is enabled in Replit
2. Set the required environment variables
3. Run `npm run dev` to start the development server
4. Run `npm run db:push` to create the database schema