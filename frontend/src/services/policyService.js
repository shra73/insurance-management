import axiosInstance from "../api/axiosInstance";

export async function fetchPoliciesByCustomer(customerId, params = {}) {
  const { data } = await axiosInstance.get("/api/policies", {
    params: { customer_id: customerId, ...params }
  });
  return data;
}