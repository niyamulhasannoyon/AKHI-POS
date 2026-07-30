import re

def main():
    with open('/Users/niyamulhasan/Desktop/Code/AKHI POS/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    js_code = """
        // --- ADDED BY PATCH ---
        window.addAccountingEntry = async function() {
            const desc = document.getElementById('acc-desc').value.trim();
            const type = document.getElementById('acc-type').value;
            const amount = parseFloat(document.getElementById('acc-amount').value) || 0;
            if(!desc || amount <= 0) { showToast("Invalid input", "error"); return; }
            try {
                await addDoc(accountingCollection, { desc, type, amount, timestamp: serverTimestamp() });
                document.getElementById('acc-desc').value = '';
                document.getElementById('acc-amount').value = '';
                showToast("Accounting entry added");
            } catch(e) { console.error(e); showToast("Error", "error"); }
        };

        window.renderAccountingUI = function() {
            const tb = document.getElementById('acc-table-body');
            if(!tb) return;
            let inc = 0, exp = 0;
            tb.innerHTML = '';
            const sorted = [...accountingEntries].sort((a,b)=> (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            sorted.forEach(a => {
                if(a.type === 'income') inc += a.amount; else exp += a.amount;
                const d = a.timestamp ? new Date(a.timestamp.seconds*1000).toLocaleDateString('en-GB') : '-';
                const color = a.type === 'income' ? 'text-emerald-400' : 'text-red-400';
                tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-400">${d}</td><td class="py-2 text-sm text-gray-200">${a.desc}</td><td class="py-2 text-sm text-gray-400 uppercase">${a.type}</td><td class="py-2 text-right text-sm font-bold ${color}">৳${a.amount}</td><td class="py-2 text-right"><button onclick="deleteDoc(doc(accountingCollection, '${a.id}'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button></td></tr>`;
            });
            document.getElementById('acc-total-income').innerText = `৳${inc.toLocaleString()}`;
            document.getElementById('acc-total-expense').innerText = `৳${exp.toLocaleString()}`;
            if(document.getElementById('acc-total-balance')) {
                 document.getElementById('acc-total-balance').innerText = `৳${(inc - exp).toLocaleString()}`;
            }
        };

        window.addExpenditureEntry = async function() {
            const cat = document.getElementById('exp-category').value.trim();
            const desc = document.getElementById('exp-desc').value.trim();
            const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
            if(!cat || !desc || amount <= 0) { showToast("Invalid input", "error"); return; }
            try {
                await addDoc(expendituresCollection, { category: cat, desc, amount, timestamp: serverTimestamp() });
                document.getElementById('exp-category').value = '';
                document.getElementById('exp-desc').value = '';
                document.getElementById('exp-amount').value = '';
                showToast("Expenditure saved");
            } catch(e) { console.error(e); }
        };

        window.renderExpenditureUI = function() {
            const tb = document.getElementById('exp-table-body');
            if(!tb) return;
            tb.innerHTML = '';
            const sorted = [...expenditures].sort((a,b)=> (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            sorted.forEach(e => {
                const d = e.timestamp ? new Date(e.timestamp.seconds*1000).toLocaleDateString('en-GB') : '-';
                tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-400">${d}</td><td class="py-2 text-sm text-gray-200">${e.category}</td><td class="py-2 text-sm text-gray-300">${e.desc}</td><td class="py-2 text-right text-sm font-bold text-white">৳${e.amount}</td><td class="py-2 text-right"><button onclick="deleteDoc(doc(expendituresCollection, '${e.id}'))" class="text-red-400 text-xs hover:text-red-300">Del</button></td></tr>`;
            });
        };

        window.addInstallmentEntry = async function() {
            const party = document.getElementById('inst-party').value.trim();
            const amount = parseFloat(document.getElementById('inst-amount').value) || 0;
            const dateStr = document.getElementById('inst-date').value;
            const status = document.getElementById('inst-status').value;
            if(!party || amount <= 0 || !dateStr) return;
            try {
                await addDoc(installmentsCollection, { party, amount, dueDate: dateStr, status });
                document.getElementById('inst-party').value = '';
                document.getElementById('inst-amount').value = '';
                showToast("Installment added");
            } catch(e) { console.error(e); }
        };

        window.renderInstallmentsUI = function() {
             const tb = document.getElementById('inst-table-body');
             if(!tb) return;
             tb.innerHTML = '';
             installments.forEach(i => {
                 const col = i.status === 'paid' ? 'text-emerald-400' : 'text-orange-400';
                 tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-300">${i.dueDate}</td><td class="py-2 text-sm font-bold text-white">${i.party}</td><td class="py-2 text-right text-sm text-gray-200">৳${i.amount}</td><td class="py-2 text-sm font-medium ${col} uppercase">${i.status}</td><td class="py-2 text-right"><button class="text-xs text-blue-400 mr-2" onclick="toggleInstStatus('${i.id}', '${i.status}')">Toggle</button> <button class="text-xs text-red-400" onclick="deleteDoc(doc(installmentsCollection, '${i.id}'))">Del</button></td></tr>`;
             });
        };
        window.toggleInstStatus = async function(id, cur) {
             const ns = cur === 'paid' ? 'pending' : 'paid';
             await updateDoc(doc(installmentsCollection, id), { status: ns });
        };

        window.addEmployeeEntry = async function() {
            const name = document.getElementById('emp-name').value.trim();
            const role = document.getElementById('emp-role').value.trim();
            const salary = parseFloat(document.getElementById('emp-salary').value) || 0;
            if(!name || !role) return;
            await addDoc(employeesCollection, { name, role, salary, joined: new Date().toLocaleDateString('en-GB') });
            document.getElementById('emp-name').value = '';
            document.getElementById('emp-role').value = '';
            document.getElementById('emp-salary').value = '';
            showToast("Employee added");
        };

        window.renderEmployeeUI = function() {
             const tb = document.getElementById('emp-table-body');
             if(!tb) return;
             tb.innerHTML = '';
             employees.forEach(e => {
                  tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm font-bold text-white">${e.name}</td><td class="py-2 text-sm text-gray-400">${e.role}</td><td class="py-2 border-r border-white/10 pr-3 text-sm text-gray-500">${e.joined}</td><td class="py-2 pl-3 text-right text-sm text-white font-mono">৳${e.salary}</td><td class="py-2 text-right"><button class="text-xs text-red-400" onclick="deleteDoc(doc(employeesCollection, '${e.id}'))">Remove</button></td></tr>`;
             });
        };

        window.addQuotationEntry = async function() {
             const client = document.getElementById('quote-client').value.trim();
             const items = document.getElementById('quote-items').value.trim();
             const amt = parseFloat(document.getElementById('quote-amount').value) || 0;
             if(!client || !items) return;
             await addDoc(quotationsCollection, { client, items, amount: amt, timestamp: serverTimestamp() });
             document.getElementById('quote-client').value = '';
             document.getElementById('quote-items').value = '';
             document.getElementById('quote-amount').value = '';
        };

        window.renderQuotationsUI = function() {
             const tb = document.getElementById('quote-table-body');
             if(!tb) return;
             tb.innerHTML = '';
             const sorted = [...quotations].sort((a,b)=> (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
             sorted.forEach(q => {
                  const d = q.timestamp ? new Date(q.timestamp.seconds*1000).toLocaleDateString('en-GB') : '-';
                  tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-400">${d}</td><td class="py-2 font-bold text-white text-sm">${q.client}</td><td class="py-2 text-xs text-gray-300">${q.items}</td><td class="py-2 text-right font-medium text-purple-400 text-sm">৳${q.amount}</td><td class="py-2 text-right"><button onclick="deleteDoc(doc(quotationsCollection, '${q.id}'))" class="text-xs text-red-400">Del</button></td></tr>`;
             });
        };

        window.addFileEntry = async function(input) {
            if(!input.files || input.files.length === 0) return;
            const file = input.files[0];
            await addDoc(filesDataCollection, { name: file.name, size: file.size, type: file.type, date: new Date().toLocaleDateString('en-GB') });
            input.value = '';
            showToast("File meta saved");
        };

        window.renderFilesUI = function() {
            const g = document.getElementById('file-grid');
            if(!g) return;
            g.innerHTML = '';
            filesData.forEach(f => {
                const s = (f.size / 1024).toFixed(1) + ' KB';
                g.innerHTML += `<div class="bg-gray-900/50 p-4 rounded-xl border border-white/5 relative group">
                    <button class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onclick="deleteDoc(doc(filesDataCollection, '${f.id}'))">&times;</button>
                    <svg class="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <p class="text-sm font-medium text-gray-200 truncate w-full" title="${f.name}">${f.name}</p>
                    <p class="text-xs text-gray-500">${s} &bull; ${f.date}</p>
                </div>`;
            });
        };
        // --- END ADDED BY PATCH ---
    """
    
    # We will insert `js_code` just before `</script>` ending the module
    # We can search from the end for `</script>`
    if "// --- ADDED BY PATCH ---" not in html:
        blocks = html.rsplit('</script>', 1)
        if len(blocks) == 2:
            html = blocks[0] + js_code + "\n    </script>" + blocks[1]
            with open('/Users/niyamulhasan/Desktop/Code/AKHI POS/index.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("Successfully injected JS.")

if __name__ == '__main__':
    main()
