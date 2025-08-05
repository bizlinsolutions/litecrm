'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Ticket {
    _id: string;
    ticketNumber: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed';
    category?: string;
    assignedTo?: { _id: string; name: string; email: string };
    customerId: { _id: string; name: string; email: string }; // Required
    relatedInvoices?: { _id: string; invoiceNumber: string }[];
    relatedTickets?: { _id: string; ticketNumber: string; title: string }[];
    createdBy: { _id: string; name: string; email: string };
    createdAt: string;
}

interface Customer {
    _id: string;
    name: string;
    email: string;
}

interface Invoice {
    _id: string;
    invoiceNumber: string;
    customerId: string;
}

interface RelatedTicket {
    _id: string;
    ticketNumber: string;
    title: string;
    customerId: string;
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [relatedTickets, setRelatedTickets] = useState<RelatedTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const router = useRouter();

    const [newTicket, setNewTicket] = useState({
        title: '',
        description: '',
        priority: 'medium' as const,
        category: '',
        customerId: '',
        relatedInvoices: [] as string[],
        relatedTickets: [] as string[]
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchTickets();
        fetchCustomers();
        fetchInvoices();
        fetchRelatedTickets();
    }, [router, searchTerm, statusFilter, priorityFilter]);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);

            const response = await fetch(`/api/tickets?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setTickets(data.tickets || []);
            } else {
                setError(data.error || 'Failed to fetch tickets');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/customers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setCustomers(data.customers || []);
            }
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        }
    };

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/invoices', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setInvoices(data.invoices || []);
            }
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        }
    };

    const fetchRelatedTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tickets', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setRelatedTickets(data.tickets || []);
            }
        } catch (err) {
            console.error('Failed to fetch related tickets:', err);
        }
    };

    const createTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTicket)
            });

            const data = await response.json();
            if (response.ok) {
                setTickets([data.ticket, ...tickets]);
                setNewTicket({
                    title: '',
                    description: '',
                    priority: 'medium',
                    category: '',
                    customerId: '',
                    relatedInvoices: [],
                    relatedTickets: []
                });
                setShowCreateForm(false);
            } else {
                setError(data.error || 'Failed to create ticket');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const updateTicketStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tickets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (response.ok) {
                setTickets(tickets.map(t => t._id === id ? data.ticket : t));
            } else {
                setError(data.error || 'Failed to update ticket');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const deleteTicket = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tickets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setTickets(tickets.filter(t => t._id !== id));
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete ticket');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'closed': return 'bg-gray-100 text-gray-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'open': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                                LiteCRM
                            </Link>
                            <div className="flex space-x-4">
                                <Link href="/customers" className="text-gray-600 hover:text-gray-900">
                                    Customers
                                </Link>
                                <Link href="/invoices" className="text-gray-600 hover:text-gray-900">
                                    Invoices
                                </Link>
                                <Link href="/tasks" className="text-gray-600 hover:text-gray-900">
                                    Tasks
                                </Link>
                                <Link href="/tickets" className="text-blue-600 border-b-2 border-blue-600 pb-1">
                                    Tickets
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Create Ticket
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="pending">Pending</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Create Form Modal */}
                    {showCreateForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
                                <form onSubmit={createTicket}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Title *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newTicket.title}
                                                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description *</label>
                                            <textarea
                                                required
                                                value={newTicket.description}
                                                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                                rows={4}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                                            <select
                                                value={newTicket.priority}
                                                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Category</label>
                                            <input
                                                type="text"
                                                value={newTicket.category}
                                                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                                placeholder="e.g., Bug, Feature Request, Support"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateForm(false)}
                                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Create Ticket
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Tickets Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ticket
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned To
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {ticket.ticketNumber}
                                            </div>
                                            <div className="text-sm font-medium text-blue-600">{ticket.title}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                                            {ticket.category && (
                                                <div className="text-xs text-gray-400">Category: {ticket.category}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(ticket.status)}`}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="pending">Pending</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {ticket.assignedTo?.name || 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">by {ticket.createdBy.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => deleteTicket(ticket._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {tickets.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No tickets found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
