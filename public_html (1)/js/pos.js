// js/pos.js - Point of Sale & Hardware Integration Module

// 1. Web Serial API - 58mm/80mm Thermal Printer Integration
let printerPort = null;
let printerWriter = null;

export async function connectPrinter() {
    try {
        if (!navigator.serial) {
            window.showToast("Web Serial API not supported in this browser.", "error");
            return;
        }
        printerPort = await navigator.serial.requestPort();
        await printerPort.open({ baudRate: 9600 });
        const encoder = new TextEncoderStream();
        const writableStreamClosed = encoder.readable.pipeTo(printerPort.writable);
        printerWriter = encoder.writable.getWriter();
        window.showToast("Thermal Printer Connected!", "success");
    } catch (err) {
        console.error("Printer connection failed:", err);
        window.showToast("Failed to connect printer.", "error");
    }
}

export async function printReceipt(receiptData) {
    if (!printerWriter) {
        // Fallback to browser print if no hardware connected
        window.print();
        return;
    }

    // ESC/POS Command Generation (Basic)
    const ESC = "\x1B";
    const INIT = ESC + "@";
    const BOLD_ON = ESC + "E" + "\x01";
    const BOLD_OFF = ESC + "E" + "\x00";
    const ALIGN_CENTER = ESC + "a" + "\x01";
    const ALIGN_LEFT = ESC + "a" + "\x00";
    const TEXT_NORMAL = ESC + "!" + "\x00";
    const TEXT_TITLE = ESC + "!" + "\x10"; // Double height

    const feed = "\n\n\n\n";

    try {
        await printerWriter.write(INIT);
        await printerWriter.write(ALIGN_CENTER + BOLD_ON + "\nAKHI POULTRY FARM 2.0\n");
        await printerWriter.write(BOLD_OFF + "Prop: Md. Sadikul Islam\n");
        await printerWriter.write("Chapainawabganj | 01732-281710\n");
        await printerWriter.write("--------------------------------\n");

        await printerWriter.write(ALIGN_LEFT);
        await printerWriter.write(`Date: ${new Date().toLocaleDateString()}\n`);
        await printerWriter.write(`Customer: ${receiptData.customerName || 'Walk-in'}\n`);
        await printerWriter.write("--------------------------------\n");
        await printerWriter.write("Item        Qty    Rate   Total\n");
        await printerWriter.write("--------------------------------\n");

        for (let item of receiptData.items) {
            const line = `${item.name.substring(0, 10).padEnd(10)} ${(item.quantity + '').padEnd(6)} ${(item.price + '').padStart(6)} ${(item.price * item.quantity + '').padStart(7)}\n`;
            await printerWriter.write(line);
        }

        await printerWriter.write("--------------------------------\n");
        await printerWriter.write(ALIGN_CENTER + BOLD_ON + `GRAND TOTAL: Tk ${receiptData.totalAmount}\n`);

        await printerWriter.write(feed);
        window.showToast("Print command sent successfully");
    } catch (err) {
        console.error("Print Error:", err);
    }
}

// 2. Web Bluetooth API - IoT Weight Scale Integration
let scaleDevice = null;
let scaleCharacteristic = null;

export async function connectIoTScale() {
    try {
        if (!navigator.bluetooth) {
            window.showToast("Web Bluetooth API not supported.", "error");
            return;
        }
        scaleDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service'] // Replace with actual scale service UUID
        });

        const server = await scaleDevice.gatt.connect();
        // Setup characteristic notifications here based on actual hardware
        window.showToast(`IoT Scale connected: ${scaleDevice.name}`, "success");
    } catch (err) {
        console.error("Scale connection failed:", err);
        window.showToast("IoT Scale connection failed.", "error");
    }
}

// 3. Keyboard Shortcuts Setup
export function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        // F2 - Quick Search Focus
        if (e.key === "F2") {
            e.preventDefault();
            document.getElementById('product-search')?.focus();
            window.showToast("Quick Search Active", "success");
        }

        // Enter - Proceed to Print from Cart (Only if cart has items)
        if (e.key === "Enter" && document.getElementById('cart-list')?.children?.length > 0) {
            if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                e.preventDefault();
                document.getElementById('checkout-btn')?.click();
            }
        }

        // Escape - Close Modals
        if (e.key === "Escape") {
            const modals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
            modals.forEach(m => m.classList.add('hidden'));
        }
    });
}

// Expose integrations
window.connectPrinter = connectPrinter;
window.connectIoTScale = connectIoTScale;

// Auto-init
document.addEventListener("DOMContentLoaded", () => {
    initKeyboardShortcuts();
});
