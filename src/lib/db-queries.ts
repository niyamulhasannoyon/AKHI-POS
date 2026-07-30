import { getDbSql } from './db';
import { FarmState, Product, Customer, Supplier, Flock, KhamariLog, FeedIngredient, Sale, AccountingEntry, Loan, Installment, Employee, Setting } from './types';

export async function fetchFarmStateFromDb(): Promise<Partial<FarmState>> {
  const sql = getDbSql();

  const [settingsRows, flocks, products, khamariLogs, feedIngredients, customers, suppliers, salesRows, accountingRows, loansRows, installmentsRows, employeesRows] = await Promise.all([
    sql`SELECT * FROM settings WHERE id = 'default' LIMIT 1`,
    sql`SELECT id, name, breed, initial_qty AS "initialQty", current_qty AS "currentQty", start_date AS "startDate", age_days AS "ageDays", status, house_no AS "houseNo" FROM flocks ORDER BY id ASC`,
    sql`SELECT id, name, category, price::float, cost::float, stock::float, unit, min_stock::float AS "minStock" FROM products ORDER BY id ASC`,
    sql`SELECT id, flock_id AS "flockId", log_date::text AS "date", egg_good AS "eggGood", egg_damaged AS "eggDamaged", feed_bags::float AS "feedBags", mortality, temperature::float, notes FROM khamari_logs ORDER BY log_date DESC`,
    sql`SELECT id, name, stock_kg::float AS "stockKg", cost_per_kg::float AS "costPerKg" FROM feed_ingredients ORDER BY id ASC`,
    sql`SELECT id, name, phone, due::float, total_purchases::float AS "totalPurchases", address FROM customers ORDER BY id ASC`,
    sql`SELECT id, name, phone, balance::float, address FROM suppliers ORDER BY id ASC`,
    sql`SELECT id, sale_date::text AS "date", customer_id AS "customerId", customer_name AS "customerName", items, subtotal::float, discount::float, grand_total::float AS "grandTotal", paid_amount::float AS "paidAmount", due_amount::float AS "dueAmount", payment_method AS "paymentMethod", status FROM sales ORDER BY sale_date DESC`,
    sql`SELECT id, entry_date::text AS "date", entry_type AS "type", category, amount::float, note FROM accounting ORDER BY entry_date DESC`,
    sql`SELECT id, lender, amount::float, interest_rate::float AS "interestRate", emi::float, remaining::float, next_due_date::text AS "nextDueDate" FROM loans ORDER BY id ASC`,
    sql`SELECT id, customer_name AS "customerName", total_amount::float AS "totalAmount", paid_amount::float AS "paidAmount", remaining::float, installment_count AS "installmentCount", next_date::text AS "nextDate" FROM installments ORDER BY id ASC`,
    sql`SELECT id, name, role, salary::float, advance::float, status FROM employees ORDER BY id ASC`
  ]);

  const rawSettings = settingsRows[0] || {};
  const settings: Setting = {
    farmName: rawSettings.farm_name || 'Akhi Poultry Farm & Feed Mills',
    phone: rawSettings.phone || '+880 1700-000000',
    address: rawSettings.address || 'Khamar Road, Gazipur, Bangladesh',
    currency: rawSettings.currency || '৳',
    taxRate: Number(rawSettings.tax_rate) || 0,
    printerWidth: rawSettings.printer_width || '80mm',
    theme: rawSettings.theme || 'dark'
  };

  return {
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
    employees: employeesRows as Employee[]
  };
}
