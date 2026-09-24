export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  sortOrder?: number;
  /** Multi-locale overrides JSON: {"hi":{"name":"..."}} */
  translations?: string | null;
  children?: Category[];
}
