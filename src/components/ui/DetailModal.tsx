'use client';

import { useState } from 'react';
import Modal from './Modal';
import { FiEdit2, FiUser, FiMail, FiPhone, FiHome, FiCalendar, FiClock, FiFlag, FiCheckSquare, FiDollarSign, FiFileText, FiTag } from 'react-icons/fi';

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    type: 'customer' | 'invoice' | 'task' | 'ticket';
    data: any;
}

export default function DetailModal({ isOpen, onClose, onEdit, type, data }: DetailModalProps) {
    if (!data) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string, type: string) => {
        if (type === 'invoice') {
            switch (status) {
                case 'paid': return 'bg-green-100 text-green-800';
                case 'sent': return 'bg-blue-100 text-blue-800';
                case 'overdue': return 'bg-red-100 text-red-800';
                case 'cancelled': return 'bg-gray-100 text-gray-800';
                case 'draft': return 'bg-yellow-100 text-yellow-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        } else if (type === 'task') {
            switch (status) {
                case 'completed': return 'bg-green-100 text-green-800';
                case 'in-progress': return 'bg-blue-100 text-blue-800';
                case 'review': return 'bg-purple-100 text-purple-800';
                case 'todo': return 'bg-gray-100 text-gray-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        } else if (type === 'ticket') {
            switch (status) {
                case 'closed': return 'bg-green-100 text-green-800';
                case 'in-progress': return 'bg-blue-100 text-blue-800';
                case 'pending': return 'bg-yellow-100 text-yellow-800';
                case 'open': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }
        return 'bg-gray-100 text-gray-800';
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

    const renderCustomerDetails = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <FiUser className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Name</p>
                            <p className="text-lg text-gray-900">{data.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <FiMail className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-gray-900">{data.email}</p>
                        </div>
                    </div>

                    {data.phone && (
                        <div className="flex items-center space-x-3">
                            <FiPhone className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="text-gray-900">{data.phone}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {data.company && (
                        <div className="flex items-center space-x-3">
                            <FiHome className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Company</p>
                                <p className="text-gray-900">{data.company}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-3">
                        <FiTag className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(data.status, 'customer')}`}>
                                {data.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Created</p>
                            <p className="text-gray-900">{formatDateTime(data.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {data.address && (
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-900">
                            {[data.address.street, data.address.city, data.address.state, data.address.zipCode, data.address.country].filter(Boolean).join(', ')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderInvoiceDetails = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                        <p className="text-lg font-semibold text-gray-900">{data.invoiceNumber}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Customer</p>
                        <p className="text-gray-900">{data.customerId?.name}</p>
                        <p className="text-sm text-gray-500">{data.customerId?.email}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(data.status, 'invoice')}`}>
                            {data.status}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">${data.total?.toFixed(2)}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Issue Date</p>
                        <p className="text-gray-900">{formatDate(data.issuedDate)}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Due Date</p>
                        <p className="text-gray-900">{formatDate(data.dueDate)}</p>
                    </div>

                    {data.paidDate && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Paid Date</p>
                            <p className="text-green-600">{formatDate(data.paidDate)}</p>
                        </div>
                    )}
                </div>
            </div>

            {data.items && data.items.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-3">Items</p>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item: any, index: number) => (
                                    <tr key={index} className="border-t border-gray-200">
                                        <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.unitPrice?.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.total?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="bg-white border-t border-gray-200 px-4 py-3">
                            <div className="flex justify-end space-y-1">
                                <div className="text-right space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500 mr-8">Subtotal:</span>
                                        <span className="text-sm text-gray-900">${data.subtotal?.toFixed(2)}</span>
                                    </div>
                                    {data.taxAmount > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500 mr-8">Tax ({data.taxRate}%):</span>
                                            <span className="text-sm text-gray-900">${data.taxAmount?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center border-t pt-1">
                                        <span className="text-base font-medium text-gray-900 mr-8">Total:</span>
                                        <span className="text-base font-bold text-gray-900">${data.total?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {data.notes && (
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-900">{data.notes}</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTaskDetails = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Title</p>
                        <p className="text-lg font-semibold text-gray-900">{data.title}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Customer</p>
                        <p className="text-gray-900">{data.customerId?.name}</p>
                        <p className="text-sm text-gray-500">{data.customerId?.email}</p>
                    </div>

                    {data.assignedTo && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Assigned To</p>
                            <p className="text-gray-900">{data.assignedTo.name}</p>
                            <p className="text-sm text-gray-500">{data.assignedTo.email}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex space-x-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(data.status, 'task')}`}>
                                {data.status.replace('-', ' ')}
                            </span>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Priority</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(data.priority)}`}>
                                {data.priority}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Created</p>
                        <p className="text-gray-900">{formatDateTime(data.createdAt)}</p>
                    </div>

                    {data.dueDate && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Due Date</p>
                            <p className="text-gray-900">{formatDate(data.dueDate)}</p>
                        </div>
                    )}
                </div>
            </div>

            {data.description && (
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-900 whitespace-pre-wrap">{data.description}</p>
                    </div>
                </div>
            )}

            {data.relatedInvoices && data.relatedInvoices.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Related Invoices</p>
                    <div className="space-y-2">
                        {data.relatedInvoices.map((invoice: any) => (
                            <div key={invoice._id} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                    <p className="text-sm text-gray-500">${invoice.total?.toFixed(2)}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status, 'invoice')}`}>
                                    {invoice.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.relatedTickets && data.relatedTickets.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Related Tickets</p>
                    <div className="space-y-2">
                        {data.relatedTickets.map((ticket: any) => (
                            <div key={ticket._id} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">{ticket.ticketNumber}</p>
                                    <p className="text-sm text-gray-500">{ticket.title}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status, 'ticket')}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderTicketDetails = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Ticket Number</p>
                        <p className="text-lg font-semibold text-gray-900">{data.ticketNumber}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Title</p>
                        <p className="text-gray-900">{data.title || data.subject}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Customer</p>
                        <p className="text-gray-900">{data.customerId?.name}</p>
                        <p className="text-sm text-gray-500">{data.customerId?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex space-x-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(data.status, 'ticket')}`}>
                                {data.status.replace('-', ' ')}
                            </span>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Priority</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(data.priority)}`}>
                                {data.priority}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Created</p>
                        <p className="text-gray-900">{formatDateTime(data.createdAt)}</p>
                    </div>

                    {data.assignedTo && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Assigned To</p>
                            <p className="text-gray-900">{data.assignedTo.name}</p>
                            <p className="text-sm text-gray-500">{data.assignedTo.email}</p>
                        </div>
                    )}
                </div>
            </div>

            {data.description && (
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-900 whitespace-pre-wrap">{data.description}</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (type) {
            case 'customer':
                return renderCustomerDetails();
            case 'invoice':
                return renderInvoiceDetails();
            case 'task':
                return renderTaskDetails();
            case 'ticket':
                return renderTicketDetails();
            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'customer':
                return data.name;
            case 'invoice':
                return data.invoiceNumber;
            case 'task':
                return data.title;
            case 'ticket':
                return `${data.ticketNumber} - ${data.title || data.subject}`;
            default:
                return 'Details';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="4xl"
        >
            <div className="space-y-6">
                {renderContent()}

                <div className="flex justify-end space-x-3 pt-6 border-t">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <FiEdit2 className="h-4 w-4" />
                            Edit
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
