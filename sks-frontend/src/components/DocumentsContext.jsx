import { createContext, useState } from "react";

export const DocumentsContext = createContext();

export const DocumentsProvider = ({ children }) => {
  const [currentFolderId, setCurrentFolderId] = useState("root"); 
  const [currentFolder, setCurrentFolder] = useState(null); 
  const [documents, setDocuments] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshDocuments = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const value = {
    currentFolderId,
    setCurrentFolderId,
    currentFolder,
    setCurrentFolder,
    documents,
    setDocuments,
    refreshTrigger,
    refreshDocuments
  };

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
};