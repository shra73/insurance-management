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

export async function fetchCurrentUser() {
  const { data } = await axiosInstance.get("/api/auth/me");
  return data.user;
}

export async function updateProfileRequest(name) {
  const { data } = await axiosInstance.patch("/api/auth/me", { name });
  return data;
}

export async function changePasswordRequest(currentPassword, newPassword) {
  const { data } = await axiosInstance.post("/api/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword
  });
  return data;
}