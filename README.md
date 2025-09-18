# VeloSight - Project Delivery Confidence Platform

## 📋 Overview

VeloSight is a comprehensive project management and delivery confidence assessment platform designed to help organizations track, analyze, and improve their project delivery capabilities through advanced analytics and AI-powered insights.

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **State Management**: React Query + Context API

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn)
│   ├── project/        # Project-specific components
│   ├── reports/        # Report-related components
│   └── knowledge/      # Knowledge repository components
├── lib/                # Core utilities and business logic
│   ├── constants.ts    # Application constants
│   ├── errors.ts       # Error handling utilities
│   ├── validators.ts   # Input validation
│   ├── webhooks.ts     # Webhook management
│   ├── file-operations.ts  # File upload/download
│   ├── analysis.ts     # Analysis utilities
│   ├── project-service.ts  # Project CRUD operations
│   ├── config.ts       # Configuration management
│   └── performance.ts  # Performance monitoring
├── pages/              # Page components
├── context/            # React contexts
├── hooks/              # Custom React hooks
├── utils/              # Legacy utilities (being phased out)
└── types/              # TypeScript type definitions
```

## 🚀 Development Setup

### Prerequisites

- Node.js 18+ 
- npm/yarn/bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd velosight

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

The application uses centralized configuration in `src/lib/config.ts`. No environment variables are required for basic operation as Supabase credentials are embedded.

## 📚 Core Features

### 1. Project Management
- Create, update, and manage projects
- Document upload and categorization
- Real-time project metrics and status tracking

### 2. Analysis & Reports
- **Delivery Confidence Assessment**: AI-powered project delivery predictions
- **Risk Assessment**: Comprehensive risk analysis and mitigation strategies  
- **Gateway Reviews**: Stage-gate review automation
- **Hypothesis Generation**: Data-driven hypothesis creation
- **Custom Analysis**: Flexible analysis framework

### 3. Knowledge Repository
- Centralized assurance materials library
- Best practices and templates
- Organizational knowledge management

### 4. User Management
- Role-based access control (Admin, User, Authenticated)
- Secure authentication with Supabase Auth
- User activity tracking

## 🛠️ Component Library

### Reusable UI Components

- **InfoCard**: Standardized information display cards
- **ConfirmDialog**: Consistent confirmation dialogs
- **LoadingSpinner**: Loading states with performance tracking
- **ErrorBoundary**: Graceful error handling
- **EnhancedLoading**: Smart loading states with skeletons

## 🔐 Security

### Input Validation
- All user inputs are validated using `src/lib/validators.ts`
- Automatic sanitization prevents XSS attacks
- File upload validation with type and size restrictions

### Authentication & Authorization
- Supabase Auth with JWT tokens
- Row Level Security (RLS) policies on all database tables
- Role-based access control throughout the application

### Error Handling
- Centralized error handling with `src/lib/errors.ts`
- Sensitive information filtering in production
- Comprehensive logging for debugging

## 📊 Performance

### Monitoring
- Performance tracking with `src/lib/performance.ts`
- Component render time monitoring (development)
- API call duration tracking
- User action analytics

### Optimization Features
- Lazy loading for route components
- React Query for efficient data fetching
- Image optimization for uploads
- Progressive loading states

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Platforms
- **Recommended**: Vercel, Netlify, or similar static hosting
- **Requirements**: Node.js 18+ environment
- **Environment**: All configuration is embedded, no environment variables needed

## 🐛 Troubleshooting

### Common Issues

#### Upload Failures
- Check file size (max 10MB)
- Verify file type is supported
- Ensure stable internet connection

#### Authentication Issues
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Verify network connectivity

#### Performance Issues
- Check Network tab in browser DevTools
- Disable browser extensions
- Try different browser

### Debug Mode
Development builds include additional debugging:
- Performance metrics in console
- Detailed error messages
- Component render tracking

## 📞 Support

### Internal Support
- **Email**: support@velosight.internal
- **Phone**: +1 (555) 123-4567 (24/7 for critical issues)
- **Documentation**: Built-in FAQ system at `/faq`

---

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Complete refactoring for maintainability
- ✅ Centralized error handling and validation
- ✅ Reusable component library
- ✅ Performance monitoring
- ✅ Enhanced security measures
- ✅ Comprehensive documentation

---

*Last updated: January 2025*