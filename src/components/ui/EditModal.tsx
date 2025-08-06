'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';
import { FiSave, FiUser, FiMail, FiPhone, FiHome, FiCalendar, FiFlag, FiDollarSign, FiFileText } from 'react-icons/fi';

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    type: 'customer' | 'invoice' | 'task' | 'ticket';
    data: any;
    customers?: any[];
    invoices?: any[];
    tickets?: any[];
    users?: any[];
}

export default function EditModal({
    isOpen,
    onClose,
    onSave,
    type,
    data,
    customers = [],
    invoices = [],
    tickets = [],
    users = []
}: EditModalProps) {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (data && isOpen) {
            // Initialize form data based on type
            switch (type) {
                case 'customer':
                    setFormData({
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        company: data.company || '',
                        status: data.status || 'prospect',
                        address: {
                            street: data.address?.street || '',
                            city: data.address?.city || '',
                            state: data.address?.state || '',
                            zipCode: data.address?.zipCode || '',
                            country: data.address?.country || ''
                        }
                    });
                    break;
                case 'invoice':
                    setFormData({
                        customerId: data.customerId?._id || data.customerId || '',
                        status: data.status || 'draft',
                        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
                        notes: data.notes || '',
                        items: data.items || [{ description: '', quantity: 1, unitPrice: 0 }],
                        taxRate: data.taxRate || 0,
                        billingAddress: data.billingAddress || {
                            name: '',
                            street: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            country: ''
                        }
                    });
                    break;
                case 'task':
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        priority: data.priority || 'medium',
                        status: data.status || 'todo',
                        customerId: data.customerId?._id || data.customerId || '',
                        assignedTo: data.assignedTo?._id || data.assignedTo || '',
                        relatedInvoices: data.relatedInvoices?.map((inv: any) => inv._id || inv) || [],
                        relatedTickets: data.relatedTickets?.map((ticket: any) => ticket._id || ticket) || [],
                        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : ''
                    });
                    break;
                case 'ticket':
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        priority: data.priority || 'medium',
                        status: data.status || 'open',
                        customerId: data.customerId?._id || data.customerId || '',
                        assignedTo: data.assignedTo?._id || data.assignedTo || ''
                    });
                    break;
            }
        }
    }, [data, isOpen, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Process form data based on type
            let processedData = { ...formData };

            if (type === 'invoice' && processedData.items) {
                // Calculate totals for invoice
                const items = processedData.items.map((item: any) => ({
                    ...item,
                    total: item.quantity * item.unitPrice
                }));

                const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
                const taxAmount = subtotal * (processedData.taxRate / 100);
                const total = subtotal + taxAmount;

                processedData = {
                    ...processedData,
                    items,
                    subtotal,
                    taxAmount,
                    total
                };
            }

            await onSave(processedData);
            onClose();
        } catch (error: any) {
            if (error.details) {
                const newErrors: any = {};
                error.details.forEach((detail: any) => {
                    newErrors[detail.path.join('.')] = detail.message;
                });
                setErrors(newErrors);
            } else {
                setErrors({ general: error.message || 'An error occurred' });
            }
        } finally {
            setLoading(false);
        }
    };

    const addInvoiceItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }]
        });
    };

    const removeInvoiceItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_: any, i: number) => i !== index)
        });
    };

    const updateInvoiceItem = (index: number, field: string, value: any) => {
        const updatedItems = [...formData.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setFormData({ ...formData, items: updatedItems });
    };

    const renderCustomerForm = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiUser className="inline h-4 w-4 mr-1" />
                        Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiMail className="inline h-4 w-4 mr-1" />
                        Email *
                    </label>
                    <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiPhone className="inline h-4 w-4 mr-1" />
                        Phone
                    </label>
                    <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiHome className="inline h-4 w-4 mr-1" />
                        Company
                    </label>
                    <input
                        type="text"
                        value={formData.company || ''}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={formData.status || 'prospect'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="prospect">Prospect</option>
                        <option value="lead">Lead</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Address Section */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                        <input
                            type="text"
                            value={formData.address?.street || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                address: { ...formData.address, street: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            value={formData.address?.city || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                address: { ...formData.address, city: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                            type="text"
                            value={formData.address?.state || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                address: { ...formData.address, state: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                        <input
                            type="text"
                            value={formData.address?.zipCode || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                address: { ...formData.address, zipCode: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                            type="text"
                            value={formData.address?.country || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                address: { ...formData.address, country: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTaskForm = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiUser className="inline h-4 w-4 mr-1" />
                        Customer *
                    </label>
                    <SearchableSelect
                        options={customers.map(customer => ({
                            value: customer._id,
                            label: customer.name,
                            subtitle: customer.email
                        }))}
                        value={formData.customerId || ''}
                        onChange={(value) => setFormData({ ...formData, customerId: value })}
                        placeholder="Select Customer"
                    />
                    {errors.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiFlag className="inline h-4 w-4 mr-1" />
                        Priority
                    </label>
                    <select
                        value={formData.priority || 'medium'}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={formData.status || 'todo'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {users.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                        <SearchableSelect
                            options={[{ value: '', label: 'Unassigned', subtitle: '' }, ...users.map(user => ({
                                value: user._id,
                                label: user.name,
                                subtitle: user.email
                            }))]}
                            value={formData.assignedTo || ''}
                            onChange={(value) => setFormData({ ...formData, assignedTo: value })}
                            placeholder="Select User"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiCalendar className="inline h-4 w-4 mr-1" />
                        Due Date
                    </label>
                    <input
                        type="date"
                        value={formData.dueDate || ''}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Related Invoices */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Invoices</label>
                <SearchableSelect
                    options={invoices.map(invoice => ({
                        value: invoice._id,
                        label: invoice.invoiceNumber,
                        subtitle: `$${invoice.total?.toFixed(2)} - ${invoice.status}`
                    }))}
                    value={formData.relatedInvoices || []}
                    onChange={(value) => setFormData({ ...formData, relatedInvoices: value })}
                    placeholder="Select Invoices"
                    multiple
                />
            </div>

            {/* Related Tickets */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Tickets</label>
                <SearchableSelect
                    options={tickets.map(ticket => ({
                        value: ticket._id,
                        label: ticket.ticketNumber,
                        subtitle: `${ticket.title} - ${ticket.status}`
                    }))}
                    value={formData.relatedTickets || []}
                    onChange={(value) => setFormData({ ...formData, relatedTickets: value })}
                    placeholder="Select Tickets"
                    multiple
                />
            </div>
        </div>
    );

    const getTitle = () => {
        switch (type) {
            case 'customer':
                return `Edit Customer - ${data?.name}`;
            case 'invoice':
                return `Edit Invoice - ${data?.invoiceNumber}`;
            case 'task':
                return `Edit Task - ${data?.title}`;
            case 'ticket':
                return `Edit Ticket - ${data?.ticketNumber}`;
            default:
                return 'Edit';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {errors.general}
                    </div>
                )}

                {type === 'customer' && renderCustomerForm()}
                {type === 'task' && renderTaskForm()}

                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <FiSave className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
