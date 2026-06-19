type DateFormat = "short" | "medium" | "long" | "month" | "year";

export function formatDate(timestamp: Date | number | string, format: DateFormat = "short"): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  switch (format) {
    case "month": {
      return date.toLocaleString("default", { month: "long" });
      // Example: "January"
    }
    case "year": {
      return date.getFullYear().toString();
      // Example: "2024"
    }
    case "medium": {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      // Example: "Jan 1, 2024"
    }
    case "long": {
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      // Example: "January 1, 2024"
    }
    default: {
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
      // Example: "01/01/2024"
    }
  }
}