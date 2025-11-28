import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Alert,
  Spinner,
  Button,
  Badge,
  Modal,
  Form,
  Dropdown
} from "react-bootstrap";
import { getAllFolders, deleteFolder, createFolder, moveFolder, renameFolder } from "../../service/foldersAPI";
import { isAuthenticated } from "../../utils/auth";
import { DocumentsContext } from "../DocumentsContext";

const FoldersList = () => {
  const [allFolders, setAllFolders] = useState([]);
  const [currentFolders, setCurrentFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalFolders, setTotalFolders] = useState(0);

  // Delete folder states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Create folder states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Move folder states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [folderToMove, setFolderToMove] = useState(null);
  const [selectedMoveParent, setSelectedMoveParent] = useState("");
  const [allFoldersForMove, setAllFoldersForMove] = useState([]);

  // Rename folder states
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [folderToRename, setFolderToRename] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState("");

  // Lấy context từ DocumentsContext
  const { setCurrentFolderId, setCurrentFolder: setContextCurrentFolder } = useContext(DocumentsContext);

  // Hàm để tìm folder theo ID trong toàn bộ cây
  const findFolderById = (folders, folderId) => {
    for (const folder of folders) {
      if (folder.id === folderId) {
        return folder;
      }
      if (folder.children && folder.children.length > 0) {
        const found = findFolderById(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError("");

      // if (!isAuthenticated()) {
      //   setError("Please login to view folders");
      //   setLoading(false);
      //   return;
      // }

      if (!isAuthenticated()) {
        navigate("/login"); 
        return;
      }

      const response = await getAllFolders();
      console.log("Folders data:", response);

      if (response && response.folders && response.folders.length > 0) {
        const rootFolder = response.folders[0];
        const level1Folders = rootFolder.children || [];
        
        setAllFolders(response.folders);
        setCurrentFolders(level1Folders);
        setCurrentFolder(null); 
        setFolderStack([]);
        setTotalFolders(level1Folders.length);
 
        if (rootFolder.id) {
          setCurrentFolderId(rootFolder.id);
          setContextCurrentFolder(rootFolder);
        }
      } else {
        setAllFolders([]);
        setCurrentFolders([]);
        setTotalFolders(0);
        setCurrentFolderId("root");
        setContextCurrentFolder(null);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
      
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        setError("Session expired. Please login again.");
      } else {
        setError(err.message || "Failed to load folders");
      }
      
      setAllFolders([]);
      setCurrentFolders([]);
      setTotalFolders(0);
      setCurrentFolderId("root");
      setContextCurrentFolder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Fetch all folders for move modal
  const fetchAllFoldersForMove = async () => {
    try {
      const response = await getAllFolders();
      if (response && response.folders) {
        setAllFoldersForMove(response.folders);
      }
    } catch (err) {
      console.error("Error fetching folders for move dropdown:", err);
    }
  };

  // Navigate to folder - sử dụng dữ liệu đã có
  const handleFolderClick = (folder) => {
    try {
      // Add current folder to stack before navigating
      if (currentFolder) {
        setFolderStack(prev => [...prev, currentFolder]);
      }
      
      // Tìm folder với đầy đủ children từ dữ liệu đã có
      const targetFolder = findFolderById(allFolders, folder.id);
      if (targetFolder) {
        setCurrentFolder(targetFolder);
        setCurrentFolders(targetFolder.children || []);
        setTotalFolders(targetFolder.children ? targetFolder.children.length : 0);
        
        // Cập nhật folderId cho DocumentsList
        setCurrentFolderId(folder.id);
        setContextCurrentFolder(targetFolder);
      } else {
        setError("Folder not found");
      }
    } catch (err) {
      console.error("Error navigating to folder:", err);
      setError(err.message || "Failed to open folder");
    }
  };

  const handleBackClick = () => {
    if (folderStack.length === 0) {
      const rootFolder = allFolders[0];
      const level1Folders = rootFolder?.children || [];
      setCurrentFolders(level1Folders);
      setCurrentFolder(null);
      setTotalFolders(level1Folders.length);
      
      // Cập nhật về root
      if (rootFolder?.id) {
        setCurrentFolderId(rootFolder.id);
        setContextCurrentFolder(rootFolder);
      }
    } else {
      const previousFolder = folderStack[folderStack.length - 1];
      const newStack = folderStack.slice(0, -1);
      
      setFolderStack(newStack);
      setCurrentFolder(previousFolder);
      setCurrentFolders(previousFolder.children || []);
      setTotalFolders(previousFolder.children ? previousFolder.children.length : 0);
      setCurrentFolderId(previousFolder.id);
      setContextCurrentFolder(previousFolder);
    }
  };

  // Breadcrumb navigation
  const handleBreadcrumbClick = (index) => {
    if (index === 0) {
      // Go to root
      const rootFolder = allFolders[0];
      const level1Folders = rootFolder?.children || [];
      setCurrentFolders(level1Folders);
      setCurrentFolder(null);
      setFolderStack([]);
      setTotalFolders(level1Folders.length);
      
      // Cập nhật về root
      if (rootFolder?.id) {
        setCurrentFolderId(rootFolder.id);
        setContextCurrentFolder(rootFolder);
      }
    } else {
      const targetFolder = folderStack[index - 1];
      const newStack = folderStack.slice(0, index);
      
      setFolderStack(newStack);
      setCurrentFolder(targetFolder);
      setCurrentFolders(targetFolder.children || []);
      setTotalFolders(targetFolder.children ? targetFolder.children.length : 0);
      setCurrentFolderId(targetFolder.id);
      setContextCurrentFolder(targetFolder);
    }
  };

  // Create folder functions
  const handleCreateFolderClick = () => {
    setNewFolderName("");
    setCreateError("");
    setShowCreateModal(true);
  };

  const handleCreateConfirm = async () => {
    if (!newFolderName.trim()) {
      setCreateError("Folder name is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      // Nếu đang ở root, parentId = null
      // Nếu đang ở folder khác, parentId = currentFolder.id
      const parentId = currentFolder ? currentFolder.id : null;
      const result = await createFolder(newFolderName.trim(), parentId);
      console.log("Create folder successful:", result);

      setShowCreateModal(false);
      setNewFolderName("");

      // Show success message
      alert(result.message || "Folder created successfully!");

      // Refresh to get updated data
      await fetchFolders();

    } catch (err) {
      console.error("Create folder error:", err);
      setCreateError(err.message || "Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  // Delete folder functions
  const handleDeleteClick = (folder) => {
    if (!folder) return;

    setFolderToDelete(folder);
    setShowDeleteModal(true);
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!folderToDelete) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const folderId = folderToDelete.id;
      if (!folderId) {
        throw new Error("Invalid folder ID");
      }

      const result = await deleteFolder(folderId);
      console.log("Delete successful:", result);

      setShowDeleteModal(false);
      setFolderToDelete(null);

      alert(result.message || "Folder deleted successfully!");

      // Refresh to get updated data
      await fetchFolders();

    } catch (err) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete folder");
    } finally {
      setDeleting(false);
    }
  };

  // Move folder functions
  const handleMoveClick = (folder) => {
    if (!folder) return;

    setFolderToMove(folder);
    setSelectedMoveParent("");
    setMoveError("");
    setShowMoveModal(true);
    fetchAllFoldersForMove();
  };

  const handleMoveConfirm = async () => {
    if (!folderToMove) return;

    try {
      setMoving(true);
      setMoveError("");

      const folderId = folderToMove.id;
      if (!folderId) {
        throw new Error("Invalid folder ID");
      }

      // Nếu selectedMoveParent rỗng, chuyển đến root (null)
      const newParentId = selectedMoveParent || null;

      const result = await moveFolder(folderId, newParentId);
      console.log("Move successful:", result);

      setShowMoveModal(false);
      setFolderToMove(null);
      setSelectedMoveParent("");

      alert(result.message || "Folder moved successfully!");

      // Refresh to get updated data
      await fetchFolders();

    } catch (err) {
      console.error("Move error:", err);
      setMoveError(err.message || "Failed to move folder");
    } finally {
      setMoving(false);
    }
  };

  // Rename folder functions
  const handleRenameClick = (folder) => {
    if (!folder) return;

    setFolderToRename(folder);
    setRenameFolderName(folder.name || "");
    setRenameError("");
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (!folderToRename || !renameFolderName.trim()) {
      setRenameError("Folder name is required");
      return;
    }

    try {
      setRenaming(true);
      setRenameError("");

      const folderId = folderToRename.id;
      if (!folderId) {
        throw new Error("Invalid folder ID");
      }

      const result = await renameFolder(folderId, renameFolderName.trim());
      console.log("Rename successful:", result);

      setShowRenameModal(false);
      setFolderToRename(null);
      setRenameFolderName("");

      alert(result.message || "Folder renamed successfully!");

      // Refresh to get updated data
      await fetchFolders();

    } catch (err) {
      console.error("Rename error:", err);
      setRenameError(err.message || "Failed to rename folder");
    } finally {
      setRenaming(false);
    }
  };

  // Recursive folder tree cho move modal
  const renderMoveFolderOptions = (folders, level = 0) => {
    return folders.map((folder) => (
      <React.Fragment key={folder.id}>
        <option value={folder.id}>
          {"\u00A0".repeat(level * 4)}📁 {folder.name}
        </option>
        {folder.children &&
          folder.children.length > 0 &&
          renderMoveFolderOptions(folder.children, level + 1)}
      </React.Fragment>
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month}/${day}/${year}, ${hours}:${minutes}`;
    } catch (e) {
      return "Invalid Date";
    }
  };

  const countDocuments = (folder) => {
    return folder.userDocuments ? folder.userDocuments.length : 0;
  };

  const countSubfolders = (folder) => {
    return folder.children ? folder.children.length : 0;
  };

  const truncateText = (text, maxLength = 20) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Custom Dropdown Toggle for three dots menu
  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <Button
      ref={ref}
      variant="outline-secondary"
      size="sm"
      className="btn-actions"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
    >
      <i className="bi bi-three-dots-vertical"></i>
    </Button>
  ));

  // Render breadcrumb
  const renderBreadcrumb = () => {
    const breadcrumbs = [];
    
    // Root breadcrumb
    breadcrumbs.push(
      <Button
        key="root"
        variant="link"
        className="text-decoration-none p-0"
        onClick={() => handleBreadcrumbClick(0)}
      >
        <i className="bi bi-house-fill me-1"></i>
        Root
      </Button>
    );

    // Folder stack breadcrumbs
    folderStack.forEach((folder, index) => {
      breadcrumbs.push(
        <span key={`separator-${index}`} className="mx-2 text-muted">/</span>
      );
      breadcrumbs.push(
        <Button
          key={folder.id}
          variant="link"
          className="text-decoration-none p-0"
          onClick={() => handleBreadcrumbClick(index + 1)}
        >
          {folder.name}
        </Button>
      );
    });

    // Current folder if exists
    if (currentFolder) {
      breadcrumbs.push(
        <span key="current-separator" className="mx-2 text-muted">/</span>
      );
      breadcrumbs.push(
        <span key="current" className="text-dark fw-semibold">
          {currentFolder.name}
        </span>
      );
    }

    return breadcrumbs;
  };

  // Render folder item với dropdown menu
  const renderFolderItem = (folder) => (
    <div
      key={folder.id}
      className="folder-item"
      onClick={() => handleFolderClick(folder)}
    >
      <div className="folder-info">
        <i className="bi bi-folder-fill text-warning fs-5 plus-icon"></i>
        <div className="folder-details">
          <h6 className="mb-0 fw-normal fs-6">{truncateText(folder.name || "Unnamed Folder")}</h6>
          <div className="d-flex align-items-center gap-1">
            <small className="text-muted fs-12">
              {formatDate(folder.createdAt)}
            </small>
            <Badge bg="outline-primary" text="dark" className="fs-12">
              {countSubfolders(folder)} sub
            </Badge>
            <Badge bg="outline-secondary" text="dark" className="fs-12">
              {countDocuments(folder)} docs
            </Badge>
          </div>
        </div>
      </div>
      <div className="folder-actions">
        <Dropdown>
          <Dropdown.Toggle as={CustomToggle} />
          <Dropdown.Menu>
            <Dropdown.Item 
              onClick={(e) => {
                e.stopPropagation();
                handleRenameClick(folder);
              }}
            >
              <i className="bi bi-pencil me-2"></i>
              Rename
            </Dropdown.Item>
            <Dropdown.Item 
              onClick={(e) => {
                e.stopPropagation();
                handleMoveClick(folder);
              }}
            >
              <i className="bi bi-arrow-right-circle me-2"></i>
              Move
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item 
              className="text-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(folder);
              }}
            >
              <i className="bi bi-trash me-2"></i>
              Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-2 text-muted">Loading folders...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col lg={12}>
            <Card className="shadow-sm border-0">
              <Card.Header className="text-dark d-flex justify-content-between align-items-center py-2" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <div>
                  <h4 className="mb-0">
                    <i className="bi bi-folder me-2"></i>
                    {currentFolder ? currentFolder.name : "Folder Structure"}
                  </h4>
                  <small className="opacity-75">
                    {totalFolders} folder(s) found
                  </small>
                </div>

              </Card.Header>

              <Card.Body className="p-0">
                {(currentFolder || folderStack.length > 0) && (
                  <div className="p-3 border-bottom">
                    <nav aria-label="breadcrumb">
                      <div className="d-flex align-items-center">
                        {renderBreadcrumb()}
                      </div>
                    </nav>
                  </div>
                )}

                {error && (
                  <Alert variant="danger" className="m-3 mb-0">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <span>{error}</span>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="ms-auto"
                        onClick={() => setError("")}
                      >
                        <i className="bi bi-x"></i>
                      </Button>
                    </div>
                  </Alert>
                )}

                {!error && currentFolders.length === 0 && (
                  <div className="text-center py-5">
                    <i className="bi bi-folder-x display-1 text-muted"></i>
                    <h5 className="text-muted mt-3">No folders found</h5>
                    <p className="text-muted">
                      {currentFolder 
                        ? `No subfolders in "${currentFolder.name}"` 
                        : "There are no folders to display."
                      }
                    </p>
                  </div>
                )}

                {!error && currentFolders.length > 0 && (
                  <div className="p-3">
                    <div className="folder-grid">
                      {currentFolders.map(renderFolderItem)}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create Folder Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-folder-plus text-primary me-2"></i>
            Create New Folder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {createError}
            </Alert>
          )}

          <Form.Group>
            <Form.Label>Folder Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateConfirm();
                }
              }}
            />
          </Form.Group>

          {currentFolder && (
            <Alert variant="info" className="mt-3">
              <i className="bi bi-info-circle me-2"></i>
              This folder will be created inside "{currentFolder.name}"
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCreateModal(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateConfirm}
            disabled={creating || !newFolderName.trim()}
          >
            {creating ? (
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

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {deleteError}
            </Alert>
          )}

          <p className="mb-3">
            Are you sure you want to delete this folder? This action cannot be undone.
          </p>

          {folderToDelete && (
            <Alert variant="warning">
              <div className="d-flex align-items-start">
                <i className="bi bi-folder-fill text-warning me-2 mt-1"></i>
                <div>
                  <strong className="d-block">
                    {folderToDelete.name || "Unknown Folder"}
                  </strong>
                  <small className="text-muted d-block">
                    ID: {folderToDelete.id} • Created: {formatDate(folderToDelete.createdAt)}
                  </small>
                  <small className="text-muted">
                    Contains: {countSubfolders(folderToDelete)} subfolders, {countDocuments(folderToDelete)} documents
                  </small>
                </div>
              </div>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Delete Folder
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Move Folder Modal */}
      <Modal
        show={showMoveModal}
        onHide={() => setShowMoveModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-arrow-right-circle text-primary me-2"></i>
            Move Folder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {moveError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {moveError}
            </Alert>
          )}

          {folderToMove && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-start">
                <i className="bi bi-folder-fill text-warning me-2 mt-1"></i>
                <div>
                  <strong>Moving: {folderToMove.name}</strong>
                  <br />
                  <small className="text-muted">
                    Current location: {currentFolder ? currentFolder.name : "Root"}
                  </small>
                </div>
              </div>
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Destination Folder <small className="text-muted">(Required)</small>
            </Form.Label>
            <Form.Select
              value={selectedMoveParent}
              onChange={(e) => setSelectedMoveParent(e.target.value)}
              disabled={moving}
            >
              <option value="">📂 Root (Top Level)</option>
              {allFoldersForMove.length > 0 && renderMoveFolderOptions(allFoldersForMove)}
            </Form.Select>
            <Form.Text className="text-muted">
              Select where you want to move this folder
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMoveModal(false)}
            disabled={moving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleMoveConfirm}
            disabled={moving || !folderToMove || selectedMoveParent === undefined}
          >
            {moving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Moving...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-right-circle me-2"></i>
                Move Folder
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        show={showRenameModal}
        onHide={() => setShowRenameModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil text-primary me-2"></i>
            Rename Folder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renameError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {renameError}
            </Alert>
          )}

          {folderToRename && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-start">
                <i className="bi bi-folder-fill text-warning me-2 mt-1"></i>
                <div>
                  <strong>Renaming: {folderToRename.name}</strong>
                  <br />
                  <small className="text-muted">
                    Current location: {currentFolder ? currentFolder.name : "Root"}
                  </small>
                </div>
              </div>
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              New Folder Name <small className="text-muted">(Required)</small>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter new folder name"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRenameConfirm();
                }
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRenameModal(false)}
            disabled={renaming}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRenameConfirm}
            disabled={renaming || !renameFolderName.trim()}
          >
            {renaming ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Renaming...
              </>
            ) : (
              <>
                <i className="bi bi-pencil me-2"></i>
                Rename Folder
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS Styles */}
      <style jsx>{`
        .folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        .folder-item {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .folder-item:hover {
          background-color: #f8f9fa;
          border-color: #adb5bd;
        }
        
        .folder-info {
          display: flex;
          align-items: center;
          flex: 1;
          gap: 0.75rem;
        }
        
        .folder-details {
          flex: 1;
        }
        
        .folder-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-actions {
          border: 1px solid #6c757d;
          background-color: transparent;
          color: #6c757d;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          transition: all 0.15s ease;
        }
        
        .btn-actions:hover {
          background-color: #6c757d;
          border-color: #6c757d;
          color: white;
        }
        
        .fs-12 {
          font-size: 0.75rem;
        }
        
        .plus-icon {
          flex-shrink: 0;
        }

        /* Style cho dropdown menu */
        .dropdown-menu {
          min-width: 160px;
        }
        
        .dropdown-item {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        .dropdown-item.text-danger:hover {
          background-color: #f8d7da;
        }
      `}</style>
    </>
  );
};

export default FoldersList;