import mongoose from "mongoose";

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
export const isValidEmail = (email = "") => /^\S+@\S+\.\S+$/.test(String(email).trim());
export const isNonEmptyArray = (arr) => Array.isArray(arr) && arr.length > 0;
export const isFiniteNumber = (value) => Number.isFinite(Number(value));
export const isValidPercentage = (value) => isFiniteNumber(value) && Number(value) >= 0 && Number(value) <= 100;
export const isValidDateValue = (value) => !!value && !Number.isNaN(new Date(value).getTime());

export const validateLineItems = (items, priceField = "price") => {
  if (!isNonEmptyArray(items)) return "At least one product line item is required";
  for (const item of items) {
    if (!item?.product || !isValidObjectId(item.product)) return "Each item requires a valid product";
    if (!isFiniteNumber(item.qty) || Number(item.qty) <= 0) return "Each item requires a quantity greater than 0";
    if (!isFiniteNumber(item[priceField]) || Number(item[priceField]) < 0) return `Each item requires a valid ${priceField}`;
  }
  return null;
};

export const validateCommercialTotalsInput = ({ discount = 0, vatPercent = 0, subTotal }) => {
  if (!isFiniteNumber(discount) || Number(discount) < 0) return "Discount cannot be negative";
  if (!isValidPercentage(vatPercent)) return "VAT percentage must be between 0 and 100";
  if (subTotal !== undefined && Number(discount) > Number(subTotal) + 0.001) return "Discount cannot exceed subtotal";
  return null;
};
