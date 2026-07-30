import axiosInstance from "../api/axiosInstance";

export async function fetchPolicies(params) {
  const { data } = await axiosInstance.get("/api/policies", { params });
  return data;
}

export async function fetchPolicyById(id) {
  const { data } = await axiosInstance.get(`/api/policies/${id}`);
  return data.policy;
}

export async function fetchPoliciesByCustomer(customerId, params = {}) {
  const { data } = await axiosInstance.get("/api/policies", {
    params: { customer_id: customerId, ...params }
  });
  return data;
}

export async function createPolicy(payload) {
  const { data } = await axiosInstance.post("/api/policies", payload);
  return data;
}

export async function updatePolicy(id, payload) {
  const { data } = await axiosInstance.put(`/api/policies/${id}`, payload);
  return data;
}

export async function deletePolicy(id) {
  const { data } = await axiosInstance.delete(`/api/policies/${id}`);
  return data;
}
