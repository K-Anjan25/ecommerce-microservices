export interface Category {
  id: number;
  name: string;
  slug?: string;
  parentId?: number | null;
  sortOrder?: number;
  children?: Category[];
}
