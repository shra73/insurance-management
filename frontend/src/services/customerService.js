import axiosInstance from "../api/axiosInstance";

export async function fetchCustomers(params) {
  const { data } = await axiosInstance.get("/api/customers", { params });
  return data;
}

export async function fetchCustomerById(id) {
  const { data } = await axiosInstance.get(`/api/customers/${id}`);
  return data.customer;
}

export async function createCustomer(payload) {
  const { data } = await axiosInstance.post("/api/customers", payload);
  return data;
}

export async function updateCustomer(id, payload) {
  const { data } = await axiosInstance.put(`/api/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id) {
  const { data } = await axiosInstance.delete(`/api/customers/${id}`);
  return data;
}