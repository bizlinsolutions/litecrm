import Link from 'next/link';

export default function APIDocs() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">LiteCRM API Documentation</h1>
                            <p className="mt-2 text-gray-600">Version 1.0.0</p>
                        </div>
                        <div className="flex space-x-4">
                            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                                Dashboard
                            </Link>
                            <Link href="/" className="text-gray-600 hover:text-gray-800">
                                Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Base URL */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-semibold text-blue-900 mb-2">Base URL</h2>
                        <code className="text-blue-800 bg-blue-100 px-3 py-1 rounded">
                            http://localhost:3000
                        </code>
                    </div>

                    {/* Authentication */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Authentication</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                LiteCRM uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
                            </p>
                            <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                <code className="text-sm">Authorization: Bearer &lt;your-jwt-token&gt;</code>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Login</h3>
                                    <div className="bg-gray-50 rounded p-3 text-sm">
                                        <div className="mb-2">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                            <span className="ml-2 font-mono">/api/auth/login</span>
                                        </div>
                                        <div className="text-gray-600">
                                            <strong>Body:</strong> {`{ email: string, password: string }`}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Register</h3>
                                    <div className="bg-gray-50 rounded p-3 text-sm">
                                        <div className="mb-2">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                            <span className="ml-2 font-mono">/api/auth/register</span>
                                        </div>
                                        <div className="text-gray-600">
                                            <strong>Body:</strong> {`{ name: string, email: string, password: string, role?: string }`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customers API */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Customers API</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">List Customers</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/customers</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Query params:</strong> page, limit, search, status, assignedTo
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Create Customer</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                        <span className="ml-2 font-mono">/api/customers</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Body:</strong> {`{ name: string, email?: string, phone?: string, company?: string }`}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Get Customer</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/customers/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Update Customer</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">PUT</span>
                                        <span className="ml-2 font-mono">/api/customers/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Delete Customer</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">DELETE</span>
                                        <span className="ml-2 font-mono">/api/customers/[id]</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoices API */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Invoices API</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">List Invoices</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/invoices</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Query params:</strong> page, limit, status, customerId
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Create Invoice</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                        <span className="ml-2 font-mono">/api/invoices</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Body:</strong> {`{ customerId: string, items: array, dueDate: date }`}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Get Invoice</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/invoices/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Update Invoice</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">PUT</span>
                                        <span className="ml-2 font-mono">/api/invoices/[id]</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Note:</strong> Cannot update paid or cancelled invoices
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Delete Invoice</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">DELETE</span>
                                        <span className="ml-2 font-mono">/api/invoices/[id]</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Note:</strong> Only draft invoices can be deleted
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks API */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Tasks API</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">List Tasks</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/tasks</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Query params:</strong> page, limit, search, status, priority, assignedTo, customerId
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Create Task</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                        <span className="ml-2 font-mono">/api/tasks</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Body:</strong> {`{ title: string, description?: string, priority?: string, status?: string }`}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Get Task</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/tasks/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Update Task</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">PUT</span>
                                        <span className="ml-2 font-mono">/api/tasks/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Delete Task</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">DELETE</span>
                                        <span className="ml-2 font-mono">/api/tasks/[id]</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Note:</strong> Only admins, managers, or task creators can delete tasks
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tickets API */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Support Tickets API</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">List Tickets</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/tickets</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Query params:</strong> page, limit, search, status, priority, category, assignedTo, customerId
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Create Ticket</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                        <span className="ml-2 font-mono">/api/tickets</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Body:</strong> {`{ title: string, description: string, priority?: string, category?: string }`}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Get Ticket</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/tickets/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Update Ticket</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">PUT</span>
                                        <span className="ml-2 font-mono">/api/tickets/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Delete Ticket</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">DELETE</span>
                                        <span className="ml-2 font-mono">/api/tickets/[id]</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Note:</strong> Only admins and managers can delete tickets
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Webhooks API */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Webhooks API</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">List Webhooks</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/webhooks</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Query params:</strong> page, limit, search, isActive, event
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Create Webhook</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                        <span className="ml-2 font-mono">/api/webhooks</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Body:</strong> {`{ name: string, url: string, events: array }`}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Get Webhook</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">GET</span>
                                        <span className="ml-2 font-mono">/api/webhooks/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Update Webhook</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">PUT</span>
                                        <span className="ml-2 font-mono">/api/webhooks/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Delete Webhook</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">DELETE</span>
                                        <span className="ml-2 font-mono">/api/webhooks/[id]</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Test Webhook</h3>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="mb-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">POST</span>
                                        <span className="ml-2 font-mono">/api/webhooks/[id]</span>
                                    </div>
                                    <div className="text-gray-600">
                                        <strong>Note:</strong> Sends a test payload to the webhook URL
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Roles and Permissions */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Roles and Permissions</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Admin</h3>
                                    <p className="text-sm text-gray-600">Full system access</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Manager</h3>
                                    <p className="text-sm text-gray-600">Customer, invoice, task, and ticket management</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">User</h3>
                                    <p className="text-sm text-gray-600">Basic customer and task operations</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
                                    <p className="text-sm text-gray-600">Ticket and customer support operations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Codes */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Common Error Codes</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="font-mono text-sm">400</span>
                                    <span className="text-sm text-gray-600">Bad Request - Validation failed</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="font-mono text-sm">401</span>
                                    <span className="text-sm text-gray-600">Unauthorized - Invalid or missing token</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="font-mono text-sm">403</span>
                                    <span className="text-sm text-gray-600">Forbidden - Insufficient permissions</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="font-mono text-sm">404</span>
                                    <span className="text-sm text-gray-600">Not Found - Resource not found</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="font-mono text-sm">500</span>
                                    <span className="text-sm text-gray-600">Internal Server Error</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* JSON API Response */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/api/docs"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            View JSON API Response
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
