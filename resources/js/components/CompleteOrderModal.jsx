import React from 'react';
import PosPaymentModal from './PosPaymentModal';

export default function CompleteOrderModal({
  order,
  currency = '৳',
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!order) return null;

  const grandTotal = Number(order.grand_total || 0);
  const subtotal = Number(order.subtotal || 0);
  const taxAmount = Number(order.tax_amount || 0);
  const discountAmount = Number(order.discount_amount || 0);
  const roundingAdjustment = Number(order.rounding_amount || 0);
  const rawTotal = subtotal - discountAmount + taxAmount;
  
  const itemCount = order.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    || order.order_items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    || (Array.isArray(order.items) ? order.items.length : 1);

  return (
    <PosPaymentModal
      isOpen={Boolean(order)}
      grandTotal={grandTotal}
      rawTotal={rawTotal}
      roundingAdjustment={roundingAdjustment}
      subtotal={subtotal}
      taxAmount={taxAmount}
      discountAmount={discountAmount}
      customer={order.customer}
      itemCount={itemCount}
      orderNumber={order.order_number}
      title="Complete Order & Issue Invoice"
      currency={currency}
      onClose={onClose}
      onConfirmPayment={onConfirm}
      submitting={loading}
    />
  );
}
