const express = require('express');
const router = express.Router();

// GET /api/docs - API documentation
router.get('/', async (req, res) => {
    const apiDocs = {
        name: 'LiteCRM API',
        version: '1.0.0',
        description: 'Comprehensive CRM system with customer management, invoicing, tasks, support tickets, webhooks, and RBAC',
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
        authentication: {
            type: 'Bearer Token (JWT)',
            header: 'Authorization: Bearer <token>',
            login: '/api/auth/login',
            register: '/api/auth/register'
        },
        endpoints: {
            authentication: {
                'POST /api/auth/login': {
                    description: 'User authentication',
                    body: { email: 'string', password: 'string' },
                    response: { token: 'string', user: 'object' }
                },
                'POST /api/auth/register': {
                    description: 'User registration',
                    body: { name: 'string', email: 'string', password: 'string', role: 'string' },
                    response: { token: 'string', user: 'object' }
                }
            },
            customers: {
                'GET /api/customers': {
                    description: 'List customers with pagination',
                    query: { page: 'number', limit: 'number', search: 'string', status: 'string' },
                    response: { customers: 'array', pagination: 'object' }
                },
                'POST /api/customers': {
                    description: 'Create new customer',
                    body: { name: 'string', email: 'string', phone: 'string', company: 'string' },
                    response: { customer: 'object' }
                },
                'GET /api/customers/:id': {
                    description: 'Get customer by ID',
                    response: { customer: 'object' }
                },
                'PUT /api/customers/:id': {
                    description: 'Update customer',
                    body: { name: 'string', email: 'string', phone: 'string' },
                    response: { customer: 'object' }
                },
                'DELETE /api/customers/:id': {
                    description: 'Delete customer',
                    response: { message: 'string' }
                }
            },
            invoices: {
                'GET /api/invoices': {
                    description: 'List invoices with pagination',
                    query: { page: 'number', limit: 'number', search: 'string', status: 'string' },
                    response: { invoices: 'array', pagination: 'object' }
                },
                'POST /api/invoices': {
                    description: 'Create new invoice',
                    body: { customerId: 'string', items: 'array', dueDate: 'string' },
                    response: { invoice: 'object' }
                },
                'GET /api/invoices/:id': {
                    description: 'Get invoice by ID',
                    response: { invoice: 'object' }
                },
                'PUT /api/invoices/:id': {
                    description: 'Update invoice',
                    response: { invoice: 'object' }
                },
                'DELETE /api/invoices/:id': {
                    description: 'Delete invoice',
                    response: { message: 'string' }
                }
            },
            tasks: {
                'GET /api/tasks': {
                    description: 'List tasks with pagination',
                    query: { page: 'number', limit: 'number', search: 'string', status: 'string', priority: 'string' },
                    response: { tasks: 'array', pagination: 'object' }
                },
                'POST /api/tasks': {
                    description: 'Create new task',
                    body: { title: 'string', description: 'string', customerId: 'string', priority: 'string' },
                    response: { task: 'object' }
                },
                'GET /api/tasks/:id': {
                    description: 'Get task by ID',
                    response: { task: 'object' }
                },
                'PUT /api/tasks/:id': {
                    description: 'Update task',
                    response: { task: 'object' }
                },
                'DELETE /api/tasks/:id': {
                    description: 'Delete task',
                    response: { message: 'string' }
                }
            },
            tickets: {
                'GET /api/tickets': {
                    description: 'List tickets with pagination',
                    response: { tickets: 'array', pagination: 'object' }
                },
                'POST /api/tickets': {
                    description: 'Create new ticket',
                    body: { subject: 'string', description: 'string', customerId: 'string', category: 'string' },
                    response: { ticket: 'object' }
                },
                'GET /api/tickets/:id': {
                    description: 'Get ticket by ID',
                    response: { ticket: 'object' }
                },
                'PUT /api/tickets/:id': {
                    description: 'Update ticket',
                    response: { ticket: 'object' }
                },
                'DELETE /api/tickets/:id': {
                    description: 'Delete ticket',
                    response: { message: 'string' }
                }
            },
            users: {
                'GET /api/users': {
                    description: 'List users with pagination',
                    response: { users: 'array', pagination: 'object' }
                },
                'POST /api/users': {
                    description: 'Create new user',
                    body: { name: 'string', email: 'string', password: 'string', role: 'string' },
                    response: { user: 'object' }
                },
                'GET /api/users/:id': {
                    description: 'Get user by ID',
                    response: { user: 'object' }
                },
                'PUT /api/users/:id': {
                    description: 'Update user',
                    response: { user: 'object' }
                },
                'DELETE /api/users/:id': {
                    description: 'Delete user',
                    response: { message: 'string' }
                }
            },
            webhooks: {
                'GET /api/webhooks': {
                    description: 'List webhooks with pagination',
                    response: { webhooks: 'array', pagination: 'object' }
                },
                'POST /api/webhooks': {
                    description: 'Create new webhook',
                    body: { name: 'string', url: 'string', events: 'array' },
                    response: { webhook: 'object' }
                },
                'GET /api/webhooks/:id': {
                    description: 'Get webhook by ID',
                    response: { webhook: 'object' }
                },
                'PUT /api/webhooks/:id': {
                    description: 'Update webhook',
                    response: { webhook: 'object' }
                },
                'DELETE /api/webhooks/:id': {
                    description: 'Delete webhook',
                    response: { message: 'string' }
                }
            }
        },
        permissions: {
            roles: ['admin', 'manager', 'user', 'support'],
            description: 'Role-based access control with granular permissions'
        }
    };

    res.json(apiDocs);
});

module.exports = router;
