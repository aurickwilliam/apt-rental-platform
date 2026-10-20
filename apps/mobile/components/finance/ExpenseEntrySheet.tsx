import ExpenseEditor from "./ExpenseEditor";
import type { ExpenseEntryFormOptions } from "@/hooks/finance/useExpenseEntryForm";

export default function ExpenseEntrySheet(props: ExpenseEntryFormOptions) {
  return <ExpenseEditor {...props} presentation="sheet" />;
}
