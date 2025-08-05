'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1994';

interface Webhook {
    _id: string;
    name: string;
    url: string;
    events: string[];
    secret?: string;
    active: boolean;
    headers?: Record<string, string>;
    retryAttempts: number;
    lastTriggered?: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    createdAt: string;
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
    const router = useRouter();

    const [newWebhook, setNewWebhook] = useState({
        name: '',
        url: '',
        events: [] as string[],
        secret: '',
        headers: {} as Record<string, string>,
        retryAttempts: 3
    });

    const availableEvents = [
        'customer.created',
        'customer.updated',
        'customer.deleted',
        'invoice.created',
        'invoice.updated',
        'invoice.paid',
        'task.created',
        'task.updated',
        'task.completed',
        'ticket.created',
        'ticket.updated',
        'ticket.resolved'
    ];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchWebhooks();
    }, [router]);

    const fetchWebhooks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/webhooks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setWebhooks(data.webhooks || []);
            } else {
                setError(data.error || 'Failed to fetch webhooks');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const createWebhook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/webhooks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newWebhook)
            });

            const data = await response.json();
            if (response.ok) {
                setWebhooks([data.webhook, ...webhooks]);
                setNewWebhook({
                    name: '',
                    url: '',
                    events: [],
                    secret: '',
                    headers: {},
                    retryAttempts: 3
                });
                setShowCreateForm(false);
            } else {
                setError(data.error || 'Failed to create webhook');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const toggleWebhook = async (id: string, active: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/webhooks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ active })
            });

            const data = await response.json();
            if (response.ok) {
                setWebhooks(webhooks.map(w => w._id === id ? data.webhook : w));
            } else {
                setError(data.error || 'Failed to update webhook');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const testWebhook = async (id: string) => {
        setTestingWebhook(id);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/webhooks/${id}/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                alert('Test webhook sent successfully!');
                fetchWebhooks(); // Refresh to update stats
            } else {
                alert(`Test failed: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert('Network error during test');
        } finally {
            setTestingWebhook(null);
        }
    };

    const deleteWebhook = async (id: string) => {
        if (!confirm('Are you sure you want to delete this webhook?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/webhooks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setWebhooks(webhooks.filter(w => w._id !== id));
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete webhook');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const toggleEvent = (event: string) => {
        const currentEvents = newWebhook.events;
        if (currentEvents.includes(event)) {
            setNewWebhook({
                ...newWebhook,
                events: currentEvents.filter(e => e !== event)
            });
        } else {
            setNewWebhook({
                ...newWebhook,
                events: [...currentEvents, event]
            });
        }
    };

    const addHeader = () => {
        const key = prompt('Header name:');
        const value = prompt('Header value:');
        if (key && value) {
            setNewWebhook({
                ...newWebhook,
                headers: { ...newWebhook.headers, [key]: value }
            });
        }
    };

    const removeHeader = (key: string) => {
        const headers = { ...newWebhook.headers };
        delete headers[key];
        setNewWebhook({ ...newWebhook, headers });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading webhooks...</p>
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
                                <Link href="/tickets" className="text-gray-600 hover:text-gray-900">
                                    Tickets
                                </Link>
                                <Link href="/webhooks" className="text-blue-600 border-b-2 border-blue-600 pb-1">
                                    Webhooks
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
                        <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Create Webhook
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Create Form Modal */}
                    {showCreateForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-screen overflow-y-auto">
                                <h2 className="text-xl font-bold mb-4">Create New Webhook</h2>
                                <form onSubmit={createWebhook}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newWebhook.name}
                                                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="My Webhook"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">URL *</label>
                                            <input
                                                type="url"
                                                required
                                                value={newWebhook.url}
                                                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="https://your-site.com/webhook"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Events *</label>
                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                                                {availableEvents.map(event => (
                                                    <label key={event} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={newWebhook.events.includes(event)}
                                                            onChange={() => toggleEvent(event)}
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm">{event}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Secret</label>
                                            <input
                                                type="text"
                                                value={newWebhook.secret}
                                                onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="Optional secret for signing"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Retry Attempts</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                value={newWebhook.retryAttempts}
                                                onChange={(e) => setNewWebhook({ ...newWebhook, retryAttempts: parseInt(e.target.value) || 0 })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">Custom Headers</label>
                                                <button
                                                    type="button"
                                                    onClick={addHeader}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    + Add Header
                                                </button>
                                            </div>
                                            {Object.entries(newWebhook.headers).map(([key, value]) => (
                                                <div key={key} className="flex items-center space-x-2 mb-2">
                                                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                        {key}: {value}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeHeader(key)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
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
                                            Create Webhook
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Webhooks List */}
                    <div className="space-y-4">
                        {webhooks.map((webhook) => (
                            <div key={webhook._id} className="bg-white shadow rounded-lg p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="text-lg font-medium text-gray-900">{webhook.name}</h3>
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {webhook.active ? 'Active' : 'Inactive'}
                                                </span>
                                                <button
                                                    onClick={() => toggleWebhook(webhook._id, !webhook.active)}
                                                    className={`text-sm ${webhook.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                                                        }`}
                                                >
                                                    {webhook.active ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 mt-1 font-mono">{webhook.url}</p>

                                        <div className="mt-2">
                                            <span className="text-sm text-gray-500">Events: </span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {webhook.events.map(event => (
                                                    <span key={event} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                        {event}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Total Requests:</span>
                                                <span className="ml-2 font-medium">{webhook.totalRequests}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Successful:</span>
                                                <span className="ml-2 font-medium text-green-600">{webhook.successfulRequests}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Failed:</span>
                                                <span className="ml-2 font-medium text-red-600">{webhook.failedRequests}</span>
                                            </div>
                                        </div>

                                        {webhook.lastTriggered && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                                            </p>
                                        )}

                                        <p className="text-sm text-gray-500 mt-1">
                                            Created: {new Date(webhook.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => testWebhook(webhook._id)}
                                            disabled={testingWebhook === webhook._id}
                                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {testingWebhook === webhook._id ? 'Testing...' : 'Test'}
                                        </button>
                                        <button
                                            onClick={() => deleteWebhook(webhook._id)}
                                            className="text-red-600 hover:text-red-900 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {webhooks.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No webhooks configured</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Create a webhook to receive real-time notifications about CRM events
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
