import axios from 'axios';
import { getToken } from "../utils/auth";

const API_BASE_URL = 'http://localhost:3000';

const createApiClient = () => {
  const token = getToken();
  
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, 
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
};

export const summaryAPI = {
 
  createSummary: async (documentId) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/summary/${documentId}/create`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate summary');
    }
  },


  getSummary: async (documentId) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/summary/${documentId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.message || 'Failed to get summary');
    }
  },


  refreshSummary: async (documentId) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/summary/${documentId}/refresh`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to refresh summary');
    }
  },


  deleteSummary: async (documentId) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.delete(`/summary/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete summary');
    }
  },


  updateSummary: async (documentId, summary) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.put(`/summary/${documentId}`, { summary });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update summary');
    }
  },


  createDiagram: async (documentId) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/summary/${documentId}/diagram`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate diagram');
    }
  },

  
  getDiagram: async (documentId) => {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.post(`/summary/${documentId}/diagram`);
    return response.data; 
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to generate diagram');
  }
}

};

export default summaryAPI;