import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Button,
  Row,
  Col,
  Modal,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import { uploadDocument } from "../../service/documentsAPI";
import { createFolder, getAllFolders } from "../../service/foldersAPI";
import { isAuthenticated } from "../../utils/auth";

const UploadDocumentsFolder = ({ currentFolder = null, onFolderCreated }) => {
  // Upload file states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUploadFolder, setSelectedUploadFolder] = useState("");
  const [allFolders, setAllFolders] = useState([]);

  // Create folder states
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState("");
  const [selectedParentFolder, setSelectedParentFolder] = useState("");

  const fileInputRef = useRef(null);

  // Fetch all folders
  const fetchAllFolders = async () => {
    try {
      const response = await getAllFolders();
      if (response && response.folders) {
        setAllFolders(response.folders);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
    }
  };

  useEffect(() => {
    if (showCreateFolderModal || showUploadModal) {
      fetchAllFolders();
    }
  }, [showCreateFolderModal, showUploadModal]);

  // Upload logic
  const handleUploadClick = () => {
    setShowUploadModal(true);
    setUploadError("");
    setSelectedFile(null);
    setSelectedUploadFolder("");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File size must be less than 50MB");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const folderIdToUpload = selectedUploadFolder || null;
      const result = await uploadDocument(selectedFile, folderIdToUpload);

      console.log("Upload successful:", result);
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedUploadFolder("");

      alert(result.message || "File uploaded successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Create folder logic
  const handleCreateFolderClick = () => {
    setShowCreateFolderModal(true);
    setFolderError("");
    setFolderName("");
    setSelectedParentFolder(currentFolder ? currentFolder.id : "");
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setFolderError("Please enter a folder name");
      return;
    }

    try {
      setCreatingFolder(true);
      setFolderError("");

      const parentId = selectedParentFolder || null;
      const result = await createFolder(folderName.trim(), parentId);

      console.log("Folder created successfully:", result);
      setShowCreateFolderModal(false);
      setFolderName("");
      setSelectedParentFolder("");

      let successMessage = "Folder created successfully!";
      if (result.message) {
        successMessage = result.message;
      } else if (result.folder && result.folder.name) {
        successMessage = `Folder "${result.folder.name}" created successfully!`;
      }

      alert(successMessage);
      window.location.reload();
    } catch (err) {
      console.error("Create folder error:", err);
      setFolderError(err.message || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  // Recursive folder tree
  const renderFolderOptions = (folders, level = 0) => {
    return folders.map((folder) => (
      <React.Fragment key={folder.id}>
        <option value={folder.id}>
          {"\u00A0".repeat(level * 4)}📁 {folder.name}
        </option>
        {folder.children &&
          folder.children.length > 0 &&
          renderFolderOptions(folder.children, level + 1)}
      </React.Fragment>
    ));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!isAuthenticated()) return null;

  return (
    <>
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col lg={12}>
            <div className="action-buttons">
              <div className="action-card" onClick={handleCreateFolderClick}>
                <div className="icon-text">
                  <i className="bi bi-folder"></i>
                  <span> New Folder</span>
                </div>
                <i className="bi bi-plus-lg plus-icon"></i>
              </div>

              <div className="action-card" onClick={handleUploadClick}>
                <div className="icon-text">
                  <i className="bi bi-file-earmark"></i>
                  <span> New Document</span>
                </div>
                <i className="bi bi-plus-lg plus-icon"></i>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Upload Modal */}
      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-upload me-2"></i> Upload New Document
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {uploadError}
            </Alert>
          )}

          <Form>
            {/* Select File */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select File</Form.Label>
              <Form.Control
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.xlsx,.xls,.pptx,.ppt"
                disabled={uploading}
              />
              <Form.Text className="text-muted">
                Supported formats: PDF, DOC, DOCX, TXT, PowerPoint (Max 50MB)
              </Form.Text>
            </Form.Group>

            {/* Select Folder */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Select Folder <small className="text-muted">(Optional)</small>
              </Form.Label>
              <Form.Select
                value={selectedUploadFolder}
                onChange={(e) => setSelectedUploadFolder(e.target.value)}
                disabled={uploading}
              >
                <option value="">📂 Root (Top Level)</option>
                {allFolders.length > 0 && renderFolderOptions(allFolders)}
              </Form.Select>
            </Form.Group>

            {selectedFile && (
              <Alert variant="info" className="mb-0">
                <div className="d-flex align-items-center">
                  <i className="bi bi-file-earmark me-2"></i>
                  <div>
                    <strong className="d-block">{selectedFile.name}</strong>
                    <small>
                      Size: {formatFileSize(selectedFile.size)} • Type:{" "}
                      {selectedFile.type || "Unknown"}
                    </small>
                  </div>
                </div>
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              <>
                <i className="bi bi-upload me-2"></i>
                Upload File
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        show={showCreateFolderModal}
        onHide={() => setShowCreateFolderModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-folder-plus me-2"></i> Create New Folder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {folderError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {folderError}
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Folder Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                disabled={creatingFolder}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Parent Folder <small className="text-muted">(Optional)</small>
              </Form.Label>
              <Form.Select
                value={selectedParentFolder}
                onChange={(e) => setSelectedParentFolder(e.target.value)}
                disabled={creatingFolder}
              >
                <option value="">📂 Root (Top Level)</option>
                {allFolders.length > 0 && renderFolderOptions(allFolders)}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCreateFolderModal(false)}
            disabled={creatingFolder}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleCreateFolder}
            disabled={!folderName.trim() || creatingFolder}
          >
            {creatingFolder ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Create Folder
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UploadDocumentsFolder;
