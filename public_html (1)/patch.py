import re

def main():
    with open('/Users/niyamulhasan/Desktop/Code/AKHI POS/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update Global State definition with new Collections
    if "employeesCollection" not in html:
        state_match = re.search(r'(// --- GLOBAL STATE ---.*?let\s+.*?sales\s*=\s*\[\].*?;)', html, re.DOTALL)
        if state_match:
            old_state = state_match.group(1)
            new_state = old_state + "\n        let accountingEntries=[], expenditures=[], installments=[], employees=[], quotations=[], filesData=[];\n        let accountingCollection, expendituresCollection, installmentsCollection, employeesCollection, quotationsCollection, filesDataCollection;"
            html = html.replace(old_state, new_state)

        # 2. Add to Firebase Listeners
        init_pos = html.find('khamariCollection = collection(db, `${basePath}/khamari_entries`);')
        if init_pos != -1:
            new_collections = """khamariCollection = collection(db, `${basePath}/khamari_entries`);
                accountingCollection = collection(db, `${basePath}/accounting`);
                expendituresCollection = collection(db, `${basePath}/expenditures`);
                installmentsCollection = collection(db, `${basePath}/installments`);
                employeesCollection = collection(db, `${basePath}/employees`);
                quotationsCollection = collection(db, `${basePath}/quotations`);
                filesDataCollection = collection(db, `${basePath}/files_data`);"""
            html = html.replace('khamariCollection = collection(db, `${basePath}/khamari_entries`);', new_collections)

        listener_pos = html.find('onSnapshot(query(khamariCollection),')
        if listener_pos != -1:
            new_listeners = """onSnapshot(query(accountingCollection), (snapshot) => { try { accountingEntries = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); if(typeof renderAccountingUI==='function') renderAccountingUI(); } catch (e){} });
                onSnapshot(query(expendituresCollection), (snapshot) => { try { expenditures = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); if(typeof renderExpenditureUI==='function') renderExpenditureUI(); } catch (e){} });
                onSnapshot(query(installmentsCollection), (snapshot) => { try { installments = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); if(typeof renderInstallmentsUI==='function') renderInstallmentsUI(); } catch (e){} });
                onSnapshot(query(employeesCollection), (snapshot) => { try { employees = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); if(typeof renderEmployeeUI==='function') renderEmployeeUI(); } catch (e){} });
                onSnapshot(query(quotationsCollection), (snapshot) => { try { quotations = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); if(typeof renderQuotationsUI==='function') renderQuotationsUI(); } catch (e){} });
                onSnapshot(query(filesDataCollection), (snapshot) => { try { filesData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); if(typeof renderFilesUI==='function') renderFilesUI(); } catch (e){} });
                onSnapshot(query(khamariCollection),"""
            html = html.replace('onSnapshot(query(khamariCollection),', new_listeners)

    # 3. Replace Accounting View
    accounting_old = re.search(r'<!-- Accounting View -->.*?</div>\s*</div>', html, re.DOTALL)
    if accounting_old:
        accounting_new = """<!-- Accounting View -->
        <div id="accounting-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8">
            <h2 class="text-3xl font-extrabold text-white mb-8">Accounting Hub</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="glass-card p-6 rounded-2xl relative overflow-hidden text-center justify-center flex flex-col items-center group">
                    <p class="text-sm font-medium text-gray-400">Total Income</p>
                    <h3 class="text-3xl font-bold text-emerald-400 mt-2" id="acc-total-income">৳0</h3>
                </div>
                <div class="glass-card p-6 rounded-2xl relative overflow-hidden text-center justify-center flex flex-col items-center group">
                    <p class="text-sm font-medium text-gray-400">Total Expense</p>
                    <h3 class="text-3xl font-bold text-red-400 mt-2" id="acc-total-expense">৳0</h3>
                </div>
            </div>
            <div class="glass-card p-6 rounded-2xl col-span-1 lg:col-span-2">
                <div class="flex flex-wrap gap-2 mb-4">
                    <input type="text" id="acc-desc" class="flex-1 min-w-[200px] ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Description/Note">
                    <select id="acc-type" class="ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10">
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                    <input type="number" id="acc-amount" class="w-full md:w-32 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Amount">
                    <button onclick="addAccountingEntry()" class="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:from-emerald-400 hover:to-emerald-500">Save</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead><tr class="text-gray-400 text-sm border-b border-white/10"><th class="pb-3">Date</th><th class="pb-3">Note</th><th class="pb-3">Type</th><th class="pb-3 text-right">Amount</th><th class="pb-3 text-right p-3">Action</th></tr></thead>
                        <tbody id="acc-table-body" class="text-gray-300"></tbody>
                    </table>
                </div>
            </div>
        </div>"""
        html = html.replace(accounting_old.group(0), accounting_new)

    # 4. Expenditure View 
    expenditure_old = re.search(r'<!-- Expenditure View -->.*?</div>\s*</div>', html, re.DOTALL)
    if expenditure_old:
        expenditure_new = """<!-- Expenditure View -->
        <div id="expenditure-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8">
            <h2 class="text-3xl font-extrabold text-white mb-8">Expenditures</h2>
            <div class="glass-card p-6 rounded-2xl mb-6">
                <div class="flex flex-wrap gap-2 mb-4">
                    <input type="text" id="exp-category" class="ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Category (e.g. Utility, Transport)">
                    <input type="text" id="exp-desc" class="flex-1 min-w-[200px] ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Description">
                    <input type="number" id="exp-amount" class="w-full md:w-32 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Amount">
                    <button onclick="addExpenditureEntry()" class="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg font-medium">Record</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead><tr class="text-gray-400 text-sm border-b border-white/10"><th class="pb-3">Date</th><th class="pb-3">Category</th><th class="pb-3">Description</th><th class="pb-3 text-right">Amount</th><th class="pb-3 text-right"></th></tr></thead>
                        <tbody id="exp-table-body" class="text-gray-300"></tbody>
                    </table>
                </div>
            </div>
        </div>"""
        html = html.replace(expenditure_old.group(0), expenditure_new)

    # 5. Loan / Installment View
    loan_old = re.search(r'<!-- Loan View -->.*?</div>\s*</div>', html, re.DOTALL)
    if loan_old:
        loan_new = """<!-- Loan View -->
        <div id="loan-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8">
            <h2 class="text-3xl font-extrabold text-white mb-8">Installments & Loans</h2>
            <div class="glass-card p-6 rounded-2xl mb-6">
                <div class="flex flex-wrap gap-2 mb-4">
                    <input type="text" id="inst-party" class="flex-1 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Party / Bank Name">
                    <input type="number" id="inst-amount" class="w-full md:w-32 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Installment Amount">
                    <input type="date" id="inst-date" class="w-full md:w-40 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10">
                    <select id="inst-status" class="ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                    </select>
                    <button onclick="addInstallmentEntry()" class="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">Add</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead><tr class="text-gray-400 text-sm border-b border-white/10"><th class="pb-3">Date Due</th><th class="pb-3">Party</th><th class="pb-3 text-right">Amount</th><th class="pb-3">Status</th><th class="pb-3"></th></tr></thead>
                        <tbody id="inst-table-body" class="text-gray-300"></tbody>
                    </table>
                </div>
            </div>
        </div>"""
        html = html.replace(loan_old.group(0), loan_new)

    # 6. Analytics View
    analytics_old = re.search(r'<!-- Analytics View -->.*?</div>\s*</div>', html, re.DOTALL)
    if analytics_old:
         analytics_new = """<!-- Analytics View -->
        <div id="analytics-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8">
            <h2 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-8">Advanced Analytics</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="glass-card p-6 justify-center flex flex-col items-center">
                    <h3 class="text-xl font-bold text-white mb-2">Monthly Overview</h3>
                    <p class="text-sm text-gray-400 mb-4">Performance across collections</p>
                    <canvas id="advAnalyticsChart" class="w-full" style="max-height: 250px;"></canvas>
                </div>
                <div class="glass-card p-6">
                    <h3 class="text-xl font-bold text-white mb-4">Key Metrics</h3>
                    <ul class="space-y-4 text-gray-300">
                        <li class="flex justify-between border-b border-white/5 pb-2"><span>Total POS Sales:</span><span class="font-bold text-emerald-400" id="stat-pos-sales">৳0</span></li>
                        <li class="flex justify-between border-b border-white/5 pb-2"><span>Total Chicken Sales:</span><span class="font-bold text-blue-400" id="stat-chk-sales">৳0</span></li>
                        <li class="flex justify-between border-b border-white/5 pb-2"><span>Total Purchases:</span><span class="font-bold text-red-400" id="stat-purchases">৳0</span></li>
                        <li class="flex justify-between border-b border-white/5 pb-2"><span>Feed/Supply Due:</span><span class="font-bold text-orange-400" id="stat-feed-due">৳0</span></li>
                    </ul>
                </div>
            </div>
        </div>"""
         html = html.replace(analytics_old.group(0), analytics_new)

    # 7. Quotation View
    quotation_old = re.search(r'<!-- Quotation View -->.*?</div>\s*</div>', html, re.DOTALL)
    if quotation_old:
         quotation_new = """<!-- Quotation View -->
        <div id="quotation-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8">
            <h2 class="text-3xl font-extrabold text-white mb-8">Quotations</h2>
            <div class="glass-card p-6 rounded-2xl mb-6">
                <div class="flex flex-wrap gap-2 mb-4">
                    <input type="text" id="quote-client" class="flex-1 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Client Name">
                    <input type="text" id="quote-items" class="flex-1 min-w-[200px] ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Items Details">
                    <input type="number" id="quote-amount" class="w-full md:w-32 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Amount">
                    <button onclick="addQuotationEntry()" class="w-full md:w-auto bg-purple-600 text-white px-6 py-2 rounded-lg font-medium">Create</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead><tr class="text-gray-400 text-sm border-b border-white/10"><th class="pb-3">Date</th><th class="pb-3">Client</th><th class="pb-3">Details</th><th class="pb-3 text-right">Est. Amount</th><th class="pb-3"></th></tr></thead>
                        <tbody id="quote-table-body" class="text-gray-300"></tbody>
                    </table>
                </div>
            </div>
        </div>"""
         html = html.replace(quotation_old.group(0), quotation_new)

    # 8. File Explorer
    filexp_old = re.search(r'<!-- FileManager View -->.*?</div>\s*</div>', html, re.DOTALL)
    if filexp_old:
         filexp_new = """<!-- FileManager View -->
        <div id="filemanager-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8">
            <h2 class="text-3xl font-extrabold text-white mb-8">File Explorer</h2>
            <div class="glass-card p-6 rounded-2xl mb-6">
                 <div class="flex gap-4 items-center border-2 border-dashed border-white/20 p-8 rounded-xl justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onclick="document.getElementById('file-upload').click()">
                    <div>
                        <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <p class="text-gray-400">Click to attach file metadata</p>
                        <p class="text-xs text-gray-500 mt-1">(Only saves metadata tracking to database)</p>
                    </div>
                    <input type="file" id="file-upload" class="hidden" onchange="addFileEntry(this)">
                 </div>
                 <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4" id="file-grid">
                 </div>
            </div>
        </div>"""
         html = html.replace(filexp_old.group(0), filexp_new)

    # 9. Employee View
    if 'id="user-view"' in html:
        emp_old = re.search(r'<!-- User/Role View -->.*?</div>\s*</div>', html, re.DOTALL)
        if emp_old:
            emp_new = """<!-- User/Role View -->
            <div id="user-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8">
                <h2 class="text-3xl font-extrabold text-white mb-8">Employee Management</h2>
                <div class="glass-card p-6 rounded-2xl mb-6">
                    <div class="flex flex-wrap gap-2 mb-4">
                        <input type="text" id="emp-name" class="flex-1 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Employee Name">
                        <input type="text" id="emp-role" class="flex-1 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Role (e.g. Manager)">
                        <input type="number" id="emp-salary" class="w-full md:w-32 ai-input bg-gray-900/50 text-white rounded-lg px-4 py-2 border border-white/10" placeholder="Salary">
                        <button onclick="addEmployeeEntry()" class="w-full md:w-auto bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2 rounded-lg font-medium">Add Employee</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead><tr class="text-gray-400 text-sm border-b border-white/10"><th class="pb-3">Name</th><th class="pb-3">Role</th><th class="pb-3 border-r border-white/10 pr-3">Joined</th><th class="pb-3 pl-3 text-right">Base Salary</th><th class="pb-3"></th></tr></thead>
                            <tbody id="emp-table-body" class="text-gray-300"></tbody>
                        </table>
                    </div>
                </div>
            </div>"""
            html = html.replace(emp_old.group(0), emp_new)


    with open('/Users/niyamulhasan/Desktop/Code/AKHI POS/index.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    main()
