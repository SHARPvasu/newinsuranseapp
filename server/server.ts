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

// Helper to log audits natively
async function logAudit(userId: string, action: string, entityType: string, entityId: string, details: any = {}) {
    try {
        await prisma.auditLog.create({
            data: { userId, action, entityType, entityId, details }
        });
    } catch (e) {
        console.error("Audit log failed", e);
    }
}

// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { policies: true, commissions: true, claims: true }
        });
        res.json(customers);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch customers' }); }
});
app.post('/api/customers', async (req, res) => {
    try {
        const { policies, ...customerData } = req.body;
        const customer = await prisma.customer.create({
            data: { ...customerData, policies: { create: policies || [] } },
            include: { policies: true }
        });
        await logAudit(customerData.agentId, 'CREATE', 'Customer', customer.id, { name: customer.name });
        res.json(customer);
    } catch (error) { res.status(500).json({ error: 'Failed to create customer' }); }
});
app.put('/api/customers/:id', async (req, res) => {
    try {
        const customer = await prisma.customer.update({
            where: { id: req.params.id },
            data: req.body,
            include: { policies: true }
        });
        req.body.agentId && await logAudit(req.body.agentId, 'UPDATE', 'Customer', customer.id, { name: customer.name });
        res.json(customer);
    } catch (error) { res.status(500).json({ error: 'Failed to update customer' }); }
});
app.delete('/api/customers/:id', async (req, res) => {
    try {
        await prisma.customer.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Failed to delete customer' }); }
});

// Policies
app.post('/api/customers/:id/policies', async (req, res) => {
    try {
        const policy = await prisma.policy.create({
            data: { ...req.body, customerId: req.params.id }
        });
        await logAudit(req.body.agentId, 'CREATE', 'Policy', policy.id, { type: policy.type });
        res.json(policy);
    } catch (error) { res.status(500).json({ error: 'Failed to add policy' }); }
});
app.put('/api/policies/:id', async (req, res) => {
    try {
        const policy = await prisma.policy.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(policy);
    } catch (error) { res.status(500).json({ error: 'Failed to update policy' }); }
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
        const lead = await prisma.lead.create({ data: req.body, include: { calls: true } });
        await logAudit(req.body.agentId, 'CREATE', 'Lead', lead.id, { name: lead.name });
        res.json(lead);
    } catch (error) { res.status(500).json({ error: 'Failed to create lead' }); }
});
app.put('/api/leads/:id', async (req, res) => {
    try {
        const lead = await prisma.lead.update({
            where: { id: req.params.id },
            data: req.body,
            include: { calls: true }
        });
        res.json(lead);
    } catch (error) { res.status(500).json({ error: 'Failed to update lead' }); }
});
app.delete('/api/leads/:id', async (req, res) => {
    try {
        await prisma.lead.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Failed to delete lead' }); }
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
        await logAudit(req.body.agentId, 'CREATE', 'Claim', claim.id, { claimNumber: claim.claimNumber });
        res.json(claim);
    } catch (error) { res.status(500).json({ error: 'Failed to create claim' }); }
});
app.put('/api/claims/:id', async (req, res) => {
    try {
        const claim = await prisma.claim.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(claim);
    } catch (error) { res.status(500).json({ error: 'Failed to update claim' }); }
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
app.put('/api/commissions/:id', async (req, res) => {
    try {
        const commission = await prisma.commission.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(commission);
    } catch (error) { res.status(500).json({ error: 'Failed to update commission' }); }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany();
        res.json(notifications);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});
app.post('/api/notifications', async (req, res) => {
    try {
        const notification = await prisma.notification.create({ data: req.body });
        res.json(notification);
    } catch (error) { res.status(500).json({ error: 'Failed to create notification' }); }
});
app.put('/api/notifications/:id', async (req, res) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(notification);
    } catch (error) { res.status(500).json({ error: 'Failed to update notification' }); }
});
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        await prisma.notification.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Failed to delete notification' }); }
});
app.delete('/api/notifications/user/:userId', async (req, res) => {
    try {
        await prisma.notification.deleteMany({ where: { userId: req.params.userId } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Failed to delete notifications' }); }
});

// --- USERS ---
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch users' }); }
});
app.post('/api/users', async (req, res) => {
    try {
        const user = await prisma.user.create({ data: req.body });
        await logAudit('admin', 'CREATE', 'User', user.id, { email: user.email });
        res.json(user);
    } catch (error) { res.status(500).json({ error: 'Failed to add user' }); }
});
app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(user);
    } catch (error) { res.status(500).json({ error: 'Failed to update user' }); }
});
app.delete('/api/users/:id', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Failed to delete user' }); }
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
        await logAudit(req.body.agentId, 'CREATE', 'Call', call.id, { contactName: call.contactName });
        res.json(call);
    } catch (error) { res.status(500).json({ error: 'Failed to create call record' }); }
});
app.put('/api/calls/:id', async (req, res) => {
    try {
        const call = await prisma.callRecord.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(call);
    } catch (error) { res.status(500).json({ error: 'Failed to update call record' }); }
});

// --- AUDIT LOGS ---
app.get('/api/auditLogs', async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(logs);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch audit logs' }); }
});
app.post('/api/auditLogs', async (req, res) => {
    try {
        const log = await prisma.auditLog.create({ data: req.body });
        res.json(log);
    } catch (error) { res.status(500).json({ error: 'Failed to create audit log' }); }
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
