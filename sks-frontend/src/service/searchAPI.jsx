import axios from "axios";

const API_URL = "http://localhost:3000";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const searchDocuments = (query) => {
  return axios.get(`${API_URL}/documents/search`, {
    headers: authHeader(),
    params: { q: query },
  });
};
