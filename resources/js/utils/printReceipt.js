/**
 * Utility to print POS Thermal Receipts using browser's native print preview.
 * Cleanly prints the 80mm thermal receipt formatted via @media print CSS.
 */
export function printThermalReceipt(elementId = 'pos-thermal-receipt') {
  // Trigger standard browser print dialog which uses @media print styling
  setTimeout(() => {
    window.print();
  }, 50);
}

