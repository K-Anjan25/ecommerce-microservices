import { notify } from "../components/Toasts";

export const showError = (message: string) => {
  notify("error", message);
};
