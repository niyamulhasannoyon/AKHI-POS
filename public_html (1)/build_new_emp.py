import re

new_employee_html = """
        <!-- User View (Employee Management) -->
        <div id="user-view" class="main-view hidden h-full overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-gray-900 via-gray-900 to-black">
            <!-- Header section -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-white/10 pb-6">
                <div>
                    <h2 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 tracking-tight">
                        Employee Roster
                    </h2>
                    <p class="text-gray-400 text-sm mt-2 font-medium">Manage your team, track locations, and process payroll</p>
                </div>
                <div class="flex gap-3">
                    <button class="bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2" onclick="window.renderEmployeeUI()">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Sync Data
                    </button>
                    <button class="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex items-center gap-2" onclick="document.getElementById('add-employee-modal').classList.remove('hidden')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        New Employee
                    </button>
                </div>
            </div>

            <!-- Stats Overview -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Active Staff</p>
                            <p class="text-3xl font-black text-white" id="hr-stat-active">0</p>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-500/30 transition-all"></div>
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="p-3 bg-teal-500/20 rounded-xl text-teal-400">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Payroll Paid</p>
                            <p class="text-2xl font-black text-teal-400" id="hr-stat-paid">৳0</p>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6 rounded-2xl border border-white/5 relative overflow-hidden group lg:col-span-2">
                    <div class="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div class="flex justify-between items-center relative z-10">
                        <div>
                            <h3 class="font-bold text-white text-lg">Work Tracking Log</h3>
                            <p class="text-sm text-gray-400 font-medium">Daily & Monthly wage cycles</p>
                        </div>
                        <div class="flex gap-2">
                            <span class="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg border border-white/5">Auto-Calculating</span>
                            <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">Secure Offline Storage</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Employee Grid -->
            <div>
                <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div class="w-2 h-6 bg-teal-500 rounded-full"></div>
                    Staff Profiles
                </h3>
                <div id="employee-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <!-- Javascript will render employee cards here -->
                </div>
            </div>
        </div>
"""

new_modal_html = """
    <!-- Dark Add Employee Modal -->
    <div id="add-employee-modal" class="modal-container hidden fixed inset-0 z-50 items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div class="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                    </div>
                    Onboard New Staff
                </h3>
                <button type="button" class="close-modal text-gray-400 hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto custom-scrollbar">
                <form id="add-employee-form" class="space-y-6">
                    <!-- Photo & Basic Info -->
                    <div class="flex flex-col sm:flex-row gap-6 items-start">
                        <div class="w-32 h-32 rounded-2xl bg-gray-800 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-teal-500 transition-colors relative group shrink-0" onclick="document.getElementById('emp-image-upload').click()">
                            <img id="emp-image-preview" src="" class="hidden w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg class="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span class="text-[10px] text-white font-bold">Upload Photo</span>
                            </div>
                            <span id="emp-image-icon" class="text-xs text-gray-400 font-medium">No Photo</span>
                            <input type="file" id="emp-image-upload" accept="image/*" class="hidden" onchange="window.previewEmpImage(this)">
                        </div>
                        <div class="flex-1 space-y-4 w-full">
                            <div>
                                <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Full Name</label>
                                <input id="emp-name-input" class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-teal-500 outline-none transition-colors" required>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Designation</label>
                                    <input id="emp-designation-input" placeholder="e.g. Manager" class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-teal-500 outline-none transition-colors" required>
                                </div>
                                <div>
                                    <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Phone Number</label>
                                    <input id="emp-contact-input" placeholder="e.g. 017..." class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-teal-500 outline-none transition-colors" required>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Full Address</label>
                        <input id="emp-address-input" class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-teal-500 outline-none transition-colors" required>
                    </div>

                    <div class="p-5 bg-gray-800/50 border border-white/5 rounded-2xl grid grid-cols-2 gap-5">
                        <div class="col-span-2 md:col-span-1">
                            <label class="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Salary Configuration
                            </label>
                            <div class="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Type</label>
                                    <select id="emp-salary-type" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-white text-sm focus:border-emerald-500 outline-none">
                                        <option value="Monthly">Monthly</option>
                                        <option value="Daily">Daily</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Monthly Salary</label>
                                    <input id="emp-salary-amount" type="number" placeholder="৳" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-white text-sm font-mono focus:border-emerald-500 outline-none" required>
                                </div>
                            </div>
                            <p class="text-[10px] text-gray-500 mt-2">* Daily wages will be automatically derived as Monthly / 30.</p>
                        </div>
                        <div class="col-span-2 md:col-span-1">
                            <label class="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                Assignment
                            </label>
                            <div class="space-y-3 mt-3">
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Assigned Farm/Location</label>
                                    <input id="emp-farm-input" placeholder="e.g. Area 1" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-sm text-white focus:border-blue-500 outline-none" required>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Start Date</label>
                                    <input id="emp-start-date" type="date" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-sm text-white focus:border-blue-500 outline-none" required>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button type="button" class="close-modal px-6 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-bold text-sm">Cancel</button>
                        <button type="submit" class="px-6 py-2.5 bg-teal-500 text-gray-900 rounded-xl hover:bg-teal-400 shadow-lg shadow-teal-500/20 font-bold text-sm flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            Save Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Dark Edit Employee Modal -->
    <div id="edit-employee-modal" class="modal-container hidden fixed inset-0 z-50 items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div class="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </div>
                    Update Staff Profile
                </h3>
                <button type="button" class="close-modal text-gray-400 hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto custom-scrollbar">
                <form id="edit-employee-form" class="space-y-6">
                    <input type="hidden" id="edit-emp-id">
                    <div class="flex flex-col sm:flex-row gap-6 items-start">
                        <div class="w-32 h-32 rounded-2xl bg-gray-800 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500 transition-colors relative group shrink-0" onclick="document.getElementById('edit-emp-image-upload').click()">
                            <img id="edit-emp-image-preview" src="" class="hidden w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg class="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                                <span class="text-[10px] text-white font-bold">Change</span>
                            </div>
                            <span id="edit-emp-image-icon" class="text-[10px] text-gray-400">Loading...</span>
                            <input type="file" id="edit-emp-image-upload" accept="image/*" class="hidden" onchange="window.previewEditEmpImage(this)">
                        </div>
                        <div class="flex-1 space-y-4 w-full">
                            <div>
                                <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Full Name</label>
                                <input id="edit-emp-name-input" class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-colors" required>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Designation</label>
                                    <input id="edit-emp-designation-input" class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-colors" required>
                                </div>
                                <div>
                                    <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Phone Number</label>
                                    <input id="edit-emp-contact-input" class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-colors" required>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Full Address</label>
                        <input id="edit-emp-address-input" class="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-colors" required>
                    </div>

                    <div class="p-5 bg-gray-800/50 border border-white/5 rounded-2xl grid grid-cols-2 gap-5">
                        <div class="col-span-2 md:col-span-1">
                            <label class="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Salary Configuration
                            </label>
                            <div class="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Type</label>
                                    <select id="edit-emp-salary-type" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-white text-sm focus:border-emerald-500 outline-none">
                                        <option value="Monthly">Monthly</option>
                                        <option value="Daily">Daily</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Monthly Salary</label>
                                    <input id="edit-emp-salary-amount" type="number" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-white text-sm font-mono focus:border-emerald-500 outline-none" required>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-2 md:col-span-1">
                            <label class="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                Assignment
                            </label>
                            <div class="space-y-3 mt-3">
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Location</label>
                                    <input id="edit-emp-farm-input" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-sm text-white focus:border-blue-500 outline-none" required>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Date Assigned</label>
                                    <input id="edit-emp-start-date" type="date" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-sm text-white focus:border-blue-500 outline-none" required>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-between gap-3 pt-4 border-t border-white/5">
                        <button type="button" class="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors font-bold text-sm" onclick="window.deleteEmployeeAccount()">Delete Account</button>
                        <div class="flex gap-2">
                            <button type="button" class="close-modal px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-bold text-sm">Cancel</button>
                            <button type="submit" class="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-400 shadow-lg shadow-blue-500/20 font-bold text-sm">Save Changes</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Stunning Employee Profile Modal -->
    <div id="employee-profile-modal" class="modal-container hidden fixed inset-0 z-50 items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            
            <!-- Top Banner -->
            <div class="h-32 bg-gradient-to-r from-teal-900 via-blue-900 to-indigo-900 relative">
                <input type="hidden" id="prof-current-emp-id">
                <div class="absolute top-4 right-4 flex gap-2">
                    <button class="bg-black/50 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur shadow transition-all border border-white/10" onclick="window.openEditEmployeeModal()" title="Edit Profile">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button class="close-modal bg-black/50 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur shadow transition-all border border-white/10">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div class="absolute -bottom-12 left-8 flex items-end gap-5">
                    <div class="w-32 h-32 rounded-2xl bg-gray-800 border-4 border-gray-900 shadow-xl overflow-hidden relative">
                        <img id="prof-emp-image" src="" class="w-full h-full object-cover hidden">
                        <div id="prof-emp-initial" class="w-full h-full flex items-center justify-center text-4xl font-black text-gray-500 bg-gray-800">A</div>
                        <div id="prof-emp-status" class="absolute bottom-0 inset-x-0 h-6 bg-emerald-500 flex items-center justify-center text-[10px] font-black uppercase text-white tracking-widest">Active</div>
                    </div>
                    <div class="pb-2">
                        <h2 class="text-3xl font-black text-white" id="prof-emp-name">Employee Name</h2>
                        <div class="flex gap-2 mt-1">
                            <span class="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-bold text-gray-200 border border-white/10" id="prof-emp-designation">Role Title</span>
                            <span class="px-3 py-1 bg-teal-500/20 backdrop-blur rounded-full text-xs font-bold text-teal-300 border border-teal-500/20 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                <span id="prof-emp-assigned-farm">Location</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="pt-16 px-8 pb-8 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-8">
                <!-- Left Column: Details -->
                <div class="lg:w-1/3 flex flex-col gap-6">
                    <div class="bg-gray-800/40 rounded-2xl p-5 border border-white/5">
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Contact Info</h4>
                        <div class="space-y-4 text-sm">
                            <div class="flex items-start gap-3 text-gray-300">
                                <div class="p-2 bg-gray-900 rounded-lg shrink-0">
                                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                </div>
                                <div>
                                    <p class="text-[10px] text-gray-500 uppercase font-bold">Phone</p>
                                    <p class="font-medium" id="prof-emp-contact">01700000000</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 text-gray-300">
                                <div class="p-2 bg-gray-900 rounded-lg shrink-0">
                                    <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                </div>
                                <div>
                                    <p class="text-[10px] text-gray-500 uppercase font-bold">Address</p>
                                    <p class="font-medium" id="prof-emp-address">Address Detail</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl font-bold transition-colors text-sm" onclick="window.closeEmployeeAccount()">
                        Terminate/Close Account
                    </button>
                </div>

                <!-- Right Column: Salary & History -->
                <div class="lg:w-2/3 flex flex-col gap-6">
                    <!-- Live Salary Box -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-teal-500/20 relative overflow-hidden shadow-lg">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                        <div class="flex flex-col sm:flex-row justify-between gap-6 relative z-10">
                            <div>
                                <h4 class="text-xs font-bold text-teal-500 uppercase tracking-wider mb-2" id="prof-emp-salary-type-badge">Monthly Contract</h4>
                                <p class="text-3xl font-black text-white font-mono" id="prof-emp-base-salary">৳0</p>
                                <p class="text-[10px] text-gray-400 mt-1">Base Monthly Parameter</p>
                            </div>
                            <div class="w-px bg-white/10 hidden sm:block"></div>
                            <div class="bg-black/40 p-4 rounded-xl border border-white/5 text-center flex-1">
                                <p class="text-[10px] font-bold text-gray-500 uppercase mb-1">Live Accrued Wage</p>
                                <p class="text-4xl font-black text-emerald-400 font-mono" id="prof-emp-live-payable">৳0</p>
                                <p class="text-[10px] text-gray-400 font-medium" id="prof-emp-live-days">Days Worked</p>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Issue Form -->
                    <div class="bg-gray-800/40 rounded-2xl p-5 border border-white/5">
                        <div class="flex flex-col sm:flex-row gap-4 items-end">
                            <div class="flex-1 w-full">
                                <label class="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Payment From</label>
                                <input type="date" id="prof-pay-start" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-white text-sm focus:border-teal-500 outline-none">
                            </div>
                            <div class="flex-1 w-full">
                                <label class="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Payment To</label>
                                <input type="date" id="prof-pay-end" class="w-full bg-black/50 border border-white/10 p-2.5 rounded-lg text-white text-sm focus:border-teal-500 outline-none" onchange="window.recalculateSalaryForPeriod()">
                            </div>
                            <div class="flex-1 w-full relative">
                                <label class="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Amount (৳)</label>
                                <input type="number" id="prof-pay-amount" class="w-full bg-black/50 border border-teal-500/30 p-2.5 rounded-lg text-white font-black font-mono focus:border-teal-500 outline-none">
                            </div>
                            <button class="w-full sm:w-auto bg-teal-500 text-gray-900 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-colors shrink-0 whitespace-nowrap" onclick="window.payEmployeeSalary()">
                                Issue Pay
                            </button>
                        </div>
                    </div>

                    <!-- Transaction Ledger -->
                    <div class="flex-1 bg-gray-800/40 rounded-2xl border border-white/5 flex flex-col overflow-hidden min-h-[200px]">
                        <div class="px-5 py-3 border-b border-white/5 bg-black/20">
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Payroll History Ledger</h4>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                            <table class="w-full text-left text-sm whitespace-nowrap">
                                <thead class="bg-black/40 text-gray-500 text-[10px] uppercase font-bold sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th class="py-2.5 px-5 border-b border-white/5">Date Processed</th>
                                        <th class="py-2.5 px-5 border-b border-white/5">Work Period</th>
                                        <th class="py-2.5 px-5 border-b border-white/5 text-right">Amount Paid</th>
                                    </tr>
                                </thead>
                                <tbody id="prof-emp-history" class="divide-y divide-white/5 text-gray-300 bg-transparent">
                                    <!-- JS populated -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
"""

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Inject the user view right before filemanager view
text = text.replace('<!-- Filemanager View -->', new_employee_html + '\n        <!-- Filemanager View -->')

# Inject modals at the end of main
text = text.replace('</main>', new_modal_html + '\n    </main>')

# Re-link the nav button
nav_link = """
            <!-- User Menu -->
            <a href="#" data-view="user-view"
                class="nav-link flex items-center space-x-3 px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                <svg class="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <span class="font-medium text-sm">Staff & Payroll</span>
            </a>
"""
text = text.replace('</nav>\n\n        <div class="p-4 border-t border-white/5">', nav_link + '        </nav>\n\n        <div class="p-4 border-t border-white/5">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
