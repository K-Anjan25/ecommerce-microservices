import { notify } from "../components/Toasts";

export const showSuccess = (message: string) => {
  notify("success", message);
};
