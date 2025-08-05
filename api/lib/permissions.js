// Permissions constants
const PERMISSIONS = {
    // Customer permissions
    CUSTOMER_READ: 'customer:read',
    CUSTOMER_WRITE: 'customer:write',
    CUSTOMER_DELETE: 'customer:delete',

    // Invoice permissions
    INVOICE_READ: 'invoice:read',
    INVOICE_WRITE: 'invoice:write',
    INVOICE_DELETE: 'invoice:delete',

    // Task permissions
    TASK_READ: 'task:read',
    TASK_WRITE: 'task:write',
    TASK_DELETE: 'task:delete',

    // Ticket permissions
    TICKET_READ: 'ticket:read',
    TICKET_WRITE: 'ticket:write',
    TICKET_DELETE: 'ticket:delete',

    // User permissions
    USER_READ: 'user:read',
    USER_WRITE: 'user:write',
    USER_DELETE: 'user:delete',

    // Webhook permissions
    WEBHOOK_READ: 'webhook:read',
    WEBHOOK_WRITE: 'webhook:write',
    WEBHOOK_DELETE: 'webhook:delete',

    // Admin permissions
    ADMIN_ALL: 'admin:all',
};

// Role-based permissions
const ROLE_PERMISSIONS = {
    admin: [
        PERMISSIONS.ADMIN_ALL,
        // All permissions for admin
        ...Object.values(PERMISSIONS)
    ],
    manager: [
        PERMISSIONS.CUSTOMER_READ,
        PERMISSIONS.CUSTOMER_WRITE,
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.INVOICE_WRITE,
        PERMISSIONS.TASK_READ,
        PERMISSIONS.TASK_WRITE,
        PERMISSIONS.TICKET_READ,
        PERMISSIONS.TICKET_WRITE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.WEBHOOK_READ,
        PERMISSIONS.WEBHOOK_WRITE,
    ],
    user: [
        PERMISSIONS.CUSTOMER_READ,
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.TASK_READ,
        PERMISSIONS.TASK_WRITE,
        PERMISSIONS.TICKET_READ,
        PERMISSIONS.TICKET_WRITE,
    ],
    viewer: [
        PERMISSIONS.CUSTOMER_READ,
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.TASK_READ,
        PERMISSIONS.TICKET_READ,
    ]
};

/**
 * Get permissions for a specific role
 */
function getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user has specific permission
 */
function hasPermission(userPermissions, requiredPermission) {
    return userPermissions.includes(requiredPermission) || userPermissions.includes(PERMISSIONS.ADMIN_ALL);
}

/**
 * Middleware to check permissions
 */
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userPermissions = getRolePermissions(req.user.role);

        if (!hasPermission(userPermissions, permission)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

module.exports = {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    getRolePermissions,
    hasPermission,
    requirePermission
};
