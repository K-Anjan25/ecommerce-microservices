import { api, HttpError, refreshAuthTokens } from "../../api/client";
import { UserError } from "../../types/error";
import {
  Login,
  LoginForm,
  User,
  UserDispatch,
} from "../../types/user";
import { removeToken, setToken } from "../../utils/token";
import { ProfileForm, ProfileImage } from "../../types/profile";

const isAuthFailure = (error: unknown) => {
  const status = error instanceof HttpError ? error.response?.status : undefined;
  return status === 401 || status === 403;
};

const loadCurrentUser = async (dispatch: UserDispatch) => {
  const { data } = await api.get<User>("/user/me");
  dispatch({ type: "USER_SUCCESS", payload: data });
  return true;
};

export const login = (creds: LoginForm) => async (dispatch: UserDispatch) => {
  dispatch({ type: "LOGIN_START" });
  try {
    const { data } = await api.post<Login>("/user/login", creds);
    setToken(data);

    // Do not mark the session ready from the login response alone. Hydrating
    // /user/me first gives the router the roles and profile it needs, and it
    // also makes the login path use the same restore flow as a page reload.
    const restored = await dispatch(userMe());
    if (!restored) {
      dispatch({ type: "LOGIN_ERROR", payload: "Your session could not be restored" });
    }
  } catch (error) {
    const err = error as HttpError<UserError>;
    dispatch({
      type: "LOGIN_ERROR",
      payload: err.response?.data?.message ?? "Something went wrong",
    });
  }
};

export const logout = () => (dispatch: UserDispatch) => {
  removeToken();
  dispatch({ type: "LOGOUT" });
};

/**
 * Hydrate the Redux user from the durable token pair. The user service returns
 * 403 for an expired access token, while the gateway returns 401 for one; both
 * are session failures and should get one shared refresh attempt.
 */
export const userMe = () => async (dispatch: UserDispatch) => {
  dispatch({ type: "USER_START" });
  try {
    return await loadCurrentUser(dispatch);
  } catch (error) {
    if (isAuthFailure(error) && localStorage.getItem("refresh-token")) {
      try {
        await refreshAuthTokens();
        return await loadCurrentUser(dispatch);
      } catch {
        removeToken();
        dispatch({ type: "REFRESH_TOKEN_ERROR" });
        return false;
      }
    }

    // A rejected session must not leave the reducer looking authenticated or
    // leave the app stuck behind a permanent loading state.
    if (isAuthFailure(error)) removeToken();
    dispatch({ type: "USER_ERROR" });
    return false;
  }
};

export const refreshToken = () => async (dispatch: UserDispatch) => {
  try {
    await refreshAuthTokens();
    return await dispatch(userMe());
  } catch {
    removeToken();
    dispatch({ type: "REFRESH_TOKEN_ERROR" });
    return false;
  }
};

export const updateProfile =
  (res: Login, user: ProfileForm) => async (dispatch: UserDispatch) => {
    setToken(res);
    dispatch({ type: "UPDATE_PROFILE", payload: user });
  };

export const updateProfileImage =
  (profileImage: ProfileImage) => async (dispatch: UserDispatch) => {
    dispatch({ type: "UPDATE_PROFILE_IMAGE", payload: profileImage });
  };
