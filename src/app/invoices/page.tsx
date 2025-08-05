'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Invoice {
    _id: string;
    invoiceNumber: string;
    customerId: { _id: string; name: string; email: string };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    dueDate: string;
    issuedDate: string;
    paidDate?: string;
    notes?: string;
    createdAt: string;
}

interface Customer {
    _id: string;
    name: string;
    email: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const router = useRouter();

    const [newInvoice, setNewInvoice] = useState({
        customerId: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        taxRate: 0,
        dueDate: '',
        notes: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchInvoices();
        fetchCustomers();
    }, [router, searchTerm, statusFilter]);

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/invoices?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setInvoices(data.invoices || []);
            } else {
                setError(data.error || 'Failed to fetch invoices');
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

    const createInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Calculate totals
            const items = newInvoice.items.map(item => ({
                ...item,
                total: item.quantity * item.unitPrice
            }));

            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const taxAmount = subtotal * (newInvoice.taxRate / 100);
            const total = subtotal + taxAmount;

            const invoiceData = {
                ...newInvoice,
                items,
                subtotal,
                taxAmount,
                total
            };

            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(invoiceData)
            });

            const data = await response.json();
            if (response.ok) {
                setInvoices([data.invoice, ...invoices]);
                setNewInvoice({
                    customerId: '',
                    items: [{ description: '', quantity: 1, unitPrice: 0 }],
                    taxRate: 0,
                    dueDate: '',
                    notes: ''
                });
                setShowCreateForm(false);
            } else {
                setError(data.error || 'Failed to create invoice');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const updateInvoiceStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('token');
            const updateData: any = { status };

            // If marking as paid, set paid date
            if (status === 'paid') {
                updateData.paidDate = new Date().toISOString();
            }

            const response = await fetch(`/api/invoices/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            if (response.ok) {
                setInvoices(invoices.map(inv => inv._id === id ? data.invoice : inv));
            } else {
                setError(data.error || 'Failed to update invoice');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const deleteInvoice = async (id: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/invoices/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setInvoices(invoices.filter(inv => inv._id !== id));
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete invoice');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const addInvoiceItem = () => {
        setNewInvoice({
            ...newInvoice,
            items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0 }]
        });
    };

    const removeInvoiceItem = (index: number) => {
        setNewInvoice({
            ...newInvoice,
            items: newInvoice.items.filter((_, i) => i !== index)
        });
    };

    const updateInvoiceItem = (index: number, field: string, value: any) => {
        const updatedItems = [...newInvoice.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setNewInvoice({ ...newInvoice, items: updatedItems });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invoices...</p>
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
                                <Link href="/invoices" className="text-blue-600 border-b-2 border-blue-600 pb-1">
                                    Invoices
                                </Link>
                                <Link href="/tasks" className="text-gray-600 hover:text-gray-900">
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
                        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Create Invoice
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Search invoices..."
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
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
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
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                            <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4 max-h-screen overflow-y-auto">
                                <h2 className="text-xl font-bold mb-4">Create New Invoice</h2>
                                <form onSubmit={createInvoice}>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Customer *</label>
                                                <select
                                                    required
                                                    value={newInvoice.customerId}
                                                    onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                >
                                                    <option value="">Select Customer</option>
                                                    {customers.map(customer => (
                                                        <option key={customer._id} value={customer._id}>
                                                            {customer.name} ({customer.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={newInvoice.dueDate}
                                                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Items</label>
                                            {newInvoice.items.map((item, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Description"
                                                        value={item.description}
                                                        onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                                                        className="px-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Quantity"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="px-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Unit Price"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="px-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-600">
                                                            ${(item.quantity * item.unitPrice).toFixed(2)}
                                                        </span>
                                                        {newInvoice.items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeInvoiceItem(index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addInvoiceItem}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                + Add Item
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={newInvoice.taxRate}
                                                    onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                                <input
                                                    type="text"
                                                    value={newInvoice.notes}
                                                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        </div>

                                        {/* Totals Preview */}
                                        <div className="border-t pt-4">
                                            <div className="flex justify-end">
                                                <div className="w-64">
                                                    {(() => {
                                                        const subtotal = newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                                                        const taxAmount = subtotal * (newInvoice.taxRate / 100);
                                                        const total = subtotal + taxAmount;

                                                        return (
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span>Subtotal:</span>
                                                                    <span>${subtotal.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Tax ({newInvoice.taxRate}%):</span>
                                                                    <span>${taxAmount.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                                                    <span>Total:</span>
                                                                    <span>${total.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
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
                                            Create Invoice
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Invoices Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
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
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {invoice.invoiceNumber}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Issued: {new Date(invoice.issuedDate).toLocaleDateString()}
                                            </div>
                                            {invoice.paidDate && (
                                                <div className="text-sm text-green-600">
                                                    Paid: {new Date(invoice.paidDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {invoice.customerId.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {invoice.customerId.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                ${invoice.total.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Subtotal: ${invoice.subtotal.toFixed(2)}
                                            </div>
                                            {invoice.taxAmount > 0 && (
                                                <div className="text-sm text-gray-500">
                                                    Tax: ${invoice.taxAmount.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={invoice.status}
                                                onChange={(e) => updateInvoiceStatus(invoice._id, e.target.value)}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(invoice.status)}`}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="sent">Sent</option>
                                                <option value="paid">Paid</option>
                                                <option value="overdue">Overdue</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(invoice.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => deleteInvoice(invoice._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {invoices.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No invoices found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
