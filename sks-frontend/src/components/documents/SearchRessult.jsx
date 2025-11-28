import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { searchDocuments } from "../../service/searchAPI";
import { Spinner, Alert, Container, Card } from "react-bootstrap";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // -------------------------
  // Helper: Lấy extension file
  // -------------------------
  const getFileExtension = (document) => {
    if (!document) return "unknown";
    const filename = document.title || "";
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "unknown";
  };

  // -------------------------
  // Handle xem file (giống Favorites)
  // -------------------------
  const handleViewDocument = (doc) => {
    if (!doc) return alert("Invalid document");

    const documentId = doc.id;
    const filename = doc.title || "document";
    const fileExtension = getFileExtension(doc);

    // Lưu bản đầy đủ như Favorites
    localStorage.setItem(
      "currentDocument",
      JSON.stringify({
        ...doc,
        id: documentId,
        filename: filename,
        fileExtension: fileExtension,
      })
    );

    navigate(`/documents/${documentId}/view`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await searchDocuments(query);

        const {
          relatedTitleDocuments = [],
          relatedContentDocuments = [],
          relatedTopicDocuments = [],
          relatedFieldDocuments = [],
          relatedKeywordDocuments = [],
        } = res.data;

        const merged = [
          ...relatedTitleDocuments,
          ...relatedContentDocuments,
          ...relatedTopicDocuments,
          ...relatedFieldDocuments,
          ...relatedKeywordDocuments,
        ];

        const unique = Array.from(
          new Map(merged.map((item) => [item.id, item])).values()
        );

        setDocuments(unique);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search documents");
      } finally {
        setLoading(false);
      }
    };

    if (query) load();
  }, [query]);

  return (
    <Container className="mt-4">
      <h2 className="fw-bold mb-4">Search Results for: "{query}"</h2>

      {loading && <Spinner animation="border" />}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && documents.length === 0 && (
        <Alert variant="info">No documents found.</Alert>
      )}

      {!loading && documents.length > 0 && (
        <div className="d-flex flex-column" style={{ gap: "15px" }}>
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="p-3 shadow-sm"
              style={{ cursor: "pointer" }}
              onClick={() => handleViewDocument(doc)} 
            >
              <h5 className="text-primary">{doc.title}</h5>

              <div className="text-muted" style={{ fontSize: "14px" }}>
                <b>Field:</b> {doc.metadata?.field} —{" "}
                <b>Topic:</b> {doc.metadata?.topic}
              </div>

              <div className="mt-1" style={{ fontSize: "13px" }}>
                <b>Keywords:</b> {doc.metadata?.keywords?.join(", ")}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default SearchResults;
