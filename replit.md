# Community Engagement Admin Panel

## Overview

This is a full-stack web application built as an admin panel for managing community engagement activities. The system allows administrators to manage local businesses, events, rewards, and surveys while providing analytics on user engagement. It's built with a modern React frontend and Express.js backend, using PostgreSQL for data storage and Drizzle ORM for database management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **Component Structure**: Uses shadcn/ui components for consistent UI design
- **Routing**: Wouter for client-side routing
- **Authentication**: Context-based auth provider with JWT token management
- **State Management**: TanStack Query for caching and synchronizing server state
- **Styling**: Tailwind CSS with CSS custom properties for theming

### Backend Architecture
- **API Layer**: Express.js with TypeScript for REST API endpoints
- **Authentication**: JWT middleware for protecting admin routes
- **Database Layer**: Drizzle ORM with Neon serverless PostgreSQL
- **File Structure**: Organized into routes, storage, and server setup modules

### Database Schema
The schema includes tables for:
- `users`: Admin user accounts with role-based access
- `businesses`: Local business information and management
- `events`: Community events with RSVP tracking
- `rewards`: Point-based reward system
- `surveys`: Feedback collection with dynamic question types
- `checkins`: User engagement tracking
- `survey_responses`: Survey answer storage
- `reward_redemptions`: Reward usage tracking

## Data Flow

1. **Authentication Flow**: Users log in with email/password, receive JWT token stored in localStorage
2. **Admin Operations**: Authenticated admins can CRUD operations on businesses, events, rewards, and surveys
3. **Analytics**: Dashboard aggregates data from multiple tables to show engagement metrics
4. **Real-time Updates**: TanStack Query manages cache invalidation for immediate UI updates

## External Dependencies

### Key Libraries
- **UI Framework**: React 18 with TypeScript
- **Database**: Neon serverless PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcryptjs for password hashing
- **Styling**: Tailwind CSS with Radix UI primitives via shadcn/ui
- **Charts**: Recharts for analytics visualization
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation

### Development Tools
- **Build Tool**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **Linting**: ESLint configuration (implicit)
- **Database Migrations**: Drizzle Kit for schema management

## Deployment Strategy

The application is configured for deployment with:

- **Build Process**: Vite builds the frontend, esbuild bundles the backend
- **Environment Variables**: Database URL and JWT secret required
- **Production Setup**: Static file serving with Express in production mode
- **Development**: Vite dev server with HMR for frontend, tsx for backend development

### Key Configuration Files
- `vite.config.ts`: Frontend build configuration with path aliases
- `drizzle.config.ts`: Database migration and schema configuration
- `tsconfig.json`: TypeScript configuration for full-stack development
- `tailwind.config.ts`: Styling configuration with custom theme variables

The system is designed to be scalable and maintainable, with clear separation of concerns and type safety throughout the stack. The admin panel provides comprehensive management tools for community engagement while maintaining a clean, modern user interface.