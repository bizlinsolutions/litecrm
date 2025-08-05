// MongoDB initialization script for Docker
db = db.getSiblingDB('litecrm');

// Create a user for the application
db.createUser({
    user: 'litecrm',
    pwd: 'litecrm123',
    roles: [
        {
            role: 'readWrite',
            db: 'litecrm'
        }
    ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ email: 1 });
db.customers.createIndex({ name: "text", company: "text", email: "text" });
db.invoices.createIndex({ invoiceNumber: 1 }, { unique: true });
db.tasks.createIndex({ title: "text", description: "text" });
db.tickets.createIndex({ ticketNumber: 1 }, { unique: true });
db.tickets.createIndex({ subject: "text", description: "text" });

print('Database initialized successfully');
