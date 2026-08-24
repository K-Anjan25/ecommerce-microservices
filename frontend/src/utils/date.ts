const currentLocale = () =>
  typeof document !== "undefined" && document.documentElement.lang === "hi" ? "hi-IN" : "en-IN";

export const formatDate = (date: string | Date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat(currentLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

export const formatCalendarDate = (date: string | Date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat(currentLocale(), { dateStyle: "medium" }).format(value);
};
