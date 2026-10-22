import ExpenseEditor from "./ExpenseEditor";
import type { ExpenseEntryFormOptions } from "@/hooks/finance/useExpenseEntryForm";

type ExpenseEntryPageProps = Omit<ExpenseEntryFormOptions, "isOpen">;

/** Add or edit page; `initial` and `onDelete` turn it into the edit form. */
export default function ExpenseEntryPage(props: ExpenseEntryPageProps) {
  return <ExpenseEditor {...props} isOpen />;
}
