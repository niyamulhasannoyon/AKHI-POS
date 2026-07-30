// js/analytics.js
export const analyticsContext = {
    ai_threshold: 0.15, // Threshold for sale variance alerts
};

// Machine Learning Stub: Predictive Sales Forecasting
export function predictNextMonthDemand(productId) {
    if (!window.getModuleData) return;
    const sales = window.getModuleData('sales');
    let productHistory = sales.map(s => {
        let matchingItem = s.items.find(i => i.id === productId);
        return {
            date: new Date((s.timestamp?.seconds || 0) * 1000),
            quantity: matchingItem ? matchingItem.quantity : 0
        };
    }).filter(p => p.quantity > 0).sort((a, b) => a.date - b.date);

    // Simple Linear Regression slope over last N days 
    if (productHistory.length < 2) return "Insufficient Data";

    const lastDate = productHistory[productHistory.length - 1].date;
    const avgQtyDaily = productHistory.reduce((acc, curr) => acc + curr.quantity, 0) / (productHistory.length || 1);

    // Naive forecast: Average Run Rate * 30 days
    const predictionBase = avgQtyDaily * 30;

    // Add seasonal/trend weight (mocked AI tensor layer)
    const aiWeightMultipler = 1.05;

    return Math.floor(predictionBase * aiWeightMultipler);
}

// Behavioral Smart Alerts Analysis
export function scanBehavioralAnomalies() {
    if (!window.getModuleData) return [];

    const customers = window.getModuleData('customers') || [];
    const sales = window.getModuleData('sales') || [];
    const alerts = [];
    const currentTime = new Date().getTime();

    // 1. Churn Prediction (No purchases in past 45 days)
    customers.forEach(c => {
        if (c.id === 'walk-in') return;
        const cSales = sales.filter(s => s.customerId === c.id);
        const lastSale = cSales.sort((a, b) => b.timestamp - a.timestamp)[0];
        if (lastSale && lastSale.timestamp) {
            let diffDays = (currentTime - lastSale.timestamp.seconds * 1000) / (1000 * 3600 * 24);
            if (diffDays > 45) {
                alerts.push({ type: 'warning', msg: `${c.name} has not purchased in ${Math.round(diffDays)} days (Churn Risk)` });
            }
        }
    });

    return alerts;
}

window.predictNextMonthDemand = predictNextMonthDemand;
window.scanBehavioralAnomalies = scanBehavioralAnomalies;
