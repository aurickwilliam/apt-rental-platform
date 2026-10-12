export interface FilterOption<T extends string = string> {
  id: T;
  label: string;
}

export interface ActiveFilterTag {
  id: string;
  label: string;
}
