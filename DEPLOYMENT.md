# Deployment Guide

## GitHub Repository Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `ecomautos-ai` or your preferred name
3. Set it to Public or Private as needed
4. Don't initialize with README (we already have one)

### 2. Connect Local Project to GitHub

From your local project directory, run these commands:

```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Make initial commit
git commit -m "Initial commit: EcomaAutos.ai platform"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/ecomautos-ai.git

# Push to GitHub
git push -u origin main
```

### 3. Export from Replit

If you're using Replit, you can export your project:

1. Click the three dots menu in Replit
2. Select "Download as zip"
3. Extract the zip file
4. Navigate to the extracted folder
5. Follow the GitHub setup steps above

## Production Deployment Options

### Option 1: Vercel (Recommended for Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

### Option 2: Railway (Full-Stack)

1. Connect GitHub repository to Railway
2. Set environment variables
3. Railway will auto-detect Node.js and deploy

### Option 3: Heroku

1. Create new Heroku app
2. Connect to GitHub repository
3. Set environment variables in Heroku dashboard
4. Enable automatic deploys from main branch

### Option 4: DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure environment variables
3. Set up database component
4. Deploy with automatic SSL

## Environment Setup

### Required Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
NODE_ENV=production
PORT=5000
```

### Optional API Keys

```env
COPART_API_KEY=your-copart-key
IAAI_API_KEY=your-iaai-key
STRIPE_SECRET_KEY=your-stripe-key
```

## Database Setup

### Option 1: Neon (Recommended)

1. Create account at [Neon](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`
4. Run migrations: `npm run db:push`

### Option 2: PlanetScale

1. Create account at [PlanetScale](https://planetscale.com)
2. Create new database
3. Get connection string
4. Configure SSL mode

### Option 3: Supabase

1. Create project at [Supabase](https://supabase.com)
2. Get PostgreSQL connection details
3. Set up connection string

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Build process successful (`npm run build`)
- [ ] No console errors in production build
- [ ] API endpoints tested
- [ ] Authentication flow verified
- [ ] Payment integration tested (if applicable)
- [ ] SSL certificate configured
- [ ] Domain name configured (if custom domain)

## Post-Deployment

### Monitoring

1. Set up error tracking (Sentry recommended)
2. Configure uptime monitoring
3. Set up log aggregation
4. Monitor database performance

### Scaling

1. Configure auto-scaling based on traffic
2. Set up CDN for static assets
3. Implement caching strategies
4. Database read replicas if needed

## Backup Strategy

1. Automated database backups
2. Code repository in GitHub
3. Environment variables documented
4. Recovery procedures documented

## Security Considerations

1. Use strong JWT secrets
2. Enable HTTPS only
3. Configure CORS properly
4. Rate limiting enabled
5. Input validation on all endpoints
6. Regular security updates

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify connection string
   - Check firewall settings
   - Ensure SSL configuration

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies installed
   - Review build logs

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check session configuration
   - Review CORS settings

### Performance Optimization

1. Enable gzip compression
2. Optimize database queries
3. Implement caching
4. Use CDN for assets
5. Minify JavaScript/CSS