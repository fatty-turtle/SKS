import axios from "axios";

import { getToken } from "../utils/auth";


const API_URL = "http://localhost:3000/documents";


const API_BASE = "http://localhost:3000/folders";

export const getDocumentsByFolderId = async (folderId, page = 1, limit = 10) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log(`Fetching documents for folder: ${folderId}, page: ${page}, limit: ${limit}`);

    const response = await axios({
      method: 'GET',
      url: `${API_BASE}/${folderId}/documents`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: page,
        limit: limit
      },
      timeout: 15000
    });

    console.log("Documents API Response:", response);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error("Unauthorized. Please login again.");
        } else if (status === 403) {
          throw new Error("Access denied. You don't have permission.");
        } else if (status === 404) {
          throw new Error("No documents found in this folder.");
        } else {
          throw new Error(error.response.data.message || `Server error: ${status}`);
        }
      } else if (error.request) {
        throw new Error("No response from server. Please check your connection.");
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};


export const getDocuments = async (page = 1, limit = 10) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log("Fetching documents from:", API_URL, `page=${page}&limit=${limit}`);
    console.log("Using token:", token.substring(0, 20) + "...");

    const response = await axios({
      method: 'GET',
      url: `${API_URL}?page=${page}&limit=${limit}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log("Documents API Response:", response);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error("Unauthorized. Please login again.");
        } else if (status === 403) {
          throw new Error("Access denied. You don't have permission.");
        } else if (status === 404) {
          throw new Error("API endpoint not found.");
        } else {
          throw new Error(error.response.data.message || `Server error: ${status}`);
        }
      } else if (error.request) {
        throw new Error("No response from server. Please check your connection.");
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};



export const uploadDocument = async (file, folderId = null) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No authentication token found");

    const formData = new FormData();
    formData.append("file", file);
    if (folderId) formData.append("folderId", folderId); // ✅ Gửi folderId

    const response = await axios({
      method: "POST",
      url: "http://localhost:3000/documents/upload",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      data: formData,
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new Error(error.response?.data?.message || "Upload failed");
  }
};


export const deleteDocument = async (documentId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log("Deleting document:", documentId);

    const response = await axios({
      method: 'DELETE',
      url: `${API_URL}/delete`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        documentId: documentId
      },
      timeout: 10000
    });

    console.log("Delete response:", response);
    return response.data;
  } catch (error) {
    console.error("Error deleting document:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || `Delete failed: ${error.response.status}`);
      } else if (error.request) {
        throw new Error("No response from server during delete.");
      } else {
        throw new Error(`Delete error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred during delete");
    }
  }
};


// API để xem tài liệu trực tiếp
export const viewDocument = async (documentId, filename) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios({
      method: 'GET',
      url: `${API_URL}/${documentId}/file`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'blob',
      timeout: 30000
    });

    const fileExtension = filename ? filename.split('.').pop().toLowerCase() : '';
    const contentType = response.headers['content-type'];
    
    return {
      blob: response.data,
      contentType,
      fileExtension,
      filename
    };
  } catch (error) {
    console.error("Error viewing document:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || `View failed: ${error.response.status}`);
      } else if (error.request) {
        throw new Error("No response from server during view.");
      } else {
        throw new Error(`View error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred during view");
    }
  }
};

// API để download tài liệu (giữ nguyên)
export const downloadDocument = async (documentId, filename) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log("Downloading document:", documentId);

    const response = await axios({
      method: 'GET',
      url: `${API_URL}/${documentId}/file`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'blob',
      timeout: 30000
    });

    console.log("Download document response:", response);
    
    // Tạo URL từ blob và trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', downloadFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "File downloaded successfully" };
  } catch (error) {
    console.error("Error downloading document:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || `Download failed: ${error.response.status}`);
      } else if (error.request) {
        throw new Error("No response from server during download.");
      } else {
        throw new Error(`Download error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred during download");
    }
  }
};





// documentsAPI.js - Thêm hàm moveDocumentToFolder
export const moveDocumentToFolder = async (documentId, folderId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log("Moving document:", documentId, "to folder:", folderId);

    const response = await axios({
      method: 'POST',
      url: `http://localhost:3000/folders/documents/add`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        folderId: folderId,
        documentId: documentId
      },
      timeout: 10000
    });

    console.log("Move document response:", response);
    return response.data;
  } catch (error) {
    console.error("Error moving document:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || `Move failed: ${error.response.status}`);
      } else if (error.request) {
        throw new Error("No response from server during move operation.");
      } else {
        throw new Error(`Move error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred during move operation");
    }
  }
};



// documentsAPI.js - Thêm hàm này
export const getDocumentsByFolder = async (folderId, page = 1, limit = 10) => {
  try {
    const token = getToken();
   
    if (!token) {
      throw new Error("No authentication token found");
    }
    
    console.log("Fetching documents for folder:", folderId, `page=${page}&limit=${limit}`);
    const response = await axios({
      method: 'GET',
      url: `http://localhost:3000/folders/${folderId}/documents?page=${page}&limit=${limit}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log("Documents by folder API Response:", response);
    return response.data;
    
  } catch (error) {
    console.error("Error fetching documents by folder:", error);
   
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error("Unauthorized. Please login again.");
        } else if (status === 403) {
          throw new Error("Access denied. You don't have permission.");
        } else if (status === 404) {
          // Trả về mảng rỗng nếu folder không có documents
          return { documents: [], total: 0, totalPages: 0 };
        } else {
          throw new Error(error.response.data.message || `Server error: ${status}`);
        }
      } else if (error.request) {
        throw new Error("No response from server. Please check your connection.");
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};
export const renameDocument = async (documentId, newDocumentName) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log("Renaming document:", documentId, "to:", newDocumentName);
    
    const response = await axios({
      method: 'PATCH',
      url: `http://localhost:3000/documents/${documentId}/update-name`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        newDocumentName: newDocumentName
      },
      timeout: 10000
    });

    console.log("Rename document response:", response);
    return response.data;
  } catch (error) {
    console.error("Error renaming document:", error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || `Rename failed: ${error.response.status}`);
      } else if (error.request) {
        throw new Error("No response from server during rename operation.");
      } else {
        throw new Error(`Rename error: ${error.message}`);
      }
    } else {
      throw new Error("An unexpected error occurred during rename operation");
    }
  }
};



export const toggleFavorite = async (documentId) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await axios({
      method: "POST",
      url: `http://localhost:3000/documents/${documentId}/toggle-favorite`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (err) {
    console.error("Toggle favorite error:", err);
    throw new Error(err.response?.data?.message || "Failed to toggle favorite");
  }
};


// Lấy danh sách favorite
export const getFavorites = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await axios({
      method: "GET",
      url: `http://localhost:3000/documents/favorites`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.favorites;
  } catch (err) {
    console.error("Get favorites error:", err);
    throw new Error(err.response?.data?.message || "Failed to fetch favorites");
  }
};
