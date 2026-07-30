// js/inventory.js - Batch Tracking and Multi-Branch Sync

export const inventoryState = {
    branches: ["Main Store", "Warehouse A", "Chapainawabganj Farm"],
    batches: [], // Feed and vaccines batches tracking mortality
};

// Batch & Expiry tracking
export function registerBatch(productCode, batchId, cost, expiryDate) {
    if (!productCode || !batchId) return window.showToast("Invalid Batch info", "error");

    inventoryState.batches.push({
        batchId,
        productCode,
        cost,
        expiryDate,
        createdAt: new Date(),
        mortalityLoss: 0 // Track poultry deaths mapping back to feed batch
    });

    window.showToast(`Batch ${batchId} Registered`);
}

export function recordBatchMortalityLoss(batchId, quantityLost) {
    const batch = inventoryState.batches.find(b => b.batchId === batchId);
    if (!batch) return window.showToast("Batch not found", "error");

    batch.mortalityLoss += quantityLost;
    console.log(`Mortality of ${quantityLost} registered against ${batchId}`);
}

// Multi-branch warehouse transfer
export function executeStockTransfer(fromBranch, toBranch, productId, qty) {
    // Requires robust distributed transaction logic checking source stock
    let success = true;

    if (fromBranch === toBranch) {
        window.showToast("Source and Destination branches cannot be identical", "error");
        return;
    }

    if (success) {
        // Pseudo DB transfer
        console.log(`Transferred ${qty} of Product[${productId}] from ${fromBranch} to ${toBranch}`);
        window.showToast(`Stock transferred to ${toBranch}`);
    } else {
        window.showToast("Stock transfer failed. Check capacity and limits", "error");
    }
}

// Mobile/SMS Twilio integration alert
export function sendSMSAlert(phone, textMsg) {
    // API Call to SMS Gateway using Twilio or local provider
    console.log(`Sending SMS to ${phone} -> Message: ${textMsg}`);

    /* 
    fetch('https://api.sms-provider.com/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message: textMsg, api_key: 'YOUR_API_KEY' })
    });
    */
}

window.registerBatch = registerBatch;
window.recordBatchMortalityLoss = recordBatchMortalityLoss;
window.executeStockTransfer = executeStockTransfer;
window.sendSMSAlert = sendSMSAlert;
