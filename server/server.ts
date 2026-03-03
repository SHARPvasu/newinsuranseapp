import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db';

// Load env variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { policies: true, commissions: true, claims: true }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { policies, ...customerData } = req.body;

        const customer = await prisma.customer.create({
            data: {
                ...customerData,
                policies: {
                    create: policies
                }
            },
            include: { policies: true }
        });

        // Log the audit
        await prisma.auditLog.create({
            data: {
                userId: customerData.agentId,
                action: 'CREATE',
                entityType: 'Customer',
                entityId: customer.id,
                details: { customerName: customer.name }
            }
        });

        res.json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// --- LEADS ---
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({ include: { calls: true } });
        res.json(leads);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch leads' }); }
});
app.post('/api/leads', async (req, res) => {
    try {
        const lead = await prisma.lead.create({ data: req.body });
        res.json(lead);
    } catch (error) { res.status(500).json({ error: 'Failed to create lead' }); }
});

// --- CLAIMS ---
app.get('/api/claims', async (req, res) => {
    try {
        const claims = await prisma.claim.findMany();
        res.json(claims);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch claims' }); }
});
app.post('/api/claims', async (req, res) => {
    try {
        const claim = await prisma.claim.create({ data: req.body });
        res.json(claim);
    } catch (error) { res.status(500).json({ error: 'Failed to create claim' }); }
});

// --- COMMISSIONS ---
app.get('/api/commissions', async (req, res) => {
    try {
        const commissions = await prisma.commission.findMany();
        res.json(commissions);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch commissions' }); }
});
app.post('/api/commissions', async (req, res) => {
    try {
        const commission = await prisma.commission.create({ data: req.body });
        res.json(commission);
    } catch (error) { res.status(500).json({ error: 'Failed to create commission' }); }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany();
        res.json(notifications);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

// --- USERS ---
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch users' }); }
});

// --- CALLS ---
app.get('/api/calls', async (req, res) => {
    try {
        const calls = await prisma.callRecord.findMany();
        res.json(calls);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch calls' }); }
});
app.post('/api/calls', async (req, res) => {
    try {
        const call = await prisma.callRecord.create({ data: req.body });
        res.json(call);
    } catch (error) { res.status(500).json({ error: 'Failed to create call record' }); }
});

// --- AUDIT LOGS ---
app.get('/api/auditLogs', async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(logs);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch audit logs' }); }
});

const initializeDatabase = async () => {
    try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            console.log('Seeding initial users...');
            await prisma.user.createMany({
                data: [
                    { id: 'owner-1', name: 'UV Insurance Admin', email: 'admin@uvinsurance.com', password: 'Admin@123', role: 'owner', phone: '+91 9876543210', isActive: true },
                    { id: 'emp-1', name: 'Priya Singh', email: 'priya@uvinsurance.com', password: 'Employee@123', role: 'employee', phone: '+91 9876543211', isActive: true },
                    { id: 'emp-2', name: 'Rahul Mehta', email: 'rahul@uvinsurance.com', password: 'Employee@123', role: 'employee', phone: '+91 9876543212', isActive: true },
                    { id: 'emp-3', name: 'Sneha Reddy', email: 'sneha@uvinsurance.com', password: 'Employee@123', role: 'employee', phone: '+91 9876543213', isActive: true }
                ]
            });
            console.log('Database seeded successfully.');
        }
    } catch (e) {
        console.error('Error seeding database:', e);
    }
};

app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server API is running on http://localhost:${PORT}`);
});
