import axiosInstance from "../api/axiosInstance";

export async function loginRequest(email, password) {
  const response = await axiosInstance.post("/api/auth/login", {
    email,
    password
  });
  return response.data;
}

export async function registerRequest(name, email, password, role = "CUSTOMER") {
  const response = await axiosInstance.post("/api/auth/register", {
    name,
    email,
    password,
    role
  });
  return response.data;
}