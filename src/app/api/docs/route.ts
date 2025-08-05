import { NextResponse } from 'next/server';

export async function GET() {
    const apiDocs = {
        name: 'LiteCRM API',
        version: '1.0.0',
        description: 'Comprehensive CRM system with customer management, invoicing, tasks, support tickets, webhooks, and RBAC',
        baseUrl: process.env.APP_URL || 'http://localhost:3000',
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
                'GET /api/customers/[id]': {
                    description: 'Get customer by ID',
                    response: { customer: 'object' }
                },
                'PUT /api/customers/[id]': {
                    description: 'Update customer',
                    body: { name: 'string', email: 'string', phone: 'string' },
                    response: { customer: 'object' }
                },
                'DELETE /api/customers/[id]': {
                    description: 'Delete customer',
                    response: { message: 'string' }
                }
            },
            invoices: {
                'GET /api/invoices': {
                    description: 'List invoices with pagination',
                    query: { page: 'number', limit: 'number', status: 'string', customerId: 'string' },
                    response: { invoices: 'array', pagination: 'object' }
                },
                'POST /api/invoices': {
                    description: 'Create new invoice',
                    body: { customerId: 'string', items: 'array', dueDate: 'date' },
                    response: { invoice: 'object' }
                }
            },
            tasks: {
                'GET /api/tasks': {
                    description: 'List tasks with pagination',
                    query: { page: 'number', limit: 'number', status: 'string', priority: 'string' },
                    response: { tasks: 'array', pagination: 'object' }
                },
                'POST /api/tasks': {
                    description: 'Create new task',
                    body: { title: 'string', description: 'string', priority: 'string', assignedTo: 'string' },
                    response: { task: 'object' }
                }
            },
            tickets: {
                'GET /api/tickets': {
                    description: 'List support tickets with pagination',
                    query: { page: 'number', limit: 'number', status: 'string', priority: 'string' },
                    response: { tickets: 'array', pagination: 'object' }
                },
                'POST /api/tickets': {
                    description: 'Create new support ticket',
                    body: { subject: 'string', description: 'string', priority: 'string', customerId: 'string' },
                    response: { ticket: 'object' }
                }
            },
            webhooks: {
                'GET /api/webhooks': {
                    description: 'List webhooks',
                    response: { webhooks: 'array' }
                },
                'POST /api/webhooks': {
                    description: 'Create new webhook',
                    body: { name: 'string', url: 'string', events: 'array' },
                    response: { webhook: 'object' }
                }
            }
        },
        roles: {
            admin: 'Full system access',
            manager: 'Customer, invoice, task, and ticket management',
            user: 'Basic customer and task operations',
            support: 'Ticket and customer support operations'
        },
        webhookEvents: [
            'customer.created', 'customer.updated', 'customer.deleted',
            'invoice.created', 'invoice.updated', 'invoice.paid',
            'task.created', 'task.updated', 'task.completed',
            'ticket.created', 'ticket.updated', 'ticket.resolved',
            'user.created', 'user.updated'
        ]
    };

    return NextResponse.json(apiDocs);
}
