// js/accounting.js - Double-Entry Ledger System

export const ledgerSystem = {
    accounts: [], // id, code, name, type (Asset, Liability, Equity, Revenue, Expense)
    journals: [], // id, date, description, entries: [{accountId, debit, credit}]
};

// Double-Entry validation
export function recordJournalEntry(date, description, entries) {
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(e => {
        totalDebit += e.debit || 0;
        totalCredit += e.credit || 0;
    });

    if (totalDebit !== totalCredit) {
        console.error("Double Entry Violation: Debits do not equal Credits.");
        window.showToast("Accounting Error: Journal out of balance.", "error");
        return false;
    }

    const journal = {
        id: `JRN-${Date.now()}`,
        date,
        description,
        entries,
        timestamp: new Date()
    };

    // Save to Firebase logic would sit here
    ledgerSystem.journals.push(journal);
    console.log(`Journal ${journal.id} recorded.`);
    return true;
}

// Generate Trial Balance from Journals
export function generateTrialBalance() {
    let balances = {};

    ledgerSystem.journals.forEach(j => {
        j.entries.forEach(e => {
            if (!balances[e.accountId]) balances[e.accountId] = { debit: 0, credit: 0 };
            balances[e.accountId].debit += e.debit || 0;
            balances[e.accountId].credit += e.credit || 0;
        });
    });

    // Formatting output UI 
    return Object.keys(balances).map(id => {
        let name = ledgerSystem.accounts.find(a => a.id === id)?.name || id;
        let diff = balances[id].debit - balances[id].credit;
        let finalDebit = diff > 0 ? diff : 0;
        let finalCredit = diff < 0 ? Math.abs(diff) : 0;

        return { accountId: id, name, debit: finalDebit, credit: finalCredit };
    });
}
