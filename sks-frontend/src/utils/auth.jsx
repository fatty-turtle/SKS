import { jwtDecode } from "jwt-decode";

export const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getRoleFromToken = () => {
  const token = getToken();
  if (!token) {
    return null;
  }
  const decoded = jwtDecode(token);
  return decoded.roles || null;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export function getUserIdFromToken() {
  if (localStorage.getItem("token") == null) return null;

  try {
    const decoded = jwtDecode(localStorage.getItem("token"));
    return decoded.userId;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}