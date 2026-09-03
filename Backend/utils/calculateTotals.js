// Shared totals calculator used by Purchase, Quotation and Sales (Invoice).
// items: [{ qty, price/cost }] - each item's totalPrice/totalCost is derived here.
export const calculateLineItems = (items, priceField = "price") => {
  return items.map((item) => {
    const qty = Number(item.qty);
    const price = Number(item[priceField]);
    const totalKey = priceField === "cost" ? "totalCost" : "totalPrice";
    return {
      ...item,
      qty,
      [priceField]: price,
      [totalKey]: Number((qty * price).toFixed(2)),
    };
  });
};

export const sumItems = (items, totalField = "totalPrice") => {
  return Number(
    items.reduce((sum, item) => sum + Number(item[totalField] || 0), 0).toFixed(2)
  );
};

/**
 * Computes { subTotal, vatAmount, totalAmount } given a subtotal,
 * an optional flat discount, and a VAT percentage.
 */
export const computeGrandTotal = ({ subTotal, discount = 0, vatPercent = 0 }) => {
  const discountedSubTotal = Math.max(0, Number(subTotal) - Number(discount || 0));
  const vatAmount = Number(((discountedSubTotal * Number(vatPercent || 0)) / 100).toFixed(2));
  const totalAmount = Number((discountedSubTotal + vatAmount).toFixed(2));
  return {
    subTotal: Number(Number(subTotal).toFixed(2)),
    vatAmount,
    totalAmount,
  };
};
