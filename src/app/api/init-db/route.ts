import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';
import { DEFAULT_SEED } from '@/lib/store';

export async function GET() {
  return handleInitDb();
}

export async function POST() {
  return handleInitDb();
}

async function handleInitDb() {
  try {
    const sql = getDbSql();

    // 1. Create Tables
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        farm_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        currency VARCHAR(10) DEFAULT '৳',
        tax_rate NUMERIC(5,2) DEFAULT 0,
        printer_width VARCHAR(20) DEFAULT '80mm',
        theme VARCHAR(20) DEFAULT 'dark'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS flocks (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        breed VARCHAR(100),
        initial_qty INT DEFAULT 0,
        current_qty INT DEFAULT 0,
        start_date DATE,
        age_days INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        house_no VARCHAR(50)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price NUMERIC(12,2) NOT NULL,
        cost NUMERIC(12,2) NOT NULL,
        stock NUMERIC(12,2) DEFAULT 0,
        unit VARCHAR(50),
        min_stock NUMERIC(12,2) DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS khamari_logs (
        id VARCHAR(50) PRIMARY KEY,
        flock_id VARCHAR(50),
        log_date DATE NOT NULL,
        egg_good INT DEFAULT 0,
        egg_damaged INT DEFAULT 0,
        feed_bags NUMERIC(10,2) DEFAULT 0,
        mortality INT DEFAULT 0,
        temperature NUMERIC(5,2),
        notes TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS feed_ingredients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        stock_kg NUMERIC(12,2) DEFAULT 0,
        cost_per_kg NUMERIC(12,2) DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        due NUMERIC(12,2) DEFAULT 0,
        total_purchases NUMERIC(12,2) DEFAULT 0,
        address TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        balance NUMERIC(12,2) DEFAULT 0,
        address TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(50) PRIMARY KEY,
        sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        customer_id VARCHAR(50),
        customer_name VARCHAR(255),
        items JSONB NOT NULL,
        subtotal NUMERIC(12,2) NOT NULL,
        discount NUMERIC(12,2) DEFAULT 0,
        grand_total NUMERIC(12,2) NOT NULL,
        paid_amount NUMERIC(12,2) NOT NULL,
        due_amount NUMERIC(12,2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        status VARCHAR(50) DEFAULT 'Paid'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS accounting (
        id VARCHAR(50) PRIMARY KEY,
        entry_date DATE NOT NULL,
        entry_type VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        note TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(50) PRIMARY KEY,
        lender VARCHAR(255) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        interest_rate NUMERIC(5,2) DEFAULT 0,
        emi NUMERIC(12,2) DEFAULT 0,
        remaining NUMERIC(12,2) NOT NULL,
        next_due_date DATE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS installments (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        total_amount NUMERIC(12,2) NOT NULL,
        paid_amount NUMERIC(12,2) DEFAULT 0,
        remaining NUMERIC(12,2) NOT NULL,
        installment_count INT DEFAULT 1,
        next_date DATE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        salary NUMERIC(12,2) NOT NULL,
        advance NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active'
      );
    `;

    // 2. Seed Settings
    const s = DEFAULT_SEED.settings;
    await sql`
      INSERT INTO settings (id, farm_name, phone, address, currency, tax_rate, printer_width, theme)
      VALUES ('default', ${s.farmName}, ${s.phone}, ${s.address}, ${s.currency}, ${s.taxRate}, ${s.printerWidth}, ${s.theme})
      ON CONFLICT (id) DO NOTHING;
    `;

    // 3. Seed Flocks
    for (const f of DEFAULT_SEED.flocks) {
      await sql`
        INSERT INTO flocks (id, name, breed, initial_qty, current_qty, start_date, age_days, status, house_no)
        VALUES (${f.id}, ${f.name}, ${f.breed}, ${f.initialQty}, ${f.currentQty}, ${f.startDate}, ${f.ageDays}, ${f.status}, ${f.houseNo})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 4. Seed Products
    for (const p of DEFAULT_SEED.products) {
      await sql`
        INSERT INTO products (id, name, category, price, cost, stock, unit, min_stock)
        VALUES (${p.id}, ${p.name}, ${p.category}, ${p.price}, ${p.cost}, ${p.stock}, ${p.unit}, ${p.minStock})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 5. Seed Customers
    for (const c of DEFAULT_SEED.customers) {
      await sql`
        INSERT INTO customers (id, name, phone, due, total_purchases, address)
        VALUES (${c.id}, ${c.name}, ${c.phone}, ${c.due}, ${c.totalPurchases}, ${c.address || ''})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 6. Seed Suppliers
    for (const sup of DEFAULT_SEED.suppliers) {
      await sql`
        INSERT INTO suppliers (id, name, phone, balance, address)
        VALUES (${sup.id}, ${sup.name}, ${sup.phone}, ${sup.balance}, ${sup.address || ''})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Neon PostgreSQL database tables created and seeded successfully!'
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
