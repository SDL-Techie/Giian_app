import mongoose from "mongoose";

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

export const isNonEmptyArray = (arr) => Array.isArray(arr) && arr.length > 0;

// Validates that every item in a line-items array has product, qty, and a price/cost field.
export const validateLineItems = (items, priceField = "price") => {
  if (!isNonEmptyArray(items)) {
    return "At least one product line item is required";
  }
  for (const item of items) {
    if (!item.product || !isValidObjectId(item.product)) {
      return "Each item requires a valid product";
    }
    if (item.qty === undefined || Number(item.qty) <= 0) {
      return "Each item requires a quantity greater than 0";
    }
    if (item[priceField] === undefined || Number(item[priceField]) < 0) {
      return `Each item requires a valid ${priceField}`;
    }
  }
  return null;
};
