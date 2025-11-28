import { Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

import "./assets/styles/Register.css";
import "./assets/styles/Login.css";
import "./assets/styles/UploadDocumentsFolder.css";
import "./assets/styles//Header.css";




function App() {
  return (
    <>
      <Outlet />
    </>
  );
}

export default App;