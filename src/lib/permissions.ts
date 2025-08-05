// Permission constants for RBAC
export const PERMISSIONS = {
  // Customer permissions
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  // Invoice permissions
  INVOICE_READ: 'invoice:read',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',

  // Task permissions
  TASK_READ: 'task:read',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',

  // Ticket permissions
  TICKET_READ: 'ticket:read',
  TICKET_CREATE: 'ticket:create',
  TICKET_UPDATE: 'ticket:update',
  TICKET_DELETE: 'ticket:delete',

  // User permissions
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Webhook permissions
  WEBHOOK_READ: 'webhook:read',
  WEBHOOK_CREATE: 'webhook:create',
  WEBHOOK_UPDATE: 'webhook:update',
  WEBHOOK_DELETE: 'webhook:delete',

  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  REPORTS_VIEW: 'reports:view',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

// Role-based permission mappings
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),

  manager: [
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.WEBHOOK_READ,
  ],

  user: [
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_UPDATE,
  ],

  support: [
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
  ],
} as const;

export function getRolePermissions(role: keyof typeof ROLE_PERMISSIONS): string[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes(PERMISSIONS.SYSTEM_ADMIN);
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}
