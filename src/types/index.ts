// Frontend TypeScript interfaces - no Mongoose dependencies

export interface Customer {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    tags: string[];
    status: 'active' | 'inactive' | 'prospect' | 'lead';
    assignedTo?: string;
    notes?: string;
    customFields?: Record<string, unknown>;
    totalSpent: number;
    lastContactDate?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Invoice {
    _id: string;
    invoiceNumber: string;
    customerId: string;
    items: InvoiceItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    issuedDate: string;
    dueDate: string;
    paidDate?: string;
    notes?: string;
    billingAddress: {
        name: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: string;
    customerId: string;
    relatedInvoices: string[];
    relatedTickets: string[];
    dueDate?: string;
    completedDate?: string;
    tags: string[];
    attachments: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    customerId: string;
    assignedTo?: string;
    relatedInvoices: string[];
    relatedTickets: string[];
    messages: TicketMessage[];
    tags: string[];
    resolution?: string;
    resolvedDate?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface TicketMessage {
    sender: string;
    senderType: 'user' | 'customer';
    message: string;
    attachments: string[];
    timestamp: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'user' | 'support';
    permissions: string[];
    isActive: boolean;
    lastLogin?: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Webhook {
    _id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    secret?: string;
    lastTriggered?: string;
    failureCount: number;
    maxRetries: number;
    retryDelay: number;
    headers: Record<string, string>;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role?: string;
}
