import { useQuery } from "@tanstack/react-query";
import { fetchCustomerById } from "../services/customerService";
import { fetchPoliciesByCustomer } from "../services/policyService";

export function useCustomer(id) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomerById(id),
    enabled: !!id
  });
}

export function useCustomerPolicies(id) {
  return useQuery({
    queryKey: ["customer", id, "policies"],
    queryFn: () => fetchPoliciesByCustomer(id, { per_page: 50 }),
    enabled: !!id
  });
}