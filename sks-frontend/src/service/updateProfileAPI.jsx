import axios from "axios";

const API_URL = "http://localhost:3000";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const updateProfile = (data) => {
  return axios.put(`${API_URL}/auth/profile`, data, {
    headers: authHeader(),
  });
};
