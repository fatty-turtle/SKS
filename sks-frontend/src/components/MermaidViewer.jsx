import { useEffect, useRef } from "react";
import mermaid from "mermaid";


mermaid.initialize({
  startOnLoad: false,
  theme: "forest",
  securityLevel: "loose",
  flowchart: { htmlLabels: true },
  mindmap: { useMaxWidth: true },
});


/**
 * Mermaid Viewer giống live-editor mermaid
 */
const MermaidViewer = ({ code }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!code || !ref.current) return;

    try {
      mermaid.render("diagramId", code).then(({ svg }) => {
        ref.current.innerHTML = svg;
      });
    } catch (err) {
      console.error("Mermaid render error", err);
    }
  }, [code]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        minHeight: "600px",
        background: "#111827",
        padding: "20px",
        borderRadius: "8px",
        overflow: "auto",
        color: "white",
      }}
    />
  );
};

export default MermaidViewer;
