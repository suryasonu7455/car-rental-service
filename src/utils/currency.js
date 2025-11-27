export function formatINR(amount) {
  try {
    // Use Intl.NumberFormat for Indian Rupee formatting
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  } catch (e) {
    // Fallback: add rupee symbol and two decimals
    return `₹${Number(amount).toFixed(2)}`;
  }
}
