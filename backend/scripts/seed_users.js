const sqlite3 = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, '..', 'database', 'umurage.db');
const db = new sqlite3(dbPath);

const DEFAULT_PASSWORD = 'password123';

async function seed() {
    console.log('🌱 Starting seed...');
    const now = new Date().toISOString();
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const users = [
        // --- SYSTEM ADMIN USERS ---
        {
            id: randomUUID(), phone: '0781000001', name: 'Mugisha Eric',
            role: 'admin', admin_level: 'province', managed_location: 'Kigali City',
            label: '🏛️  Province Admin (Kigali City)'
        },
        {
            id: randomUUID(), phone: '0781000002', name: 'Uwimana Claire',
            role: 'admin', admin_level: 'district', managed_location: 'Gasabo',
            label: '🏙️  District Admin (Gasabo)'
        },
        {
            id: randomUUID(), phone: '0781000003', name: 'Nshimwe Patrick',
            role: 'admin', admin_level: 'sector', managed_location: 'Kimironko',
            label: '📍  Sector Admin / SACCO Staff (Kimironko)'
        },
        // --- REGULAR MEMBER ---
        {
            id: randomUUID(), phone: '0782000001', name: 'Ingabire Sandrine',
            role: 'member', admin_level: 'none', managed_location: null,
            label: '👤  Regular Member'
        },
    ];

    let created = 0;
    for (const u of users) {
        try {
            db.prepare(`
                INSERT INTO users (id, phone, password_hash, name, role, admin_level, managed_location, is_activated, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).run(u.id, u.phone, hash, u.name, u.role, u.admin_level, u.managed_location, now, now);
            console.log(`  ✅ ${u.label}: ${u.name} (${u.phone})`);
            created++;
        } catch (e) {
            if (e.message.includes('UNIQUE')) {
                console.log(`  ⚠️  ${u.label}: Already exists (${u.phone})`);
            } else {
                console.log(`  ❌ ${u.label}: ${e.message}`);
            }
        }
    }

    // --- Create a group for community-level roles ---
    const groupId = randomUUID();
    const chairId = randomUUID();
    const treasurerId = randomUUID();
    const secretaryId = randomUUID();
    const memberId = randomUUID();

    const chairUserId = randomUUID();
    const treasurerUserId = randomUUID();
    const secretaryUserId = randomUUID();
    const memberUserId = randomUUID();

    // Create users for group roles
    const groupUsers = [
        { id: chairUserId, phone: '0783000001', name: 'Habimana Jules', label: '👑  Group Chairperson (admin)' },
        { id: treasurerUserId, phone: '0783000002', name: 'Mukamana Alice', label: '💰  Group Treasurer' },
        { id: secretaryUserId, phone: '0783000003', name: 'Ndayisaba Robert', label: '📝  Group Secretary' },
        { id: memberUserId, phone: '0783000004', name: 'Iradukunda Marie', label: '🙋  Ikimina Regular Member' },
    ];

    for (const u of groupUsers) {
        try {
            db.prepare(`
                INSERT INTO users (id, phone, password_hash, name, role, admin_level, is_activated, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'member', 'none', 1, ?, ?)
            `).run(u.id, u.phone, hash, u.name, now, now);
            console.log(`  ✅ ${u.label}: ${u.name} (${u.phone})`);
            created++;
        } catch (e) {
            if (e.message.includes('UNIQUE')) console.log(`  ⚠️  ${u.label}: Already exists`);
            else console.log(`  ❌ ${u.label}: ${e.message}`);
        }
    }

    // Create the Ikimina group
    try {
        db.prepare(`
            INSERT INTO groups (id, name, province, district, sector, admin_id, contribution_amount, contribution_frequency, model_type, penalty_amount, created_at, updated_at)
            VALUES (?, 'Ikimina Kimironko A', 'Kigali City', 'Gasabo', 'Kimironko', ?, 5000, 'monthly', 'ROSCA', 500, ?, ?)
        `).run(groupId, chairUserId, now, now);
        console.log(`\n  ✅ 🏘️  Created Ikimina: "Ikimina Kimironko A"`);
    } catch (e) {
        if (!e.message.includes('UNIQUE')) console.log(`  ❌ Group: ${e.message}`);
    }

    // Add members with their group roles
    const groupMembers = [
        { id: chairId, userId: chairUserId, role: 'admin', order: 1 },
        { id: treasurerId, userId: treasurerUserId, role: 'treasurer', order: 2 },
        { id: secretaryId, userId: secretaryUserId, role: 'secretary', order: 3 },
        { id: memberId, userId: memberUserId, role: 'member', order: 4 },
    ];

    for (const m of groupMembers) {
        try {
            db.prepare(`
                INSERT INTO members (id, group_id, user_id, role, rotation_order, joined_at, status)
                VALUES (?, ?, ?, ?, ?, ?, 'active')
            `).run(m.id, groupId, m.userId, m.role, m.order, now);
        } catch (e) {
            if (!e.message.includes('UNIQUE')) console.log(`  ❌ Member link: ${e.message}`);
        }
    }

    console.log('\n==========================================');
    console.log(`✅ Seed complete! ${created} users created.`);
    console.log('==========================================');
    console.log('\n📋 ALL USER CREDENTIALS:');
    console.log('   Password for all accounts: ' + DEFAULT_PASSWORD);
    console.log('------------------------------------------');
    console.log('SACCO / RCA Staff:');
    console.log('   Province Admin (Kigali): 0781000001');
    console.log('   District Admin (Gasabo): 0781000002');
    console.log('   Sector Admin (Kimironko): 0781000003');
    console.log('\nIkimina Members of "Ikimina Kimironko A":');
    console.log('   Chairperson:  0783000001');
    console.log('   Treasurer:    0783000002');
    console.log('   Secretary:    0783000003');
    console.log('   Member:       0783000004');
    console.log('\nStandalone Member (no group):');
    console.log('   Member:       0782000001');
    console.log('==========================================\n');

    db.close();
}

seed();
