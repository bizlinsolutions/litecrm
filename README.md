# LiteCRM

A comprehensive Customer Relationship Management (CRM) system built with Next.js, TypeScript, MongoDB, and Express.js. Features a separated API architecture with a standalone Express.js backend and Next.js frontend, packaged as a single application.

## 🚀 Features

- **Customer Management**: Complete customer lifecycle management with contact information, company details, and custom fields
- **Invoice Generation**: Create, send, and track invoices with automatic calculations and payment tracking
- **Task Management**: Organize and assign tasks with priorities, due dates, and status tracking
- **Support Tickets**: Built-in ticketing system for customer support with messaging capabilities
- **Webhook Integration**: Real-time event notifications via webhooks for external integrations
- **Role-Based Access Control (RBAC)**: Granular permissions system with predefined roles
- **REST API**: Complete API coverage for all CRM modules via standalone Express.js server
- **Environment-Based Configuration**: Easy setup for different deployment environments

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Express.js standalone API server
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with RBAC
- **Validation**: Zod for request/response validation
- **Styling**: Tailwind CSS with responsive design
- **Development**: Concurrently runs both API and UI servers
- **Package Management**: npm

## 📦 Architecture

The application now uses a separated architecture:
- **API Server**: Express.js server running on port 3001
- **UI Server**: Next.js application running on port 3000
- **Single Package**: Both servers are managed through one `package.json`

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm 8+
- MongoDB instance (local or cloud)

### Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd litecrm
   npm install
   ```

2. **Configuration**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

That's it! The setup command will automatically:
- Initialize the MongoDB database with demo data
- Create demo users with different roles
- Start both API server (port 3001) and UI server (port 3000)

The application will be available at:
- **Frontend**: `http://localhost:3000`
- **API Documentation**: `http://localhost:3001/api/docs`

### Development Commands

```bash
# Start both API and UI servers in development mode
npm run dev

# Start only the API server
npm run api:dev

# Start only the UI server  
npm run ui:dev

# Setup/reset database
npm run setup

# Build for production
npm run build

# Start production servers
npm run prod

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### Demo Credentials
- **Admin:** admin@litecrm.com / admin123
- **Manager:** manager@litecrm.com / manager123  
- **User:** user@litecrm.com / user123
- **Support:** support@litecrm.com / support123

### Environment Configuration (Optional)
If you need to customize settings, copy and edit the environment file:
```bash
cp .env.example .env.local
```

Key environment variables:
```bash
# API Configuration
API_PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database
MONGODB_URI=mongodb://localhost:27017/litecrm

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## 🔧 Plugin Usage

LiteCRM is designed to work as a standalone application or as a plugin in existing projects:

### As a Standalone Application
```bash
npm run dev
```

### As an NPM Package
```bash
npm install litecrm
```

Then in your application:
```javascript
import { LiteCRM } from 'litecrm';

// Initialize with your configuration
const crm = new LiteCRM({
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  prefix: '/crm' // Optional API prefix
});
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Customers
- `GET /api/customers` - List customers (with pagination)
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice details
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Support Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/[id]` - Get ticket details
- `PUT /api/tickets/[id]` - Update ticket
- `POST /api/tickets/[id]/messages` - Add message to ticket

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PUT /api/webhooks/[id]` - Update webhook
- `DELETE /api/webhooks/[id]` - Delete webhook

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (admin only)

## 🔐 Role-Based Access Control

### Roles
- **Admin**: Full system access
- **Manager**: Customer, invoice, task, and ticket management
- **User**: Basic customer and task operations
- **Support**: Ticket and customer support operations

### Permissions
Each role has specific permissions for create, read, update, and delete operations on different resources.

## 🪝 Webhook Events

LiteCRM triggers webhooks for the following events:
- `customer.created`, `customer.updated`, `customer.deleted`
- `invoice.created`, `invoice.updated`, `invoice.paid`
- `task.created`, `task.updated`, `task.completed`
- `ticket.created`, `ticket.updated`, `ticket.resolved`
- `user.created`, `user.updated`

## 🧪 Development

### Project Structure
```
src/
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Dashboard pages
│   └── page.tsx       # Home page
├── lib/
│   ├── auth.ts        # Authentication utilities
│   ├── mongodb.ts     # Database connection
│   ├── permissions.ts # RBAC definitions
│   ├── utils.ts       # Helper functions
│   └── webhook.ts     # Webhook utilities
├── middleware/
│   └── auth.ts        # Authentication middleware
└── models/            # Mongoose models
    ├── Customer.ts
    ├── Invoice.ts
    ├── Task.ts
    ├── Ticket.ts
    ├── User.ts
    └── Webhook.ts
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup` - Initialize database with admin user
- `npm run typecheck` - Run TypeScript type checking

## 🚀 Deployment

### Environment Variables
Required environment variables for production:
```env
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password
APP_URL=https://your-domain.com
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue for bug reports or feature requests
- Check the [API documentation](/api/docs) for detailed endpoint information
- Review the environment configuration in `.env.example`

## 🔄 Updates

LiteCRM is designed for easy updates and maintenance:
- Modular architecture allows for independent feature updates
- Database migrations are handled automatically
- Environment-based configuration supports multiple deployment scenarios
- Plugin architecture enables easy integration and customization
