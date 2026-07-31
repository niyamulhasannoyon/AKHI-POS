import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';
import { FarmState, Flock, Product, KhamariLog, FeedIngredient, Customer, Supplier, Sale, AccountingEntry, Loan, Installment, Employee, BatchSale, BatchExpense, KhamarProfile, CustomerPayment, PosAuthorizedEmail } from '@/lib/types';

let tablesEnsured = false;

async function ensureTablesExist(sql: ReturnType<typeof getDbSql>) {
  if (tablesEnsured) return;

  await Promise.all([
    sql`
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
    `,
    sql`
      CREATE TABLE IF NOT EXISTS flocks (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        breed VARCHAR(100),
        company_name VARCHAR(255),
        unit_price NUMERIC(12,2),
        initial_qty INT DEFAULT 0,
        current_qty INT DEFAULT 0,
        start_date DATE,
        age_days INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        house_no VARCHAR(50)
      );
    `,
    sql`
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
    `,
    sql`
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
    `,
    sql`
      CREATE TABLE IF NOT EXISTS feed_ingredients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        stock_kg NUMERIC(12,2) DEFAULT 0,
        cost_per_kg NUMERIC(12,2) DEFAULT 0
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        due NUMERIC(12,2) DEFAULT 0,
        total_purchases NUMERIC(12,2) DEFAULT 0,
        address TEXT,
        category VARCHAR(100),
        email VARCHAR(255)
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        balance NUMERIC(12,2) DEFAULT 0,
        address TEXT
      );
    `,
    sql`
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
    `,
    sql`
      CREATE TABLE IF NOT EXISTS accounting (
        id VARCHAR(50) PRIMARY KEY,
        entry_date DATE NOT NULL,
        entry_type VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        note TEXT
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(50) PRIMARY KEY,
        lender VARCHAR(255) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        interest_rate NUMERIC(5,2) DEFAULT 0,
        emi NUMERIC(12,2) DEFAULT 0,
        remaining NUMERIC(12,2) NOT NULL,
        next_due_date DATE
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS installments (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        total_amount NUMERIC(12,2) NOT NULL,
        paid_amount NUMERIC(12,2) DEFAULT 0,
        remaining NUMERIC(12,2) NOT NULL,
        installment_count INT DEFAULT 1,
        next_date DATE
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        salary NUMERIC(12,2) NOT NULL,
        advance NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active'
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS batch_sales (
        id VARCHAR(50) PRIMARY KEY,
        flock_id VARCHAR(50),
        sale_date DATE NOT NULL,
        buyer_name VARCHAR(255),
        bird_qty INT DEFAULT 0,
        total_weight NUMERIC(12,2) DEFAULT 0,
        price_per_kg NUMERIC(12,2) DEFAULT 0,
        total_amount NUMERIC(12,2) DEFAULT 0
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS batch_expenses (
        id VARCHAR(50) PRIMARY KEY,
        flock_id VARCHAR(50),
        exp_date DATE NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        note TEXT
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS khamars (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        farm_type VARCHAR(50),
        capacity INT DEFAULT 0,
        notes TEXT
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS customer_payments (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50),
        pay_date DATE NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        payment_method VARCHAR(50),
        note TEXT
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS pos_authorized_emails (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        role VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Active',
        added_date DATE
      );
    `
  ]);

  tablesEnsured = true;
}

export async function GET() {
  try {
    const sql = getDbSql();
    await ensureTablesExist(sql);

    const [settingsRows, flocks, products, khamariLogs, feedIngredients, customers, suppliers, salesRows, accountingRows, loansRows, installmentsRows, employeesRows, batchSalesRows, batchExpensesRows, khamarsRows, customerPaymentsRows, posEmailsRows] = await Promise.all([
      sql`SELECT * FROM settings WHERE id = 'default' LIMIT 1`,
      sql`SELECT id, name, breed, company_name AS "companyName", unit_price::float AS "unitPrice", initial_qty AS "initialQty", current_qty AS "currentQty", start_date::text AS "startDate", age_days AS "ageDays", status, house_no AS "houseNo" FROM flocks ORDER BY id ASC`,
      sql`SELECT id, name, category, price::float, cost::float, stock::float, unit, min_stock::float AS "minStock" FROM products ORDER BY id ASC`,
      sql`SELECT id, flock_id AS "flockId", log_date::text AS "date", egg_good AS "eggGood", egg_damaged AS "eggDamaged", feed_bags::float AS "feedBags", mortality, temperature::float, notes FROM khamari_logs ORDER BY log_date DESC`,
      sql`SELECT id, name, stock_kg::float AS "stockKg", cost_per_kg::float AS "costPerKg" FROM feed_ingredients ORDER BY id ASC`,
      sql`SELECT id, name, phone, due::float, total_purchases::float AS "totalPurchases", address, category, email FROM customers ORDER BY id ASC`,
      sql`SELECT id, name, phone, balance::float, address FROM suppliers ORDER BY id ASC`,
      sql`SELECT id, sale_date::text AS "date", customer_id AS "customerId", customer_name AS "customerName", items, subtotal::float, discount::float, grand_total::float AS "grandTotal", paid_amount::float AS "paidAmount", due_amount::float AS "dueAmount", payment_method AS "paymentMethod", status FROM sales ORDER BY sale_date DESC`,
      sql`SELECT id, entry_date::text AS "date", entry_type AS "type", category, amount::float, note FROM accounting ORDER BY entry_date DESC`,
      sql`SELECT id, lender, amount::float, interest_rate::float AS "interestRate", emi::float, remaining::float, next_due_date::text AS "nextDueDate" FROM loans ORDER BY id ASC`,
      sql`SELECT id, customer_name AS "customerName", total_amount::float AS "totalAmount", paid_amount::float AS "paidAmount", remaining::float, installment_count AS "installmentCount", next_date::text AS "nextDate" FROM installments ORDER BY id ASC`,
      sql`SELECT id, name, role, salary::float, advance::float, status FROM employees ORDER BY id ASC`,
      sql`SELECT id, flock_id AS "flockId", sale_date::text AS "date", buyer_name AS "buyerName", bird_qty AS "birdQty", total_weight::float AS "totalWeight", price_per_kg::float AS "pricePerKg", total_amount::float AS "totalAmount" FROM batch_sales ORDER BY sale_date DESC`,
      sql`SELECT id, flock_id AS "flockId", exp_date::text AS "date", category, amount::float, note FROM batch_expenses ORDER BY exp_date DESC`,
      sql`SELECT id, name, owner_name AS "ownerName", phone, address, farm_type AS "farmType", capacity, notes FROM khamars ORDER BY id ASC`,
      sql`SELECT id, customer_id AS "customerId", pay_date::text AS "date", amount::float, payment_method AS "paymentMethod", note FROM customer_payments ORDER BY pay_date DESC`,
      sql`SELECT id, email, name, role, status, added_date::text AS "addedDate" FROM pos_authorized_emails ORDER BY added_date DESC`
    ]);

    const rawSettings = settingsRows[0] || {};
    const settings = {
      farmName: rawSettings.farm_name || 'Akhi Poultry Farm & Feed Mills',
      phone: rawSettings.phone || '+880 1700-000000',
      address: rawSettings.address || 'Khamar Road, Gazipur, Bangladesh',
      currency: rawSettings.currency || '৳',
      taxRate: Number(rawSettings.tax_rate) || 0,
      printerWidth: rawSettings.printer_width || '80mm',
      theme: rawSettings.theme || 'dark'
    };

    return NextResponse.json({
      success: true,
      data: {
        settings,
        flocks: flocks as Flock[],
        products: products as Product[],
        khamariLogs: khamariLogs as KhamariLog[],
        feedIngredients: feedIngredients as FeedIngredient[],
        customers: customers as Customer[],
        suppliers: suppliers as Supplier[],
        sales: salesRows as Sale[],
        accounting: accountingRows as AccountingEntry[],
        loans: loansRows as Loan[],
        installments: installmentsRows as Installment[],
        employees: employeesRows as Employee[],
        batchSales: batchSalesRows as BatchSale[],
        batchExpenses: batchExpensesRows as BatchExpense[],
        khamars: khamarsRows as KhamarProfile[],
        customerPayments: customerPaymentsRows as CustomerPayment[],
        posAuthorizedEmails: posEmailsRows as PosAuthorizedEmail[]
      }
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database fetch failed';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDbSql();
    await ensureTablesExist(sql);

    const body: FarmState = await request.json();

    if (!body) {
      return NextResponse.json({ success: false, error: 'Empty payload' }, { status: 400 });
    }

    const tasks: Promise<unknown>[] = [];

    // Sync Settings
    if (body.settings) {
      const s = body.settings;
      tasks.push(sql`
        INSERT INTO settings (id, farm_name, phone, address, currency, tax_rate, printer_width, theme)
        VALUES ('default', ${s.farmName}, ${s.phone}, ${s.address}, ${s.currency}, ${s.taxRate}, ${s.printerWidth}, ${s.theme})
        ON CONFLICT (id) DO UPDATE SET
          farm_name = EXCLUDED.farm_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          currency = EXCLUDED.currency,
          tax_rate = EXCLUDED.tax_rate,
          printer_width = EXCLUDED.printer_width,
          theme = EXCLUDED.theme;
      `);
    }

    // Sync Flocks
    if (Array.isArray(body.flocks)) {
      body.flocks.forEach(f => {
        tasks.push(sql`
          INSERT INTO flocks (id, name, breed, company_name, unit_price, initial_qty, current_qty, start_date, age_days, status, house_no)
          VALUES (${f.id}, ${f.name}, ${f.breed}, ${f.companyName || null}, ${f.unitPrice || null}, ${f.initialQty}, ${f.currentQty}, ${f.startDate}, ${f.ageDays}, ${f.status}, ${f.houseNo})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            breed = EXCLUDED.breed,
            company_name = EXCLUDED.company_name,
            unit_price = EXCLUDED.unit_price,
            initial_qty = EXCLUDED.initial_qty,
            current_qty = EXCLUDED.current_qty,
            start_date = EXCLUDED.start_date,
            age_days = EXCLUDED.age_days,
            status = EXCLUDED.status,
            house_no = EXCLUDED.house_no;
        `);
      });
    }

    // Sync Products
    if (Array.isArray(body.products)) {
      body.products.forEach(p => {
        tasks.push(sql`
          INSERT INTO products (id, name, category, price, cost, stock, unit, min_stock)
          VALUES (${p.id}, ${p.name}, ${p.category}, ${p.price}, ${p.cost}, ${p.stock}, ${p.unit}, ${p.minStock})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            price = EXCLUDED.price,
            cost = EXCLUDED.cost,
            stock = EXCLUDED.stock,
            unit = EXCLUDED.unit,
            min_stock = EXCLUDED.min_stock;
        `);
      });
    }

    // Sync Customers
    if (Array.isArray(body.customers)) {
      body.customers.forEach(c => {
        tasks.push(sql`
          INSERT INTO customers (id, name, phone, due, total_purchases, address, category, email)
          VALUES (${c.id}, ${c.name}, ${c.phone}, ${c.due}, ${c.totalPurchases}, ${c.address || null}, ${c.category || null}, ${c.email || null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            due = EXCLUDED.due,
            total_purchases = EXCLUDED.total_purchases,
            address = EXCLUDED.address,
            category = EXCLUDED.category,
            email = EXCLUDED.email;
        `);
      });
    }

    // Sync Suppliers
    if (Array.isArray(body.suppliers)) {
      body.suppliers.forEach(s => {
        tasks.push(sql`
          INSERT INTO suppliers (id, name, phone, balance, address)
          VALUES (${s.id}, ${s.name}, ${s.phone}, ${s.balance}, ${s.address || null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            balance = EXCLUDED.balance,
            address = EXCLUDED.address;
        `);
      });
    }

    // Sync Sales
    if (Array.isArray(body.sales)) {
      body.sales.forEach(s => {
        tasks.push(sql`
          INSERT INTO sales (id, sale_date, customer_id, customer_name, items, subtotal, discount, grand_total, paid_amount, due_amount, payment_method, status)
          VALUES (${s.id}, ${s.date}, ${s.customerId}, ${s.customerName}, ${JSON.stringify(s.items)}, ${s.subtotal}, ${s.discount}, ${s.grandTotal}, ${s.paidAmount}, ${s.dueAmount}, ${s.paymentMethod}, ${s.status})
          ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            customer_name = EXCLUDED.customer_name,
            items = EXCLUDED.items,
            subtotal = EXCLUDED.subtotal,
            discount = EXCLUDED.discount,
            grand_total = EXCLUDED.grand_total,
            paid_amount = EXCLUDED.paid_amount,
            due_amount = EXCLUDED.due_amount,
            payment_method = EXCLUDED.payment_method,
            status = EXCLUDED.status;
        `);
      });
    }

    // Sync Accounting
    if (Array.isArray(body.accounting)) {
      body.accounting.forEach(a => {
        tasks.push(sql`
          INSERT INTO accounting (id, entry_date, entry_type, category, amount, note)
          VALUES (${a.id}, ${a.date}, ${a.type}, ${a.category}, ${a.amount}, ${a.note || null})
          ON CONFLICT (id) DO UPDATE SET
            entry_type = EXCLUDED.entry_type,
            category = EXCLUDED.category,
            amount = EXCLUDED.amount,
            note = EXCLUDED.note;
        `);
      });
    }

    // Sync Batch Sales
    if (Array.isArray(body.batchSales)) {
      body.batchSales.forEach(bs => {
        tasks.push(sql`
          INSERT INTO batch_sales (id, flock_id, sale_date, buyer_name, bird_qty, total_weight, price_per_kg, total_amount)
          VALUES (${bs.id}, ${bs.flockId}, ${bs.date}, ${bs.buyerName}, ${bs.birdQty}, ${bs.totalWeight}, ${bs.pricePerKg}, ${bs.totalAmount})
          ON CONFLICT (id) DO UPDATE SET
            buyer_name = EXCLUDED.buyer_name,
            bird_qty = EXCLUDED.bird_qty,
            total_weight = EXCLUDED.total_weight,
            price_per_kg = EXCLUDED.price_per_kg,
            total_amount = EXCLUDED.total_amount;
        `);
      });
    }

    // Sync Batch Expenses
    if (Array.isArray(body.batchExpenses)) {
      body.batchExpenses.forEach(be => {
        tasks.push(sql`
          INSERT INTO batch_expenses (id, flock_id, exp_date, category, amount, note)
          VALUES (${be.id}, ${be.flockId}, ${be.date}, ${be.category}, ${be.amount}, ${be.note || null})
          ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            amount = EXCLUDED.amount,
            note = EXCLUDED.note;
        `);
      });
    }

    // Sync POS Authorized Emails
    if (Array.isArray(body.posAuthorizedEmails)) {
      body.posAuthorizedEmails.forEach(pe => {
        tasks.push(sql`
          INSERT INTO pos_authorized_emails (id, email, name, role, status, added_date)
          VALUES (${pe.id}, ${pe.email}, ${pe.name}, ${pe.role}, ${pe.status}, ${pe.addedDate})
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            status = EXCLUDED.status;
        `);
      });
    }

    // Run all tasks concurrently
    await Promise.all(tasks);

    return NextResponse.json({ success: true, message: 'Synced state to Neon PostgreSQL successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Database sync failed';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

