import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Button, Spinner, Alert,
  Card, Badge, Modal
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { viewDocument, downloadDocument } from '../service/documentsAPI';
import { isAuthenticated } from '../utils/auth';
import * as mammoth from 'mammoth';
import { summaryAPI } from '../service/summaryAPI';
import { getRelatedDocuments } from '../service/relatedAPI'; 
import '../assets/styles/DocumentViewer.css';
import MermaidViewer from "../components/MermaidViewer";
import MermaidDiagramModal from "../components/MermaidDiagramModal";



const DocumentViewer = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  
  // AI Summary
  const [summary, setSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [hasExistingSummary, setHasExistingSummary] = useState(false);
  const [checkingSummary, setCheckingSummary] = useState(false);
  const [deletingSummary, setDeletingSummary] = useState(false);

  // RELATED DOCUMENTS
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState('');



  // DIAGRAM STATES
const [diagramCode, setDiagramCode] = useState("");
const [showDiagramModal, setShowDiagramModal] = useState(false);
const [loadingDiagram, setLoadingDiagram] = useState(false);
const [diagramError, setDiagramError] = useState("");



  useEffect(() => {
    if (documentId) {
      loadDocument();
      checkExistingSummary();
      loadRelatedDocuments(); // <<-- NEW
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError('');

      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const documentData = JSON.parse(localStorage.getItem('currentDocument') || '{}');
      setDocument(documentData);

      const response = await viewDocument(documentId, documentData.filename);
      setFileInfo({
        blob: response.blob,
        fileExtension: response.fileExtension,
        filename: response.filename
      });

      await renderDocumentContent(response.blob, response.fileExtension, response.filename);
      
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  // LOAD RELATED DOCUMENTS (RIGHT SIDEBAR)
  const loadRelatedDocuments = async () => {
    if (!documentId) return;

    try {
      setRelatedLoading(true);
      setRelatedError('');
      const docs = await getRelatedDocuments(documentId); // service trả về array
      setRelatedDocs((docs || []).slice(0, 6)); // chỉ lấy tối đa 6
    } catch (err) {
      console.error('Error loading related documents:', err);
      setRelatedError('Failed to load related documents');
    } finally {
      setRelatedLoading(false);
    }
  };

  // Kiểm tra xem document đã có summary chưa
  const checkExistingSummary = async () => {
    if (!documentId) return;
    
    try {
      setCheckingSummary(true);
      const existingSummary = await summaryAPI.getSummary(documentId);
      
      if (existingSummary) {
        setHasExistingSummary(true);
        if (existingSummary.summaryText) {
          setSummary(existingSummary.summaryText);
        } else if (existingSummary.summary) {
          setSummary(existingSummary.summary);
        } else if (existingSummary.content) {
          setSummary(existingSummary.content);
        }
      } else {
        setHasExistingSummary(false);
      }
    } catch (err) {
      console.error('Error checking existing summary:', err);
      setHasExistingSummary(false);
    } finally {
      setCheckingSummary(false);
    }
  };

  // Generate AI Summary
  const generateAISummary = async () => {
    if (!documentId) {
      setSummaryError('Document ID is required');
      return;
    }

    try {
      setGeneratingSummary(true);
      setSummaryError('');
      setSummary('');

      const result = await summaryAPI.createSummary(documentId);
      
      if (result.summaryText) {
        setSummary(result.summaryText);
      } else if (result.summary) {
        setSummary(result.summary);
      } else if (result.content) {
        setSummary(result.content);
      } else if (typeof result === 'string') {
        setSummary(result);
      } else {
        setSummary('Summary generated successfully. Please check the content.');
      }
      
      setHasExistingSummary(true);
      setShowSummaryModal(true);
      
    } catch (err) {
      console.error('Error generating summary:', err);
      setSummaryError(err.message || 'Failed to generate summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // View existing AI Summary
  const viewAISummary = async () => {
    if (!documentId) {
      setSummaryError('Document ID is required');
      return;
    }

    try {
      setGeneratingSummary(true);
      setSummaryError('');
      
      const result = await summaryAPI.getSummary(documentId);
      
      if (result) {
        if (result.summaryText) {
          setSummary(result.summaryText);
        } else if (result.summary) {
          setSummary(result.summary);
        } else if (result.content) {
          setSummary(result.content);
        } else if (typeof result === 'string') {
          setSummary(result);
        } else {
          setSummary('No summary content available.');
        }
      } else {
        setSummaryError('No summary found for this document.');
      }
      
      setShowSummaryModal(true);
      
    } catch (err) {
      console.error('Error getting summary:', err);
      setSummaryError(err.message || 'Failed to load summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const confirmRegenerate = () => {
    setShowConfirmModal(true);
  };

  const regenerateAISummary = async () => {
    if (!documentId) return;
    
    try {
      setGeneratingSummary(true);
      setSummaryError('');
      setSummary('');
      setShowConfirmModal(false);

      const result = await summaryAPI.refreshSummary(documentId);
      
      if (result.summaryText) {
        setSummary(result.summaryText);
      } else if (result.summary) {
        setSummary(result.summary);
      } else if (result.content) {
        setSummary(result.content);
      } else if (typeof result === 'string') {
        setSummary(result);
      } else {
        setSummary('Summary regenerated successfully.');
      }
      
      setShowSummaryModal(true);
      
    } catch (err) {
      console.error('Error regenerating summary:', err);
      setSummaryError(err.message || 'Failed to regenerate summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const confirmDeleteSummary = () => {
    setShowDeleteModal(true);
  };

  const deleteSummary = async () => {
    if (!documentId) return;
    
    try {
      setDeletingSummary(true);
      
      await summaryAPI.deleteSummary(documentId);
      
      setHasExistingSummary(false);
      setSummary('');
      setShowDeleteModal(false);
      setShowSummaryModal(false);
      
      setSummaryError('Summary deleted successfully.');
      setTimeout(() => setSummaryError(''), 3000);
      
    } catch (err) {
      console.error('Error deleting summary:', err);
      setSummaryError(err.message || 'Failed to delete summary. Please try again.');
    } finally {
      setDeletingSummary(false);
    }
  };

  const handleDownload = async () => {
    if (!documentId || !document) return;

    try {
      setDownloading(true);
      await downloadDocument(documentId, document.filename || document.title);
    } catch (err) {
      console.error('Download error:', err);
      setError(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };
  // const handleBack = () => {
  //   navigate(-1);
  // };

  const handleBack = () => {
    navigate("/");
  };




const generateDiagram = async () => {

  if (!hasExistingSummary) {
    setDiagramError("You must generate summary first before generating diagram.");
    setShowDiagramModal(true);
    return;
  }
  try {
    setLoadingDiagram(true);
    setDiagramError("");
    setDiagramCode("");

    const result = await summaryAPI.getDiagram(documentId);

    if (!result || !result.diagram) {
      setDiagramError("Diagram data is invalid");
      return;
    }

    // Join array → Mermaid-compatible string
    const mermaidString = result.diagram.join("\n");
    setDiagramCode(mermaidString);

    setDiagramCode(mermaidString);
    setShowDiagramModal(true);

    // Mermaid init
    setTimeout(() => {
      try {
        mermaid.initialize({ startOnLoad: false });
        mermaid.init(undefined, ".mermaid-diagram-render");
      } catch (err) {
        console.error("Mermaid init error:", err);
      }
    }, 200);

  } catch (err) {
    console.error("Error loading diagram:", err);
    setDiagramError(err.message || "Failed to generate diagram");
  } finally {
    setLoadingDiagram(false);
  }
};







  // Render document content
  const renderDocumentContent = async (blob, fileExtension, filename) => {
    try {
      switch (fileExtension.toLowerCase()) {
        case 'pdf':
          await renderPdf(blob);
          break;
        case 'docx':
        case 'doc':
          await renderDocx(blob);
          break;
        case 'txt':
          await renderText(blob);
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
          await renderImage(blob, filename);
          break;
        case 'xlsx':
        case 'xls':
          await renderExcel(blob, filename);
          break;
        case 'pptx':
        case 'ppt':
          await renderPowerpoint(blob, filename);
          break;
        default:
          setError(`File type .${fileExtension} is not supported for viewing`);
      }
    } catch (err) {
      throw new Error(`Failed to render document: ${err.message}`);
    }
  };

  const renderPdf = async (blob) => {
    const url = URL.createObjectURL(blob);
    setContent(`
      <div class="pdf-viewer" style="height: 80vh;">
        <iframe 
          src="${url}" 
          style="width: 100%; height: 100%; border: none; border-radius: 8px;" 
          title="PDF Document"
        ></iframe>
      </div>
    `);
  };

  const renderDocx = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      const htmlContent = `
        <div class="docx-viewer" style="
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          padding: 40px;
          background: white;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
          ${result.value}
        </div>
      `;
      setContent(htmlContent);
      
    } catch (err) {
      throw new Error('Failed to convert DOCX file to HTML');
    }
  };

  const renderText = async (blob) => {
    const text = await blob.text();
    setContent(`
      <div class="text-viewer" style="
        font-family: 'Courier New', monospace;
        white-space: pre-wrap;
        background: #f8f9fa;
        padding: 30px;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        max-height: 70vh;
        overflow-y: auto;
        line-height: 1.5;
      ">
        ${text}
      </div>
    `);
  };

  const renderImage = async (blob, filename) => {
    const url = URL.createObjectURL(blob);
    setContent(`
      <div class="image-viewer" style="text-align: center; padding: 20px;">
        <img 
          src="${url}" 
          alt="${filename}"
          style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"
          onload="URL.revokeObjectURL(this.src)"
        />
      </div>
    `);
  };

  const renderExcel = async (blob, filename) => {
    const url = URL.createObjectURL(blob);
    setContent(`
      <div class="excel-viewer" style="text-align: center; padding: 60px 20px;">
        <div style="background: #f8f9fa; padding: 40px; border-radius: 12px; border: 2px dashed #dee2e6;">
          <i class="bi bi-file-earmark-spreadsheet" style="font-size: 4rem; color: #28a745;"></i>
          <h3 style="margin-top: 20px; color: #495057;">Excel Spreadsheet</h3>
          <p style="color: #6c757d; font-size: 1.1rem;">This file cannot be previewed in the browser.</p>
          <p style="color: #6c757d; margin-bottom: 30px;">Please download the file to view its contents.</p>
          <button 
            class="btn btn-success btn-lg"
            onclick="window.dispatchEvent(new CustomEvent('download-excel'))"
          >
            Download Excel File
          </button>
        </div>
      </div>
    `);

    // Lắng nghe event để gọi handleDownload trong React
    window.addEventListener('download-excel', handleDownload);
  };

  const renderPowerpoint = async (blob, filename) => {
    const url = URL.createObjectURL(blob);
    setContent(`
      <div class="powerpoint-viewer" style="text-align: center; padding: 60px 20px;">
        <div style="background: #f8f9fa; padding: 40px; border-radius: 12px; border: 2px dashed #dee2e6;">
          <i class="bi bi-file-earmark-ppt" style="font-size: 4rem; color: #fd7e14;"></i>
          <h3 style="margin-top: 20px; color: #495057;">PowerPoint Presentation</h3>
          <p style="color: #6c757d; font-size: 1.1rem;">This file cannot be previewed in the browser.</p>
          <p style="color: #6c757d; margin-bottom: 30px;">Please download the file to view its contents.</p>
        </div>
      </div>
    `);

    window.addEventListener('download-ppt', handleDownload);
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" size="lg" />
          <h5 className="mt-3 text-muted">Loading document...</h5>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="mt-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Alert variant="danger" className="text-center">
              <i className="bi bi-exclamation-triangle-fill display-4 d-block text-danger mb-3"></i>
              <h4>Unable to Load Document</h4>
              <p>{error}</p>
              <div className="mt-3">
                <Button variant="outline-danger" className="me-2" onClick={handleBack}>
                  <i className="bi bi-arrow-left me-1"></i> Go Back
                </Button>
                <Button variant="primary" onClick={loadDocument}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Try Again
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="document-viewer-container py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Button
                    variant="dark"
                    onClick={handleBack}
                    className="me-3 btn-prominent"
                  >
                    <i className="bi bi-arrow-left"></i>
                  </Button>
                  <div>
                    <h4 className="mb-1 text-primary">
                      {document?.title || document?.filename || 'Document'}
                    </h4>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="secondary" className="text-uppercase">
                        {fileInfo?.fileExtension || 'unknown'}
                      </Badge>
                      <small className="text-muted">
                        {document?.createdAt ? new Date(document.createdAt).toLocaleDateString() : ''}
                      </small>
                      {document?.size && (
                        <small className="text-muted">
                          • {formatFileSize(document.size)}
                        </small>
                      )}
                      {hasExistingSummary && (
                        <Badge bg="success" className="ms-2">
                          <i className="bi bi-check-circle me-1"></i>
                          AI Summary Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  {/* AI Summary Button */}
                  {checkingSummary ? (
                    <Button variant="dark" disabled className="btn-prominent">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Checking...
                    </Button>
                  ) : hasExistingSummary ? (
                    <>
                      <Button
                        variant="dark"
                        onClick={viewAISummary}
                        disabled={generatingSummary}
                        className="btn-prominent"
                      >
                        {generatingSummary ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-eye me-2"></i>
                            View Summary
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline-dark"
                        onClick={confirmDeleteSummary}
                        disabled={deletingSummary}
                        className="btn-prominent"
                      >
                        {deletingSummary ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-trash me-2"></i>
                            Delete Summary
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="dark"
                      onClick={generateAISummary}
                      disabled={generatingSummary}
                      className="btn-prominent"
                    >
                      {generatingSummary ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-robot me-2"></i>
                          Summary by AI
                        </>
                      )}
                    </Button>
                  )}



                  <Button
  variant="dark"
  className="btn-prominent"
  disabled={loadingDiagram}
  onClick={generateDiagram}
>
  {loadingDiagram ? (
    <>
      <Spinner animation="border" size="sm" className="me-2" />
      Generating...
    </>
  ) : (
    <>
      <i className="bi bi-diagram-3 me-2"></i>
      Diagram
    </>
  )}
</Button>


                  <Button
                    variant="dark"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="btn-prominent"
                  >
                    {downloading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download me-2"></i>
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Document Content + RIGHT SIDEBAR */}
      <Row>
        {/* Main document */}
        <Col lg={9} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0" style={{ minHeight: '70vh' }}>
              {content ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: content }}
                  style={{ height: '100%' }}
                />
              ) : (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="secondary" />
                  <p className="mt-2 text-muted">Rendering document...</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Related documents sidebar */}
        <Col lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              Related Documents
            </Card.Header>
            <Card.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {relatedLoading && (
                <div className="text-center my-3">
                  <Spinner animation="border" size="sm" />
                  <p className="mt-2 text-muted">Loading related documents...</p>
                </div>
              )}

              {relatedError && (
                <Alert variant="danger" className="py-2">
                  {relatedError}
                </Alert>
              )}

              {!relatedLoading && !relatedError && relatedDocs.length === 0 && (
                <p className="text-muted mb-0">No related documents found.</p>
              )}

              {relatedDocs.map((doc) => (
                <Card
                  key={doc.id}
                  className="mb-3 border-0 shadow-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
  const title = doc.title || doc.filename || "document";
  const ext = title.includes('.') ? title.split('.').pop().toLowerCase() : "unknown";

  localStorage.setItem("currentDocument", JSON.stringify({
    ...doc,
    id: doc.id,
    filename: title,
    fileExtension: ext
  }));

  navigate(`/documents/${doc.id}/view`);
}}

                >
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold text-primary" style={{ fontSize: '0.95rem' }}>
                          {doc.title || doc.filename}
                        </div>
                        <small className="text-muted">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}
                        </small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>





      {/* Diagram Modal */}
{/* 
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
  {diagramError && (
    <Alert variant="danger">{diagramError}</Alert>
  )}

  {!diagramError && diagramCode && (
    <MermaidViewer code={diagramCode} />
  )}

  {!diagramCode && !diagramError && (
    <div className="text-center py-4">
      <Spinner animation="border" />
      <p className="text-muted">Generating diagram...</p>
    </div>
  )}
</Modal.Body> */}

{/* <Modal show={showDiagramModal} onHide={() => setShowDiagramModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>
      <i className="bi bi-diagram-3 me-2 text-primary"></i>
      AI Generated Diagram
    </Modal.Title>
  </Modal.Header>
  <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
    {diagramError && (
      <Alert variant="danger">{diagramError}</Alert>
    )}

    {!diagramError && diagramCode && (
      <>
        <pre className="mermaid mermaid-diagram-render">
          {diagramCode}
        </pre>
      </>
    )}

    {!diagramCode && !diagramError && (
      <div className="text-center py-4">
        <Spinner animation="border" />
        <p className="text-muted">Generating diagram...</p>
      </div>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowDiagramModal(false)}>
      Close
    </Button>

    {diagramCode && (
      <Button
        variant="dark"
        onClick={() => {
          const blob = new Blob([diagramCode], { type: "text/plain" });
          const url = URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = "diagram.mmd";
          link.click();
          URL.revokeObjectURL(url);
        }}
      >
        <i className="bi bi-download me-2"></i>
        Download Diagram
      </Button>
    )}
  </Modal.Footer>
</Modal> */}


      {/* AI Summary Modal */}
      <Modal show={showSummaryModal} onHide={() => setShowSummaryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-robot me-2 text-info"></i>
            AI Summary
            {hasExistingSummary && (
              <Badge bg="success" className="ms-2">
                Saved
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {summaryError ? (
            <Alert variant="danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {summaryError}
            </Alert>
          ) : (
            <div className="summary-content">
              {summary ? (
                <div 
                  style={{ 
                    lineHeight: '1.6',
                    fontSize: '1rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Arial, sans-serif',
                    color: '#333'
                  }}
                >
                  {summary
                    .replace(/\\\\n/g, '\n')
                    .replace(/\\\\vws/g, '\n\n')
                    .replace(/\\\\vui/g, '\n')
                    .replace(/=""/g, '"')
                    .replace(/\\"/g, '"')
                  }
                </div>
              ) : (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="info" />
                  <p className="mt-2 text-muted">Generating summary...</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowSummaryModal(false)} className="btn-prominent">
            Close
          </Button>
          {hasExistingSummary && (
            <Button
              variant="dark"
              onClick={confirmRegenerate}
              disabled={generatingSummary}
              className="btn-prominent"
            >
              <i className="bi bi-arrow-repeat me-2"></i>
              Regenerate
            </Button>
          )}
          {hasExistingSummary && (
            <Button
              variant="dark"
              onClick={confirmDeleteSummary}
              disabled={deletingSummary}
              className="btn-prominent"
            >
              <i className="bi bi-trash me-2"></i>
              Delete
            </Button>
          )}
          {summary && (
            <Button
              variant="dark"
              onClick={() => {
                navigator.clipboard.writeText(summary);
                alert('Summary copied to clipboard!');
              }}
              className="btn-prominent"
            >
              <i className="bi bi-clipboard me-2"></i>
              Copy Summary
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Confirm Regenerate Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Regenerate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Are you sure you want to regenerate the summary?
          </Alert>
          <p>The current summary will be permanently replaced with a new one. This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowConfirmModal(false)} className="btn-prominent">
            Cancel
          </Button>
          <Button variant="dark" onClick={regenerateAISummary} disabled={generatingSummary} className="btn-prominent">
            {generatingSummary ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Regenerating...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat me-2"></i>
                Yes, Regenerate
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Are you sure you want to delete this summary?
          </Alert>
          <p>The summary will be permanently deleted. This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowDeleteModal(false)} className="btn-prominent">
            Cancel
          </Button>
          <Button variant="dark" onClick={deleteSummary} disabled={deletingSummary} className="btn-prominent">
            {deletingSummary ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Yes, Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success/Error Messages */}
      {summaryError && (
        <Alert 
          variant={summaryError.includes('successfully') ? 'success' : 'danger'} 
          className="position-fixed top-0 end-0 m-3"
          style={{ zIndex: 1050, minWidth: '300px' }}
          onClose={() => setSummaryError('')}
          dismissible
        >
          {summaryError}
        </Alert>
      )}


      <MermaidDiagramModal
      show={showDiagramModal}
      onClose={() => setShowDiagramModal(false)}
      diagramCode={diagramCode}
      error={diagramError}
    />
    </Container>
  );
};

// Helper function
const formatFileSize = (bytes) => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default DocumentViewer;
