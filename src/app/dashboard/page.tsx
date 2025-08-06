'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function Dashboard() {
    const { user, logout, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleLogout = () => {
        logout();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">LiteCRM Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Welcome, {user?.name} ({user?.role})
                            </span>
                            <Link href="/docs" className="text-blue-600 hover:text-blue-800">
                                API Docs
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-red-600 hover:text-red-800"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome to LiteCRM</h2>
                        <p className="mt-2 text-gray-600">
                            Manage your customers, invoices, tasks, and support tickets all in one place.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">👥</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Customers
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">-</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">💰</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Invoices
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">-</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">📝</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Active Tasks
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">-</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">🎫</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Open Tickets
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">-</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CRM Modules */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">CRM Modules</h3>
                            <p className="mt-1 text-sm text-gray-500">Access and manage your CRM data</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Link
                                    href="/customers"
                                    className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                                >
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">👥</span>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Customers</span>
                                    <span className="text-xs text-gray-500 mt-1">Manage contacts</span>
                                </Link>

                                <Link
                                    href="/invoices"
                                    className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group"
                                >
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">💰</span>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-green-600">Invoices</span>
                                    <span className="text-xs text-gray-500 mt-1">Billing & payments</span>
                                </Link>

                                <Link
                                    href="/tasks"
                                    className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group"
                                >
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">✅</span>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-purple-600">Tasks</span>
                                    <span className="text-xs text-gray-500 mt-1">Project management</span>
                                </Link>

                                <Link
                                    href="/tickets"
                                    className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors group"
                                >
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎫</span>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-orange-600">Support Tickets</span>
                                    <span className="text-xs text-gray-500 mt-1">Customer support</span>
                                </Link>

                                <Link
                                    href="/webhooks"
                                    className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors group"
                                >
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔗</span>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-red-600">Webhooks</span>
                                    <span className="text-xs text-gray-500 mt-1">Integrations</span>
                                </Link>

                                <Link
                                    href="/api-docs"
                                    className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors group"
                                >
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">📚</span>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">API Docs</span>
                                    <span className="text-xs text-gray-500 mt-1">Documentation</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
