const COMPARE_KEY = "compare_ids";

export const getCompareIds = (): string[] => {
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addToCompare = (productId: string) => {
  const ids = getCompareIds();
  if (!ids.includes(productId) && ids.length < 4) {
    ids.push(productId);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
  }
};

export const removeFromCompare = (productId: string) => {
  const ids = getCompareIds().filter((id) => id !== productId);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
};

export const clearCompare = () => {
  localStorage.removeItem(COMPARE_KEY);
};

export const isInCompare = (productId: string): boolean => {
  return getCompareIds().includes(productId);
};
