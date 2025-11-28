import axios from "axios";
import { getToken } from "../utils/auth";

const API_BASE = "http://localhost:3000";

export const getRelatedDocuments = async (documentId) => {
  const token = getToken();

  const res = await axios.get(
    `${API_BASE}/documents/${documentId}/related`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data.documents || [];
};
