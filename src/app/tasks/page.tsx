'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Modal from '@/components/ui/Modal';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2, FiUser, FiClock, FiFlag, FiCheckSquare } from 'react-icons/fi';

interface Task {
    _id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in-progress' | 'review' | 'completed';
    assignedTo?: { _id: string; name: string; email: string };
    customerId: { _id: string; name: string; email: string }; // Required
    relatedInvoices?: { _id: string; invoiceNumber: string }[];
    relatedTickets?: { _id: string; ticketNumber: string; title: string }[];
    dueDate?: string;
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
    total: number;
    status: string;
}

interface Ticket {
    _id: string;
    ticketNumber: string;
    title: string;
    customerId: string;
    status: string;
    priority: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const router = useRouter();

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium' as const,
        status: 'todo' as const,
        customerId: '',
        relatedInvoices: [] as string[],
        relatedTickets: [] as string[],
        dueDate: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchTasks();
        fetchCustomers();
        fetchInvoices();
        fetchTickets();
    }, [router, searchTerm, statusFilter, priorityFilter]);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);

            const response = await fetch(`/api/tasks?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setTasks(data.tasks || []);
            } else {
                setError(data.error || 'Failed to fetch tasks');
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

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tickets', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setTickets(data.tickets || []);
            }
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        }
    };

    const createTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTask)
            });

            const data = await response.json();
            if (response.ok) {
                setTasks([data.task, ...tasks]);
                setNewTask({
                    title: '',
                    description: '',
                    priority: 'medium',
                    status: 'todo',
                    customerId: '',
                    relatedInvoices: [],
                    relatedTickets: [],
                    dueDate: ''
                });
                setShowCreateForm(false);
            } else {
                setError(data.error || 'Failed to create task');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const updateTaskStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (response.ok) {
                setTasks(tasks.map(t => t._id === id ? data.task : t));
            } else {
                setError(data.error || 'Failed to update task');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const deleteTask = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setTasks(tasks.filter(t => t._id !== id));
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete task');
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
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'review': return 'bg-purple-100 text-purple-800';
            case 'todo': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tasks...</p>
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
                                <Link href="/tasks" className="text-blue-600 border-b-2 border-blue-600 pb-1">
                                    Tasks
                                </Link>
                                <Link href="/tickets" className="text-gray-600 hover:text-gray-900">
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
                        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <FiPlus className="h-4 w-4" />
                            Add Task
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="completed">Completed</option>
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
                    <Modal
                        isOpen={showCreateForm}
                        onClose={() => setShowCreateForm(false)}
                        title="Add New Task"
                        size="2xl"
                    >
                        <form onSubmit={createTask}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                        <FiCheckSquare className="inline h-4 w-4 mr-1" />
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                                value={newTask.title}
                                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                value={newTask.description}
                                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                rows={3}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Customer *</label>
                                                <SearchableSelect
                                                    options={customers.map(customer => ({
                                                        value: customer._id,
                                                        label: customer.name,
                                                        subtitle: customer.email
                                                    }))}
                                                    value={newTask.customerId}
                                                    onChange={(value) => setNewTask({ ...newTask, customerId: value as string })}
                                                    placeholder="Select Customer"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                                <select
                                                    value={newTask.priority}
                                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                    <option value="urgent">Urgent</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                            <input
                                                type="date"
                                                value={newTask.dueDate}
                                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Related Invoices (Optional)</label>
                                            <SearchableSelect
                                                options={invoices
                                                    .filter(invoice => invoice.customerId === newTask.customerId)
                                                    .map(invoice => ({
                                                        value: invoice._id,
                                                        label: invoice.invoiceNumber,
                                                        subtitle: `$${invoice.total.toFixed(2)} - ${invoice.status}`
                                                    }))}
                                                value={newTask.relatedInvoices}
                                                onChange={(value) => setNewTask({ ...newTask, relatedInvoices: value as string[] })}
                                                placeholder="Select Related Invoices"
                                                multiple={true}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Related Tickets (Optional)</label>
                                            <SearchableSelect
                                                options={tickets
                                                    .filter(ticket => ticket.customerId === newTask.customerId)
                                                    .map(ticket => ({
                                                        value: ticket._id,
                                                        label: `${ticket.ticketNumber} - ${ticket.title}`,
                                                        subtitle: `${ticket.status} - ${ticket.priority}`
                                                    }))}
                                                value={newTask.relatedTickets}
                                                onChange={(value) => setNewTask({ ...newTask, relatedTickets: value as string[] })}
                                                placeholder="Select Related Tickets"
                                                multiple={true}
                                                className="mt-1"
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
                                            Create Task
                                        </button>
                                    </div>
                                </div>
                            </form>
                    </Modal>

                    {/* Tasks Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Task
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                            {task.description && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                                            )}
                                            {(task.relatedInvoices?.length || task.relatedTickets?.length) && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {task.relatedInvoices?.map(invoice => (
                                                        <span key={invoice._id} className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                                            📄 {invoice.invoiceNumber}
                                                        </span>
                                                    ))}
                                                    {task.relatedTickets?.map(ticket => (
                                                        <span key={ticket._id} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                            🎫 {ticket.ticketNumber}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{task.customerId.name}</div>
                                            <div className="text-sm text-gray-500">{task.customerId.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={task.status}
                                                onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(task.status)}`}
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => deleteTask(task._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {tasks.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No tasks found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
