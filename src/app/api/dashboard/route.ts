import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Customer from '../../../../api/models/Customer';
import Invoice from '../../../../api/models/Invoice';
import Task from '../../../../api/models/Task';
import Ticket from '../../../../api/models/Ticket';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState === 0) {
        try {
            await mongoose.connect(process.env.MONGODB_URI || '', {
                bufferCommands: false,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
}

export async function GET(request: NextRequest) {
    try {
        // Ensure database connection
        await connectDB();

        // Log connection status
        console.log('MongoDB connection state:', mongoose.connections[0].readyState);

        // Get counts with error handling for each model
        const [customerCount, invoiceCount, activeTaskCount, openTicketCount] = await Promise.allSettled([
            Customer.countDocuments({}),
            Invoice.countDocuments({}),
            Task.countDocuments({ status: 'active' }),
            Ticket.countDocuments({ status: 'open' }),
        ]);

        // Extract results, default to 0 if failed
        const summary = {
            customers: customerCount.status === 'fulfilled' ? customerCount.value : 0,
            invoices: invoiceCount.status === 'fulfilled' ? invoiceCount.value : 0,
            activeTasks: activeTaskCount.status === 'fulfilled' ? activeTaskCount.value : 0,
            openTickets: openTicketCount.status === 'fulfilled' ? openTicketCount.value : 0,
        };

        // Log any failed counts
        if (customerCount.status === 'rejected') console.error('Customer count failed:', customerCount.reason);
        if (invoiceCount.status === 'rejected') console.error('Invoice count failed:', invoiceCount.reason);
        if (activeTaskCount.status === 'rejected') console.error('Task count failed:', activeTaskCount.reason);
        if (openTicketCount.status === 'rejected') console.error('Ticket count failed:', openTicketCount.reason);

        // Last 30 days graph data (example: daily counts for each type)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);

        // Helper to get daily counts with error handling
        async function getDailyCounts(model: any, dateField: string) {
            try {
                return await model.aggregate([
                    {
                        $match: {
                            [dateField]: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },
                ]);
            } catch (error) {
                console.error(`Error getting daily counts for ${model.modelName}:`, error);
                return [];
            }
        }

        const [customerGraph, invoiceGraph, taskGraph, ticketGraph] = await Promise.allSettled([
            getDailyCounts(Customer, 'createdAt'),
            getDailyCounts(Invoice, 'createdAt'),
            getDailyCounts(Task, 'createdAt'),
            getDailyCounts(Ticket, 'createdAt'),
        ]);

        // Extract graph results, default to empty array if failed
        const graph = {
            customers: customerGraph.status === 'fulfilled' ? customerGraph.value : [],
            invoices: invoiceGraph.status === 'fulfilled' ? invoiceGraph.value : [],
            tasks: taskGraph.status === 'fulfilled' ? taskGraph.value : [],
            tickets: ticketGraph.status === 'fulfilled' ? ticketGraph.value : [],
        };

        return NextResponse.json({
            summary,
            graph,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                summary: {
                    customers: 0,
                    invoices: 0,
                    activeTasks: 0,
                    openTickets: 0,
                },
                graph: {
                    customers: [],
                    invoices: [],
                    tasks: [],
                    tickets: [],
                }
            },
            { status: 500 }
        );
    }
}
