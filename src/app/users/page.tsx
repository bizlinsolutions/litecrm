'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiUsers, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'user' | 'support';
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user' as 'admin' | 'manager' | 'user' | 'support',
        isActive: true,
    });

    // Fetch users
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setFilteredUsers(data.users || []);
            } else {
                setError('Failed to fetch users');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users
    useEffect(() => {
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(user =>
                statusFilter === 'active' ? user.isActive : !user.isActive
            );
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, roleFilter, statusFilter]);

    // Create user
    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowCreateForm(false);
                setFormData({ name: '', email: '', password: '', role: 'user', isActive: true });
                fetchUsers();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create user');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    // Update user
    const updateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const token = localStorage.getItem('token');
            const updateData: any = { ...formData };
            if (!updateData.password) {
                delete updateData.password;
            }

            const response = await fetch(`/api/users/${editingUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: 'user', isActive: true });
                fetchUsers();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update user');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    // Delete user
    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete user');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    // Start editing
    const startEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            isActive: user.isActive,
        });
        setShowCreateForm(true);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'manager': return 'bg-blue-100 text-blue-800';
            case 'user': return 'bg-green-100 text-green-800';
            case 'support': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FiUsers className="h-6 w-6" />
                        User Management
                    </h1>
                    <p className="text-gray-600">Manage system users and their permissions</p>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', password: '', role: 'user', isActive: true });
                        setShowCreateForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <FiPlus className="h-4 w-4" />
                    Add User
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="user">User</option>
                        <option value="support">Support</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Create/Edit Form Modal */}
            <Modal
                isOpen={showCreateForm}
                onClose={() => {
                    setShowCreateForm(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', password: '', role: 'user', isActive: true });
                }}
                title={editingUser ? "Edit User" : "Create New User"}
                size="2xl"
            >
                <form onSubmit={editingUser ? updateUser : createUser}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                    required={!editingUser}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Role *
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                    required
                                >
                                    <option value="user">User</option>
                                    <option value="support">Support</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                Active User
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingUser(null);
                                    setFormData({ name: '', email: '', password: '', role: 'user', isActive: true });
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                            >
                                <FiUsers className="h-4 w-4" />
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Login
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
                        {filteredUsers.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.isActive ? (
                                            <>
                                                <FiUserCheck className="h-3 w-3" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <FiUserX className="h-3 w-3" />
                                                Inactive
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => startEdit(user)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Edit user"
                                        >
                                            <FiEdit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user._id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete user"
                                        >
                                            <FiTrash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || roleFilter || statusFilter
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating a new user.'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
