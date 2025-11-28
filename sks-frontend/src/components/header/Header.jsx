import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form, Alert, Navbar, Container, Nav } from "react-bootstrap";
import { updateProfile } from "../../service/updateProfileAPI";
import { FaUserCircle } from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");

  // PROFILE POPUP STATES
  const [showProfile, setShowProfile] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    if (!searchText.trim()) {
      alert("Please enter search keywords");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(searchText)}`);
  };

  const handleUpdateProfile = async () => {
    if (password !== confirmPassword) {
      setMessage("Password does not match");
      return;
    }

    try {
      await updateProfile({ name, password, confirmPassword });
      setMessage("Profile updated successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* NAVBAR FIXED TOP */}
      <Navbar bg="light" expand="lg" className="shadow-sm py-3" sticky="top">
        <Container>

          {/* Logo */}
          <Navbar.Brand
            className="fw-bold fs-3"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            📚SKS
          </Navbar.Brand>

          {/* Toggle button for mobile */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">

            {/* Search Form */}
            <Nav className="mx-auto w-100 d-flex justify-content-center">
              <form
                onSubmit={handleSearch}
                className="d-flex w-100"
                style={{ maxWidth: "450px", gap: "8px" }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search documents..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button className="btn btn-primary">Search</button>
              </form>
            </Nav>

            {/* User Icon */}
            <Nav className="ms-auto">
              <FaUserCircle
                size={38}
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => setShowProfile(true)}
              />
            </Nav>
          </Navbar.Collapse>

        </Container>
      </Navbar>

      {/* PROFILE MODAL */}
      <Modal show={showProfile} onHide={() => setShowProfile(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>User Profile</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {message && <Alert variant="info">{message}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="New password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfile(false)}>
            Close
          </Button>

          <Button variant="success" onClick={handleUpdateProfile}>
            Save Changes
          </Button>

          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Header;
