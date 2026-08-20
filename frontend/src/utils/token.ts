import { Token } from "../types/user";

export const setToken = (token: Token) => {
  localStorage.setItem("access-token", token.accessToken);
  localStorage.setItem("refresh-token", token.refreshToken);
};

export const removeToken = () => {
  localStorage.removeItem("access-token");
  localStorage.removeItem("refresh-token");
};
