import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button } from "react-bootstrap";
import { postLogin } from "../../service/authAPI";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      const res = await postLogin(email, password);
      console.log("Full API Response:", res);

      if (res.data && res.data.accessToken) {
        const token = res.data.accessToken;

        localStorage.setItem("token", token);

        const decoded = jwtDecode(token);
        console.log("Decoded JWT:", decoded);

        const role = decoded.role || decoded.roles || decoded.userRole;

        if (!role) {
          alert("No role found in token!");
          navigate("/");
          return;
        }

        // Điều hướng theo quyền
        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }

        alert("Login successful!");

      } else {
        alert("Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Login failed");
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <Card className="p-4 shadow-sm" style={{ width: "400px" }}>
        <h3 className="text-center mb-3 fw-bold">Login</h3>
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100">
            Login
          </Button>
        </Form>

        <div className="text-center mt-3">
          <p>
            Do you have an account yet? <a href="/register">Sign Up</a>
          </p>
        </div>
      </Card>
    </Container>
  );
};

export default Login;
