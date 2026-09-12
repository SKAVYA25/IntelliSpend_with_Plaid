type CategoryMapping = {
  category: string;
  subcategory: string;
};

export function mapPlaidCategory(
  plaidCategory: string,
  merchantName?: string | null
): CategoryMapping {
  const category = plaidCategory.toUpperCase();
  const merchant = (merchantName || "").toLowerCase();

  // Fitness merchants
  if (
    merchant.includes("climbing") ||
    merchant.includes("gym") ||
    merchant.includes("fitness") ||
    merchant.includes("sports club")
  ) {
    return {
      category: "Health",
      subcategory: "Fitness",
    };
  }

  // Food & Drink
  if (category === "FOOD_AND_DRINK") {
    if (
      merchant.includes("starbucks") ||
      merchant.includes("coffee") ||
      merchant.includes("cafe")
    ) {
      return {
        category: "Food",
        subcategory: "Coffee",
      };
    }

    if (
      merchant.includes("mcdonald") ||
      merchant.includes("kfc") ||
      merchant.includes("burger") ||
      merchant.includes("pizza")
    ) {
      return {
        category: "Food",
        subcategory: "Fast Food",
      };
    }

    if (
      merchant.includes("grocery") ||
      merchant.includes("market") ||
      merchant.includes("supermarket")
    ) {
      return {
        category: "Food",
        subcategory: "Groceries",
      };
    }

    return {
      category: "Food",
      subcategory: "Other",
    };
  }

  // Transportation
  if (category === "TRANSPORTATION") {
    if (
      merchant.includes("bicycle") ||
      merchant.includes("bike shop") ||
      merchant.includes("cycle")
    ) {
      return {
        category: "Shopping",
        subcategory: "Other",
      };
    }

    if (
      merchant.includes("uber") ||
      merchant.includes("ola") ||
      merchant.includes("lyft") ||
      merchant.includes("taxi")
    ) {
      return {
        category: "Transport",
        subcategory: "Taxi",
      };
    }

    if (
      merchant.includes("fuel") ||
      merchant.includes("shell") ||
      merchant.includes("petrol") ||
      merchant.includes("gas station")
    ) {
      return {
        category: "Transport",
        subcategory: "Fuel",
      };
    }

    if (
      merchant.includes("airlines") ||
      merchant.includes("airport")
    ) {
      return {
        category: "Transport",
        subcategory: "Travel",
      };
    }

    return {
      category: "Transport",
      subcategory: "Other",
    };
  }

  // Travel
  if (category === "TRAVEL") {
    return {
      category: "Transport",
      subcategory: "Travel",
    };
  }

  // Rent & Utilities
  if (category === "RENT_AND_UTILITIES") {
    if (merchant.includes("rent")) {
      return {
        category: "Bills",
        subcategory: "Rent",
      };
    }

    if (merchant.includes("internet")) {
      return {
        category: "Bills",
        subcategory: "Internet",
      };
    }

    if (
      merchant.includes("mobile") ||
      merchant.includes("phone")
    ) {
      return {
        category: "Bills",
        subcategory: "Mobile",
      };
    }

    if (
      merchant.includes("electric") ||
      merchant.includes("power")
    ) {
      return {
        category: "Bills",
        subcategory: "Electricity",
      };
    }

    if (merchant.includes("water")) {
      return {
        category: "Bills",
        subcategory: "Water",
      };
    }

    return {
      category: "Bills",
      subcategory: "Other",
    };
  }

  // Medical
  if (category === "MEDICAL") {
    return {
      category: "Health",
      subcategory: "Other",
    };
  }

  // Personal Care
  if (category === "PERSONAL_CARE") {
    return {
      category: "Health",
      subcategory: "Other",
    };
  }

  // Education
  if (category === "EDUCATION") {
    return {
      category: "Education",
      subcategory: "Other",
    };
  }

  // Entertainment
  if (category === "ENTERTAINMENT") {
    return {
      category: "Entertainment",
      subcategory: "Other",
    };
  }

  // General Merchandise
  if (category === "GENERAL_MERCHANDISE") {
    if (
      merchant.includes("bicycle") ||
      merchant.includes("bike shop") ||
      merchant.includes("cycle")
    ) {
      return {
        category: "Shopping",
        subcategory: "Other",
      };
    }

    if (
      merchant.includes("electronics") ||
      merchant.includes("computer")
    ) {
      return {
        category: "Shopping",
        subcategory: "Electronics",
      };
    }

    return {
      category: "Shopping",
      subcategory: "Other",
    };
  }

  // Interest
  if (
    merchant.includes("intrst") ||
    merchant.includes("interest")
  ) {
    return {
      category: "Interest",
      subcategory: "Bank Interest",
    };
  }

  // Credit card payments
  if (
    merchant.includes("credit card") ||
    merchant.includes("automatic payment") ||
    merchant.includes("card payment")
  ) {
    return {
      category: "Other",
      subcategory: "Other",
    };
  }

  // Transfers
  if (
    category === "TRANSFER_IN" ||
    category === "TRANSFER_OUT"
  ) {
    return {
      category: "Other",
      subcategory: "Other",
    };
  }

  // Loan payments
  if (category === "LOAN_PAYMENTS") {
    return {
      category: "Bills",
      subcategory: "Other",
    };
  }

  // Income
  if (category === "INCOME") {
    return {
      category: "Salary",
      subcategory: "Monthly Salary",
    };
  }

  return {
    category: "Other",
    subcategory: "Other",
  };
}
