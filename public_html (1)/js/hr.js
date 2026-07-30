// js/hr.js - HR & Payroll Module

const hrState = {
    attendance: [],
    shifts: [],
    loans: [],
    commissionRules: {}
};

// Advanced Salary Calculation (Basic + Commission + Loan Deductions)
export function calculatePayroll(employeeId, monthRaw) {
    if (!window.getModuleData) return 0;

    const employees = window.getModuleData('employees');
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return 0;

    let baseSalary = Number(emp.salary) || 0;

    // Commission Logic (e.g 2% of generated sales)
    let totalSales = 0;
    // Example: fetch sales where clerk = employeeId
    // let sales = window.getModuleData('sales').filter(s => s.cashierId === employeeId);

    let commission = totalSales * 0.02; // Static 2% rule 

    // Loan Deductions
    let loanDeductions = hrState.loans.filter(l => l.employeeId === employeeId && l.status === 'active')
        .reduce((acc, curr) => acc + curr.installmentAmount, 0);

    // Final Payout
    let netPayable = (baseSalary + commission) - loanDeductions;
    return Math.max(netPayable, 0);
}

// Duty Shift Management Tracker
export function recordAttendance(employeeId, shiftId, status) {
    hrState.attendance.push({
        id: new Date().getTime(),
        employeeId,
        shiftId,
        status, // present, absent, half-day, leave
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date()
    });
    console.log(`Attendance recorded for ${employeeId}`);
}

window.calculatePayroll = calculatePayroll;
window.recordAttendance = recordAttendance;
