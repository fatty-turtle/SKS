import { Modal, Spinner, Alert, Button } from "react-bootstrap";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "forest",
  mindmap: { useMaxWidth: true },
});

const MermaidDiagramModal = ({ show, onClose, diagramCode, error }) => {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!show || !diagramCode) return;

    const timer = setTimeout(() => {
      if (containerRef.current) {
        try {
          mermaid.render("mindmap_svg_id", diagramCode).then(({ svg }) => {
            containerRef.current.innerHTML = svg;
          });
        } catch (e) {
          console.error("Mermaid render error:", e);
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [show, diagramCode]);

  return (
    <Modal show={show} onHide={onClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-diagram-3 me-2 text-primary"></i>
          AI Generated Diagram
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "80vh", overflowY: "auto", overflowX: "auto" }}>
      {error && <Alert variant="warning">{error}</Alert>}


        {!diagramCode && !error && (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="text-muted mt-2">Loading diagram...</p>
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            width: "100%",
            minHeight: "600px",
            background: "#111827",
            padding: "20px",
            borderRadius: "10px",
            overflow: "visible",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>

        {diagramCode && (
          <>
            <Button variant="outline-primary" onClick={() => setZoom(Math.max(0.1, zoom / 1.2))}>
              <i className="bi bi-zoom-out"></i> Zoom Out
            </Button>
            <Button variant="outline-primary" onClick={() => setZoom(zoom * 1.2)}>
              <i className="bi bi-zoom-in"></i> Zoom In
            </Button>
            <Button variant="outline-primary" onClick={() => setZoom(1)}>
              <i className="bi bi-arrow-clockwise"></i> Reset Zoom
            </Button>
            <Button
              variant="dark"
              onClick={() => {
                const blob = new Blob([diagramCode], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "diagram.mmd";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <i className="bi bi-download me-2"></i>
              Download Mermaid Code
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default MermaidDiagramModal;
