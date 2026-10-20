import ExpenseEditor from "./ExpenseEditor";
import type { ExpenseEntryFormOptions } from "@/hooks/finance/useExpenseEntryForm";

type ExpenseEntryPageProps = Omit<
  ExpenseEntryFormOptions,
  "isOpen" | "initial" | "onDelete"
>;

export default function ExpenseEntryPage(props: ExpenseEntryPageProps) {
  return <ExpenseEditor {...props} isOpen presentation="page" />;
}
