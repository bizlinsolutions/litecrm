# Copilot Instructions for LiteCRM

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive CRM system built with Next.js, TypeScript, MongoDB, and Express.js. The system includes:

- Customer Management
- Invoice Management
- Task Management
- Support Ticket System
- Webhook Integration
- Role-Based Access Control (RBAC)
- REST API for all modules
- Plugin architecture for npm deployment

## Technical Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Express.js middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with RBAC
- **Styling**: Tailwind CSS with shadcn/ui components
- **Package Management**: npm
- **Environment**: Configurable for different deployments

## Code Guidelines
1. Use TypeScript for all code
2. Follow Next.js App Router conventions
3. Implement proper error handling and validation
4. Use Mongoose schemas with proper TypeScript types
5. Implement proper RBAC middleware for all protected routes
6. Use environment variables for configuration
7. Follow RESTful API conventions
8. Implement proper logging and monitoring
9. Write clean, maintainable, and scalable code
10. Use proper component composition and separation of concerns

## API Structure
- `/api/customers` - Customer management
- `/api/invoices` - Invoice management
- `/api/tasks` - Task management
- `/api/tickets` - Support ticket management
- `/api/webhooks` - Webhook handling
- `/api/auth` - Authentication and authorization
- `/api/users` - User management with RBAC

## Plugin Architecture
The system should be designed as a modular plugin that can be:
- Installed via npm
- Configured through environment variables
- Started with `npm run dev`
- Deployed independently
- Extended with additional modules
