# LiteCRM

A comprehensive Customer Relationship Management (CRM) system built with Next.js, TypeScript, MongoDB, and Express.js. Designed as a modular plugin that can be easily deployed and integrated into existing applications.

## 🚀 Features

- **Customer Management**: Complete customer lifecycle management with contact information, company details, and custom fields
- **Invoice Generation**: Create, send, and track invoices with automatic calculations and payment tracking
- **Task Management**: Organize and assign tasks with priorities, due dates, and status tracking
- **Support Tickets**: Built-in ticketing system for customer support with messaging capabilities
- **Webhook Integration**: Real-time event notifications via webhooks for external integrations
- **Role-Based Access Control (RBAC)**: Granular permissions system with predefined roles
- **REST API**: Complete API coverage for all CRM modules
- **Environment-Based Configuration**: Easy setup for different deployment environments

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with Express.js middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with RBAC
- **Validation**: Zod for request/response validation
- **Styling**: Tailwind CSS with responsive design
- **Package Management**: npm

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

2. **Start the application**:
   ```bash
   npm start
   ```

That's it! The setup command will automatically:
- Initialize the MongoDB database with demo data
- Create demo users with different roles
- Start the development server

The application will be available at `http://localhost:3000`

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
   ADMIN_EMAIL=admin@litecrm.com
   ADMIN_PASSWORD=admin123
   ```

3. **Initialize Database**:
   ```bash
   npm run setup
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with admin credentials: `admin@litecrm.com` / `admin123`

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
