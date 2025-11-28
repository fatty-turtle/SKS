import { useEffect, useState } from "react";
import { getAllUsers, deactivateUser, activateUser } from "../../service/adminAPI";
import { Table, Container, Spinner, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const loadUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("NOT_AUTHENTICATED");
      return;
    }
    loadUsers();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;

    try {
      await deactivateUser(id);
      alert("User deactivated successfully");
      loadUsers();
    } catch (err) {
      alert("Failed to deactivate");
      console.error(err);
    }
  };

  // Handle activate
  const handleActivate = async (id) => {
    try {
      await activateUser(id);
      alert("User activated successfully");
      loadUsers();
    } catch (err) {
      alert("Failed to activate");
      console.error(err);
    }
  };

  return (
    <Container className="mt-4">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Admin – Manage Users</h2>

        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Nếu chưa login */}
      {error === "NOT_AUTHENTICATED" && (
        <Alert variant="warning" className="text-center">
          <h5>Please log in again</h5>
          <Button variant="primary" onClick={() => navigate("/login")}>
            Login here
          </Button>
        </Alert>
      )}

      {/* Loading */}
      {loading && <Spinner animation="border" />}

      {/* Lỗi khác */}
      {error && error !== "NOT_AUTHENTICATED" && (
        <Alert variant="danger">{error}</Alert>
      )}

      {/* Chỉ render table nếu có token và không lỗi */}
      {!loading && !error && token && (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ width: "180px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u, index) => (
              <tr key={u.id}>
                <td>{index + 1}</td>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td>{u.isActive ? "Active" : "Inactive"}</td>

                <td>
                  {u.isActive ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeactivate(u.id)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleActivate(u.id)}
                    >
                      Activate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Admin;
