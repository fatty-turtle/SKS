import axios from "axios";

const API_URL = "http://localhost:3000";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Get all users
export const getAllUsers = () => {
  return axios.get(`${API_URL}/admin/users`, {
    headers: authHeader(),
  });
};

// Delete / deactivate user
export const deactivateUser = (userId) => {
  return axios.delete(`${API_URL}/admin/users/${userId}`, {
    headers: authHeader(),
  });
};

// Activate user
export const activateUser = (userId) => {
  return axios.put(`${API_URL}/admin/users/${userId}/activate`, {}, {
    headers: authHeader(),
  });
};
