import axios from "axios";

const postLogin = (email, password) => {
  return axios.post("http://localhost:3000/auth/login", {
    email,
    password,
  });
};

const postRegister = (data) => {
  return axios.post("http://localhost:3000/auth/register", data);
};


export { postLogin, postRegister };