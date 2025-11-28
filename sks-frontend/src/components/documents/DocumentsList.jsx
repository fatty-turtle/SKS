import { useState, useEffect, useContext, useRef } from "react";
import {
  Container,
  Card,
  Table,
  Alert,
  Spinner,
  Button,
  Row,
  Col,
  Badge,
  Modal,
  Form,
  Pagination,
  Dropdown,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getDocumentsByFolderId,
  deleteDocument,
  moveDocumentToFolder,
  downloadDocument,
  viewDocument,
  toggleFavorite,
} from "../../service/documentsAPI";
import { getAllFolders } from "../../service/foldersAPI";
import { isAuthenticated } from "../../utils/auth";
import { DocumentsContext } from "../DocumentsContext";

const DocumentsList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [totalPages, setTotalPages] = useState(1);

  // Delete document states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Move document states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [documentToMove, setDocumentToMove] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [allFolders, setAllFolders] = useState([]);

  // Rename document states
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [documentToRename, setDocumentToRename] = useState(null);
  const [newDocumentName, setNewDocumentName] = useState("");

  // Download state
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const navigate = useNavigate();

  // Lấy state từ context
  const {
    currentFolderId,
    currentFolder,
    documents,
    setDocuments,
    refreshTrigger,
    refreshDocuments,
  } = useContext(DocumentsContext);

  const [togglingFavorite, setTogglingFavorite] = useState(null);

  // Fetch all folders for move functionality
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

  // Hàm fetch documents
  const fetchDocuments = async (
    folderId = currentFolderId,
    page = currentPage,
    limit = itemsPerPage
  ) => {
    // Nếu không có folderId hợp lệ, không fetch
    if (!folderId || folderId === "root") {
      setDocuments([]);
      setTotalDocuments(0);
      setTotalPages(1);
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (!isAuthenticated()) {
        setError("Please login to view documents");
        setLoading(false);
        return;
      }

      const response = await getDocumentsByFolderId(folderId, page, limit);
      console.log("Documents data:", response);

      if (response && response.documents) {
        setDocuments(response.documents);
        setTotalDocuments(response.total || response.documents.length);
        setTotalPages(
          response.totalPages ||
            Math.ceil((response.total || response.documents.length) / limit)
        );
      } else {
        setDocuments([]);
        setTotalDocuments(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        setError("Session expired. Please login again.");
      } else if (err.message.includes("404")) {
        // No documents in this folder, this is normal
        setDocuments([]);
        setTotalDocuments(0);
        setTotalPages(1);
        setError("");
      } else {
        setError(err.message || "Failed to load documents");
      }
      setDocuments([]);
      setTotalDocuments(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Effect để fetch documents khi folderId thay đổi
  useEffect(() => {
    if (currentFolderId && currentFolderId !== "root") {
      setCurrentPage(1);
      fetchDocuments(currentFolderId, 1, itemsPerPage);
    } else {
      // Nếu là root hoặc không có folderId, clear documents
      setDocuments([]);
      setTotalDocuments(0);
      setTotalPages(1);
    }
  }, [currentFolderId]);

  // Effect để fetch documents khi refreshTrigger thay đổi
  useEffect(() => {
    if (currentFolderId && currentFolderId !== "root") {
      fetchDocuments(currentFolderId, currentPage, itemsPerPage);
    }
  }, [refreshTrigger]);

  // Effect để fetch documents khi page thay đổi
  // Effect để fetch documents khi page thay đổi - ĐÃ SỬA
  useEffect(() => {
    if (currentFolderId && currentFolderId !== "root") {
      fetchDocuments(currentFolderId, currentPage, itemsPerPage);
    }
  }, [currentPage]);

  // Effect để fetch documents khi itemsPerPage thay đổi - ĐÃ SỬA
  useEffect(() => {
    if (currentFolderId && currentFolderId !== "root") {
      setCurrentPage(1);
      fetchDocuments(currentFolderId, 1, itemsPerPage);
    }
  }, [itemsPerPage]);

  const handleRefresh = () => {
    fetchDocuments(currentFolderId, currentPage, itemsPerPage);
  };

  // Delete document functions
  const handleDeleteClick = (document) => {
    if (!document) return;
    setDocumentToDelete(document);
    setShowDeleteModal(true);
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    try {
      setDeleting(true);
      setDeleteError("");
      const documentId = documentToDelete.id;
      if (!documentId) {
        throw new Error("Invalid document ID");
      }

      const result = await deleteDocument(documentId);
      console.log("Delete successful:", result);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      alert(result.message || "Document deleted successfully!");

      // Refresh documents list - handle pagination when deleting last item
      if (documents.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        await fetchDocuments(currentFolderId, newPage, itemsPerPage);
      } else {
        await fetchDocuments(currentFolderId, currentPage, itemsPerPage);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  // Move document functions
  const handleMoveClick = (document) => {
    if (!document) return;
    setDocumentToMove(document);
    setSelectedFolderId("");
    setMoveError("");
    setShowMoveModal(true);
    fetchAllFolders();
  };

  const handleMoveConfirm = async () => {
    if (!documentToMove || !selectedFolderId) {
      setMoveError("Please select a folder");
      return;
    }

    try {
      setMoving(true);
      setMoveError("");
      const documentId = documentToMove.id;
      if (!documentId) {
        throw new Error("Invalid document ID");
      }

      const result = await moveDocumentToFolder(documentId, selectedFolderId);
      console.log("Move successful:", result);
      setShowMoveModal(false);
      setDocumentToMove(null);
      setSelectedFolderId("");
      alert(result.message || "Document moved successfully!");

      await fetchDocuments(currentFolderId, currentPage, itemsPerPage);
    } catch (err) {
      console.error("Move error:", err);
      setMoveError(err.message || "Failed to move document");
    } finally {
      setMoving(false);
    }
  };

  // Rename document functions
  const handleRenameClick = (document) => {
    if (!document) return;
    setDocumentToRename(document);
    setNewDocumentName(document.title || "");
    setRenameError("");
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (!documentToRename || !newDocumentName.trim()) {
      setRenameError("Please enter a valid document name");
      return;
    }

    try {
      setRenaming(true);
      setRenameError("");
      const documentId = documentToRename.id;
      if (!documentId) {
        throw new Error("Invalid document ID");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `http://localhost:3000/documents/${documentId}/update-name`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newDocumentName: newDocumentName.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Rename failed: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Rename successful:", result);
      setShowRenameModal(false);
      setDocumentToRename(null);
      setNewDocumentName("");
      alert(result.message || "Document renamed successfully!");

      await fetchDocuments(currentFolderId, currentPage, itemsPerPage);
    } catch (err) {
      console.error("Rename error:", err);
      setRenameError(err.message || "Failed to rename document");
    } finally {
      setRenaming(false);
    }
  };

  // View document function
  const handleView = async (document) => {
    if (!document) {
      alert("Invalid document");
      return;
    }

    try {
      const documentId = document.id;
      if (!documentId) {
        alert("Document ID not found");
        return;
      }

      const filename = document.title || "document";
      const fileExtension = getFileExtension(document);

      localStorage.setItem(
        "currentDocument",
        JSON.stringify({
          ...document,
          id: documentId,
          filename: filename,
          fileExtension: fileExtension,
        })
      );

      navigate(`/documents/${documentId}/view`);
    } catch (err) {
      console.error("View error:", err);
      alert(`Cannot view document: ${err.message}`);
    }
  };

  // Download document function
  const handleDownload = async (documentItem) => {
    if (!documentItem) return;
    try {
      const documentId = documentItem.id;
      const filename = documentItem.title || "document";
      if (!documentId) {
        alert("Document ID not found");
        return;
      }

      setDownloading(true);
      setDownloadingId(documentId);

      await downloadDocument(documentId, filename);
      console.log("Download successful:", filename);

      // Refresh documents list after download
      await fetchDocuments(currentFolderId, currentPage, itemsPerPage);
    } catch (err) {
      console.error("Download error:", err);
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
      setDownloadingId(null);
    }
  };

  const handleDocumentNameClick = (document) => {
    handleView(document);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  // Helper functions
  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getFileExtension = (document) => {
    if (!document) return "unknown";
    const filename = document.title || "";
    if (!filename) return "unknown";
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "unknown";
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return "bi-file-earmark";
    const extension = getFileExtension({ title: fileName });
    const iconMap = {
      pdf: "bi-file-earmark-pdf text-danger",
      doc: "bi-file-earmark-word text-primary",
      docx: "bi-file-earmark-word text-primary",
      txt: "bi-file-earmark-text text-secondary",
      jpg: "bi-file-earmark-image text-info",
      jpeg: "bi-file-earmark-image text-info",
      png: "bi-file-earmark-image text-info",
      gif: "bi-file-earmark-image text-info",
      bmp: "bi-file-earmark-image text-info",
      xlsx: "bi-file-earmark-excel text-success",
      xls: "bi-file-earmark-excel text-success",
      pptx: "bi-file-earmark-ppt text-warning",
      ppt: "bi-file-earmark-ppt text-warning",
      zip: "bi-file-earmark-zip text-warning",
      rar: "bi-file-earmark-zip text-warning",
    };
    return iconMap[extension] || "bi-file-earmark text-secondary";
  };

  const getStatusVariant = (status) => {
    const statusMap = {
      processed: "success",
      processing: "warning",
      pending: "secondary",
      failed: "danger",
    };
    return statusMap[status?.toLowerCase()] || "secondary";
  };

  // Render folder options for move modal
  const renderFolderOptions = (folders, level = 0) => {
    let options = [];
    folders.forEach((folder) => {
      const indent = " ".repeat(level);
      options.push(
        <option key={folder.id} value={folder.id}>
          {indent}📁 {folder.name}
        </option>
      );
      if (folder.children && folder.children.length > 0) {
        options = options.concat(
          renderFolderOptions(folder.children, level + 1)
        );
      }
    });
    return options;
  };

  const handleToggleFavorite = async (documentId) => {
    try {
      await toggleFavorite(documentId);

      // Update local UI state
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === documentId ? { ...doc, isFavorite: !doc.isFavorite } : doc
        )
      );

      window.location.reload();
    } catch (e) {
      console.error("Favorite error:", e);
      alert("Failed to update favorite status");
    }
  };

  // Render pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    return items;
  };

  // Render folder indicator
  const renderFolderIndicator = () => {
    if (currentFolderId && currentFolderId !== "root") {
      return (
        <div className="d-flex align-items-center justify-content-between mb-3 p-3 bg-light border-bottom">
          <div className="d-flex align-items-center">
            <Badge bg="info" className="me-2">
              <i className="bi bi-folder me-1"></i> Folder View
            </Badge>
            <small className="text-muted">
              Showing documents from selected folder
            </small>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-2 text-muted">Loading documents...</p>
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
              <Card.Header
                className="text-dark d-flex justify-content-between align-items-center py-2"
                style={{
                  backgroundColor: "#f8f9fa",
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                <div>
                  <h4 className="mb-0">
                    <i className="bi bi-folder me-2"></i>{" "}
                    {currentFolderId && currentFolderId !== "root"
                      ? "Folder Documents"
                      : "My Documents"}
                  </h4>
                  <small className="opacity-75">
                    {totalDocuments} document(s) found • Page {currentPage} of{" "}
                    {totalPages}{" "}
                    {currentFolderId &&
                      currentFolderId !== "root" &&
                      " • Filtered by folder"}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => navigate("/favorites")}
                  >
                    <i className="bi bi-heart-fill me-1"></i> My Favorites
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {renderFolderIndicator()}
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
                {!error && (!currentFolderId || currentFolderId === "root") && (
                  <div className="text-center py-5">
                    <i className="bi bi-folder-x display-1 text-muted"></i>
                    <h5 className="text-muted mt-3">Viewing Root Directory</h5>
                    <p className="text-muted">
                      Select a folder from the folder list to view its
                      documents.
                    </p>
                  </div>
                )}
                {!error &&
                  currentFolderId &&
                  currentFolderId !== "root" &&
                  documents.length === 0 && (
                    <div className="text-center py-5">
                      <i className="bi bi-folder-x display-1 text-muted"></i>
                      <h5 className="text-muted mt-3">No documents found</h5>
                      <p className="text-muted">
                        {currentFolder
                          ? `No documents in "${currentFolder.name}"`
                          : "No documents available."}
                      </p>
                    </div>
                  )}
                {!error && documents.length > 0 && (
                  <>
                    {/* ĐÃ BỎ table-responsive để không có cuộn */}
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th width="50" className="text-center">
                            #
                          </th>
                          <th>Document Name</th>
                          <th width="120">File Type</th>
                          <th width="120">Status</th>
                          <th width="140">Created Date</th>
                          <th width="100">Size</th>
                          <th width="100" className="text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc, index) => {
                          if (!doc) return null;
                          const fileIcon = getFileIcon(doc.title);
                          const fileExtension = getFileExtension(doc);
                          return (
                            <tr key={doc.id || index}>
                              <td className="text-center text-muted">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </td>
                              <td>
                                <div
                                  className="d-flex align-items-center cursor-pointer"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleDocumentNameClick(doc)}
                                  title="Click to view document"
                                >
                                  <i
                                    className={`bi ${fileIcon} me-2`}
                                    style={{ fontSize: "1.2rem" }}
                                  ></i>
                                  <div>
                                    <strong className="text-primary d-block hover-underline">
                                      {doc.title || "Unnamed Document"}
                                    </strong>
                                    {doc.description && (
                                      <small className="text-muted">
                                        {doc.description}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge
                                  bg="outline-secondary"
                                  text="dark"
                                  className="text-uppercase border"
                                >
                                  {fileExtension}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={getStatusVariant(doc.status)}>
                                  {doc.status || "unknown"}
                                </Badge>
                              </td>
                              <td className="text-muted">
                                {formatDate(doc.createdAt)}
                              </td>
                              <td className="text-muted">
                                {doc.formattedFileSize || "N/A"}
                              </td>
                              <td>
                                <div className="d-flex justify-content-center">
                                  <Dropdown>
                                    <Dropdown.Toggle
                                      variant="outline-secondary"
                                      size="sm"
                                      id="dropdown-actions"
                                      className="d-flex align-items-center"
                                    >
                                      <i className="bi bi-three-dots"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item
                                        onClick={() => handleDownload(doc)}
                                      >
                                        <i className="bi bi-download me-2"></i>
                                        {downloading &&
                                        downloadingId === doc.id ? (
                                          <>
                                            <Spinner
                                              animation="border"
                                              size="sm"
                                              className="me-1"
                                            />
                                            Downloading...
                                          </>
                                        ) : (
                                          "Download"
                                        )}
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        onClick={() =>
                                          handleToggleFavorite(doc.id)
                                        }
                                      >
                                        <i className="bi bi-heart me-2 text-danger"></i>
                                        {doc.isFavorite
                                          ? "Unfavorite"
                                          : "Favorite"}
                                      </Dropdown.Item>

                                      {/* ĐÃ BỎ nút View trong dropdown */}
                                      <Dropdown.Divider />
                                      <Dropdown.Item
                                        onClick={() => handleRenameClick(doc)}
                                      >
                                        <i className="bi bi-pencil me-2"></i>
                                        Rename
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        onClick={() => handleMoveClick(doc)}
                                      >
                                        <i className="bi bi-folder me-2"></i>
                                        Move
                                      </Dropdown.Item>
                                      <Dropdown.Divider />
                                      <Dropdown.Item
                                        onClick={() => handleDeleteClick(doc)}
                                        className="text-danger"
                                      >
                                        <i className="bi bi-trash me-2"></i>
                                        Delete
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center p-3 border-top">
                        <div className="d-flex align-items-center">
                          <span className="text-muted me-2">Show:</span>
                          <Form.Select
                            size="sm"
                            style={{ width: "80px" }}
                            value={itemsPerPage}
                            onChange={(e) =>
                              handleItemsPerPageChange(Number(e.target.value))
                            }
                          >
                            <option value={5}>5</option>
                            <option value={7}>7</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                          </Form.Select>
                          <span className="text-muted ms-2">per page</span>
                        </div>
                        <Pagination className="mb-0">
                          <Pagination.Prev
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                          />
                          {renderPaginationItems()}
                          <Pagination.Next
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                          />
                        </Pagination>
                        <div className="text-muted">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(currentPage * itemsPerPage, totalDocuments)}{" "}
                          of {totalDocuments} documents
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
              {!error && documents.length > 0 && totalPages === 1 && (
                <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Showing {documents.length} of {totalDocuments} documents
                  </small>
                  <small className="text-muted">
                    Last updated: {new Date().toLocaleTimeString()}
                  </small>
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>
      </Container>

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
            Are you sure you want to delete this document? This action cannot be
            undone.
          </p>
          {documentToDelete && (
            <Alert variant="warning">
              <div className="d-flex align-items-start">
                <i className="bi bi-file-earmark me-2 mt-1"></i>
                <div>
                  <strong className="d-block">
                    {documentToDelete.title || "Unknown Document"}
                  </strong>
                  <small className="text-muted d-block">
                    Type: .{getFileExtension(documentToDelete)} • Size:{" "}
                    {formatFileSize(documentToDelete.metadata?.size)} • Created:{" "}
                    {formatDate(documentToDelete.createdAt)}
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
                Delete Document
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Move Document Modal */}
      <Modal
        show={showMoveModal}
        onHide={() => setShowMoveModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-folder me-2"></i>
            Move Document to Folder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {moveError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {moveError}
            </Alert>
          )}
          {documentToMove && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark me-2"></i>
                <div>
                  <strong>Document:</strong> {documentToMove.title}
                </div>
              </div>
            </Alert>
          )}
          <Form.Group>
            <Form.Label>Select Folder</Form.Label>
            <Form.Select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
            >
              <option value="">Choose a folder...</option>
              {allFolders.length > 0 ? (
                renderFolderOptions(allFolders)
              ) : (
                <option disabled>No folders available</option>
              )}
            </Form.Select>
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
            disabled={moving || !selectedFolderId}
          >
            {moving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Moving...
              </>
            ) : (
              <>
                <i className="bi bi-folder me-2"></i>
                Move Document
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rename Document Modal */}
      <Modal
        show={showRenameModal}
        onHide={() => setShowRenameModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Rename Document
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renameError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {renameError}
            </Alert>
          )}
          {documentToRename && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark me-2"></i>
                <div>
                  <strong>Current Name:</strong> {documentToRename.title}
                </div>
              </div>
            </Alert>
          )}
          <Form.Group>
            <Form.Label>New Document Name</Form.Label>
            <Form.Control
              type="text"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              placeholder="Enter new document name"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleRenameConfirm();
                }
              }}
            />
            <Form.Text className="text-muted">
              Enter the new name for this document (without file extension)
            </Form.Text>
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
            disabled={renaming || !newDocumentName.trim()}
          >
            {renaming ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Renaming...
              </>
            ) : (
              <>
                <i className="bi bi-pencil me-2"></i>
                Rename Document
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .cursor-pointer:hover {
          background-color: #f8f9fa;
        }
        .hover-underline:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
};

export default DocumentsList;
