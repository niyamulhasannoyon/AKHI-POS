import re
import sys

def main():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Part 1: Duplicate Checks
    
    # 1. Product Duplicate Check
    prod_add = html.find('const f = e.target;\n            await addDoc(productsCollection')
    if prod_add != -1:
        new_prod_add = """const f = e.target;
            const nameCheck = f['p-name'].value.trim().toLowerCase();
            if(products.some(p => p.name.toLowerCase() === nameCheck)) {
                showToast("Product already exists!", "error");
                return;
            }
            await addDoc(productsCollection"""
        html = html.replace('const f = e.target;\n            await addDoc(productsCollection', new_prod_add)

    # 2. Customer Duplicate Check
    cust_add = html.find('e.preventDefault();\n            await addDoc(customersCollection, {')
    if cust_add != -1:
        new_cust_add = """e.preventDefault();
            const phoneCheck = e.target['c-phone'].value.trim();
            if(customers.some(c => c.phone === phoneCheck)) {
                showToast("Customer with this phone already exists!", "error");
                return;
            }
            await addDoc(customersCollection, {"""
        html = html.replace('e.preventDefault();\n            await addDoc(customersCollection, {', new_cust_add)
        
    # 3. Khamar Duplicate Check
    khamar_add = html.find('if (n) {\n                await addDoc(khamarsCollection, { name: n });')
    if khamar_add != -1:
        new_khamar_add = """if (n) {
                if(khamars.some(k => k.name.toLowerCase() === n.toLowerCase())) {
                    showToast("Khamar already exists!", "error");
                    return;
                }
                await addDoc(khamarsCollection, { name: n });"""
        html = html.replace('if (n) {\n                await addDoc(khamarsCollection, { name: n });', new_khamar_add)

    # Part 2: Generic Edit functionality
    # Add Modal HTML
    if "generic-edit-modal" not in html:
        modal_html = """
    <!-- Generic Edit Modal -->
    <div id="generic-edit-modal" class="modal-container hidden fixed inset-0 z-[100] items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="glass-panel w-full max-w-lg rounded-2xl shadow-2xl relative border border-white/10 flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <h2 class="text-xl font-bold text-white uppercase tracking-wider">Edit Record</h2>
                <button onclick="hideModal('generic-edit-modal')" class="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">&times;</button>
            </div>
            <div id="generic-edit-form-container" class="p-6 space-y-4 overflow-y-auto grow">
                <!-- Dynamic inputs will be generated here -->
            </div>
            <div class="p-6 border-t border-white/10 bg-white/5 flex gap-3 justify-end shrink-0">
                <button onclick="hideModal('generic-edit-modal')" class="px-6 py-2 rounded-lg text-gray-300 hover:text-white font-medium hover:bg-white/5 transition-colors">Cancel</button>
                <button id="generic-edit-save-btn" class="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-600/20">Update</button>
            </div>
        </div>
    </div>
"""
        # Insert modal before closing body
        html = html.replace('</body>', modal_html + '\n</body>')

    # Add Edit JS Logic
    if "async function updateGenericRecord" not in html:
        js_logic = """
        // Generic Edit Logic
        let currentEditConfig = null;
        window.openGenericEdit = function(collectionName, id, objStateArray) {
            const dataState = Array.isArray(objStateArray) ? objStateArray : window[objStateArray];
            let item;
            
            // Special handling for dictionary/object states or finding the right item
            try {
               item = dataState.find(x => x.id === id);
            } catch(e) { console.error("Could not find array", objStateArray); return; }

            if (!item) {
                showToast("Item not found", "error"); return; 
            }

            currentEditConfig = { collectionRefName: collectionName, id: id, originalItem: item };
            const container = document.getElementById('generic-edit-form-container');
            container.innerHTML = '';

            // Generate inputs based on object keys (skipping id, timestamp, etc)
            Object.keys(item).forEach(key => {
                if(['id', 'timestamp', 'date', 'items', 'status'].includes(key)) return; // Skip read-only or complex fields for now

                const val = item[key];
                const type = typeof val === 'number' ? 'number' : 'text';
                
                container.innerHTML += `
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">${key}</label>
                        <input type="${type}" id="edit-field-${key}" value="${val}" class="input-field" ${type === 'number' ? 'step="any"' : ''} />
                    </div>
                `;
            });

            // Special case for timestamp/date to not break queries but let users fix simple string dates
            if(item.date && typeof item.date === 'string') {
                 container.innerHTML += `
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">date</label>
                        <input type="text" id="edit-field-date" value="${item.date}" class="input-field" />
                    </div>
                `;
            }

            document.getElementById('generic-edit-save-btn').onclick = async () => {
                const updates = {};
                Object.keys(item).forEach(key => {
                    const el = document.getElementById(`edit-field-${key}`);
                    if (el) {
                        let newVal = el.value;
                        if (typeof item[key] === 'number') newVal = parseFloat(newVal);
                        updates[key] = newVal;
                    }
                });
                
                try {
                    const colRef = eval(currentEditConfig.collectionRefName); // Get collection reference
                    document.getElementById('generic-edit-save-btn').innerText = "Saving...";
                    await updateDoc(doc(colRef, currentEditConfig.id), updates);
                    showToast("Updated successfully");
                    hideModal('generic-edit-modal');
                } catch(e) {
                    console.error("Update failed", e);
                    showToast("Failed to update", "error");
                } finally {
                    document.getElementById('generic-edit-save-btn').innerText = "Update";
                }
            };

            showModal('generic-edit-modal');
        };
        """
        # Insert JS logic after undo setup
        html = html.replace('async function undoLastDelete() {', js_logic + '\n        async function undoLastDelete() {')


    # 3. Add Edit buttons to tables
    
    # helper replacements
    def add_edit_btn(html_str, find_str, inject_str):
        if find_str in html_str and inject_str not in html_str:
            return html_str.replace(find_str, inject_str + find_str)
        return html_str

    # Product
    html = html.replace('<button class="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20" onclick="handleDeleteProduct(\'${p.id}\')">Del</button>',
                        '<button class="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded mr-1 hover:bg-blue-500/20" onclick="openGenericEdit(\'productsCollection\', \'${p.id}\', \'products\')">Edit</button><button class="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20" onclick="handleDeleteProduct(\'${p.id}\')">Del</button>')
                        
    # Customer
    html = html.replace('<button onclick="handleDeleteCustomer(\'${c.id}\')" class="text-xs text-red-400 px-3 py-1 bg-red-500/10 rounded hover:bg-red-500/20">Delete</button>',
                        '<button onclick="openGenericEdit(\'customersCollection\', \'${c.id}\', \'customers\')" class="text-xs text-blue-400 px-3 py-1 bg-blue-500/10 rounded hover:bg-blue-500/20 mr-2">Edit</button><button onclick="handleDeleteCustomer(\'${c.id}\')" class="text-xs text-red-400 px-3 py-1 bg-red-500/10 rounded hover:bg-red-500/20">Delete</button>')

    # Khamar
    html = html.replace('<button class="text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded hover:bg-red-500/20" onclick="handleDeleteKhamar(\'${k.id}\')">Delete</button>',
                        '<button class="text-xs text-blue-400 px-2 py-1 bg-blue-500/10 rounded mr-2 hover:bg-blue-500/20" onclick="openGenericEdit(\'khamarsCollection\', \'${k.id}\', \'khamars\')">Edit</button><button class="text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded hover:bg-red-500/20" onclick="handleDeleteKhamar(\'${k.id}\')">Delete</button>')

    # Chicken Sales Table
    html = html.replace('<button onclick="handleDeleteChickenSale(\'${s.id}\')" class="text-red-400 text-xs mt-1 hover:text-red-300">Delete</button>',
                        '<button onclick="openGenericEdit(\'chickenSalesCollection\', \'${s.id}\', \'chickenSales\')" class="text-blue-400 text-xs mt-1 mr-2 hover:text-blue-300">Edit</button><button onclick="handleDeleteChickenSale(\'${s.id}\')" class="text-red-400 text-xs mt-1 hover:text-red-300">Delete</button>')

    # Feed Entries
    html = html.replace('<button onclick="handleDeleteFeed(\'${e.id}\')" class="text-red-400 hover:text-red-300 mr-2">Del</button>',
                        '<button onclick="openGenericEdit(\'feedCollection\', \'${e.id}\', \'feedEntries\')" class="text-blue-400 hover:text-blue-300 mr-2">Edit</button><button onclick="handleDeleteFeed(\'${e.id}\')" class="text-red-400 hover:text-red-300 mr-2">Del</button>')

    # Purchases Table
    html = html.replace('<button class="text-red-400 hover:text-red-300 text-sm ml-2" onclick="handleDeletePurchase(\'${p.id}\')"><svg',
                        '<button class="text-blue-400 hover:text-blue-300 text-sm" onclick="openGenericEdit(\'purchaseCollection\', \'${p.id}\', \'purchases\')">Edit</button><button class="text-red-400 hover:text-red-300 text-sm ml-2" onclick="handleDeletePurchase(\'${p.id}\')"><svg')

    # Khamari Entries
    # `khamariEntries` mapped to `khamariCollection`
    html = html.replace('<button onclick="deleteDoc(doc(khamariCollection, \'${e.id}\'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button>',
                        '<button onclick="openGenericEdit(\'khamariCollection\', \'${e.id}\', \'khamariEntries\')" class="text-blue-400 hover:text-blue-300 text-xs mr-2">Edit</button><button onclick="deleteDoc(doc(khamariCollection, \'${e.id}\'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button>')

    # Feed Gura Mgmt
    # `feedGuraEntries` mapped to `feedGuraCollection`
    html = html.replace('<button onclick="deleteDoc(doc(feedGuraCollection, \'${e.id}\'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button>',
                        '<button onclick="openGenericEdit(\'feedGuraCollection\', \'${e.id}\', \'feedGuraEntries\')" class="text-blue-400 hover:text-blue-300 text-xs mr-2">Edit</button><button onclick="deleteDoc(doc(feedGuraCollection, \'${e.id}\'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button>')

    # Accounting
    html = html.replace('<button onclick="deleteDoc(doc(accountingCollection, \'${a.id}\'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button>',
                        '<button onclick="openGenericEdit(\'accountingCollection\', \'${a.id}\', \'accountingEntries\')" class="text-blue-400 hover:text-blue-300 text-xs mr-2">Edit</button><button onclick="deleteDoc(doc(accountingCollection, \'${a.id}\'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button>')

    # Expenditure
    html = html.replace('<button onclick="deleteDoc(doc(expendituresCollection, \'${e.id}\'))" class="text-red-400 text-xs hover:text-red-300">Del</button>',
                        '<button onclick="openGenericEdit(\'expendituresCollection\', \'${e.id}\', \'expenditures\')" class="text-blue-400 text-xs mr-2 hover:text-blue-300">Edit</button><button onclick="deleteDoc(doc(expendituresCollection, \'${e.id}\'))" class="text-red-400 text-xs hover:text-red-300">Del</button>')

    # Installments
    html = html.replace('<button class="text-xs text-red-400" onclick="deleteDoc(doc(installmentsCollection, \'${i.id}\'))">Del</button>',
                        '<button class="text-xs text-blue-400 mr-2" onclick="openGenericEdit(\'installmentsCollection\', \'${i.id}\', \'installments\')">Edit</button><button class="text-xs text-red-400" onclick="deleteDoc(doc(installmentsCollection, \'${i.id}\'))">Del</button>')

    # Employees
    html = html.replace('<button class="text-xs text-red-400" onclick="deleteDoc(doc(employeesCollection, \'${e.id}\'))">Remove</button>',
                        '<button class="text-xs text-blue-400 mr-2" onclick="openGenericEdit(\'employeesCollection\', \'${e.id}\', \'employees\')">Edit</button><button class="text-xs text-red-400" onclick="deleteDoc(doc(employeesCollection, \'${e.id}\'))">Remove</button>')

    # Quotations
    html = html.replace('<button onclick="deleteDoc(doc(quotationsCollection, \'${q.id}\'))" class="text-xs text-red-400">Del</button>',
                        '<button onclick="openGenericEdit(\'quotationsCollection\', \'${q.id}\', \'quotations\')" class="text-xs text-blue-400 mr-2">Edit</button><button onclick="deleteDoc(doc(quotationsCollection, \'${q.id}\'))" class="text-xs text-red-400">Del</button>')

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    main()
