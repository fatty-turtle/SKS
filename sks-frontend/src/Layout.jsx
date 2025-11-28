import { Route, Routes } from "react-router-dom";
import App from "./App";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import DocumentsList from "./components/documents/DocumentsList";
import DocumentViewer from "./components/DocumentViewer";
import UploadDocumentsFolder from "./components/uploadData/UploadDocumentsFolder";
import FoldersList from "./components/folders/FoldersList";
import { DocumentsProvider } from "./components/DocumentsContext";
import Header from "./components/header/Header";
import FavoriteDocumentsList from "./components/documents/FavoriteDocumentsList";
import SearchResults from "./components/documents/SearchRessult";
import Admin from "./components/admin/Admin";

const Layout = () => {
  return (
    <DocumentsProvider>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />

          <Route
            path="/search"
            element={
              <div>
                <Header />
                <SearchResults />
              </div>
            }
          />

          <Route path="/admin" element={<Admin />} />

          <Route
            path=""
            element={
              <div>
                <Header />
                <UploadDocumentsFolder />
                <FoldersList />
                <DocumentsList />
              </div>
            }
          />
          <Route
            path="/documents/:documentId/view"
            element={<DocumentViewer />}
          />

          <Route
            path="/favorites"
            element={
              <div>
                <Header />
                <FavoriteDocumentsList />
              </div>
            }
          />
        </Route>
      </Routes>
    </DocumentsProvider>
  );
};

export default Layout;
