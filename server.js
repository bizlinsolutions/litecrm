const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const next = require('next');

// Load environment variables
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
const PORT = process.env.PORT || 1994;

// Import API routes
const authRoutes = require('./api/routes/auth');
const customersRoutes = require('./api/routes/customers');
const invoicesRoutes = require('./api/routes/invoices');
const tasksRoutes = require('./api/routes/tasks');
const ticketsRoutes = require('./api/routes/tickets');
const usersRoutes = require('./api/routes/users');
const webhooksRoutes = require('./api/routes/webhooks');
const docsRoutes = require('./api/routes/docs');

// Middleware
app.use(cors({
    origin: process.env.APP_URL || `http://localhost:${PORT}`,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes - mounted under /api
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/docs', docsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Prepare Next.js and start server
nextApp.prepare().then(() => {
    // Handle Next.js static assets and _next requests
    app.all('/_next/*', (req, res) => {
        return handle(req, res);
    });

    // Handle Next.js requests for /crm path
    app.all('/crm*', (req, res) => {
        return handle(req, res);
    });

    // Handle root redirect to /crm
    app.get('/', (req, res) => {
        return res.redirect('/crm');
    });

    // Catch all other requests that don't match API or Next.js routes
    app.all('*', (req, res) => {
        // If it's not an API request, let Next.js handle it
        if (!req.path.startsWith('/api')) {
            return handle(req, res);
        }
        // If it's an API request that doesn't match our routes, return 404
        res.status(404).json({ error: 'API endpoint not found' });
    });

    app.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`🚀 LiteCRM Server ready on http://localhost:${PORT}`);
        console.log(`📊 CRM Dashboard: http://localhost:${PORT}/crm`);
        console.log(`🔗 API Endpoints: http://localhost:${PORT}/api`);
        console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    });
}).catch((ex) => {
    console.error('Error starting server:', ex.stack);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
