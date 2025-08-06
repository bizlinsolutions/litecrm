"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface DashboardSummary {
    customers: number;
    invoices: number;
    activeTasks: number;
    openTickets: number;
}

interface GraphDataPoint {
    _id: string;
    count: number;
}

interface DashboardGraph {
    customers: GraphDataPoint[];
    invoices: GraphDataPoint[];
    tasks: GraphDataPoint[];
    tickets: GraphDataPoint[];
}

export default function DashboardPage() {
    const { user, logout, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    const handleLogout = () => {
        logout();
    };

    const [summary, setSummary] = useState<DashboardSummary>({
        customers: 0,
        invoices: 0,
        activeTasks: 0,
        openTickets: 0,
    });
    const [graph, setGraph] = useState<DashboardGraph>({
        customers: [],
        invoices: [],
        tasks: [],
        tickets: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            if (!isAuthenticated) return;

            try {
                // Use basePath-aware URL for Next.js App Router API routes
                const response = await fetch('/crm/api/dashboard', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setSummary(data.summary || {
                    customers: 0,
                    invoices: 0,
                    activeTasks: 0,
                    openTickets: 0,
                });
                setGraph(data.graph || {
                    customers: [],
                    invoices: [],
                    tasks: [],
                    tickets: [],
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                // Keep default values on error
            } finally {
                setLoading(false);
            }
        }

        if (!isLoading) {
            fetchDashboard();
        }
    }, [isLoading, isAuthenticated]);

    // Prepare chart data (simple line for customers)
    const chartData = Array.isArray(graph?.customers) ? graph.customers.map((d: any) => d.count) : [];
    const chartLabels = Array.isArray(graph?.customers) ? graph.customers.map((d: any) => d._id) : [];

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
                                            <dd className="text-lg font-medium text-gray-900">{loading ? '-' : summary.customers}</dd>
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
                                            <dd className="text-lg font-medium text-gray-900">{loading ? '-' : summary.invoices}</dd>
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
                                            <dd className="text-lg font-medium text-gray-900">{loading ? '-' : summary.activeTasks}</dd>
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
                                            <dd className="text-lg font-medium text-gray-900">{loading ? '-' : summary.openTickets}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Last 30 Days Activity */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Last 30 Days Activity</h2>
                        {/* Simple SVG line chart for customers (can be replaced with chart lib) */}
                        <div className="h-64 flex items-center justify-center">
                            {loading ? (
                                <span className="text-gray-400">Loading graph...</span>
                            ) : chartData.length === 0 ? (
                                <span className="text-gray-400">No data</span>
                            ) : (
                                <svg width="100%" height="220" viewBox="0 0 400 220">
                                    {/* Axes */}
                                    <line x1="40" y1="20" x2="40" y2="200" stroke="#ccc" />
                                    <line x1="40" y1="200" x2="380" y2="200" stroke="#ccc" />
                                    {/* Line */}
                                    {chartData.length > 1 && (
                                        <polyline
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="3"
                                            points={chartData.map((v, i) => {
                                                const x = 40 + (i * (340 / (chartData.length - 1)));
                                                const max = Math.max(...chartData);
                                                const min = Math.min(...chartData);
                                                const y = 200 - ((v - min) / (max - min || 1)) * 180;
                                                return `${x},${y}`;
                                            }).join(' ')}
                                        />
                                    )}
                                    {/* Labels */}
                                    {chartLabels.map((label, i) => {
                                        const x = 40 + (i * (340 / (chartLabels.length - 1)));
                                        return (
                                            <text key={label} x={x} y={215} fontSize="10" textAnchor="middle" fill="#888">
                                                {label.slice(5)}
                                            </text>
                                        );
                                    })}
                                </svg>
                            )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Showing new customers per day (last 30 days)</div>
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
