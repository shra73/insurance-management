import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchCustomers } from "../services/customerService";

export function useCustomers(params) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => fetchCustomers(params),
    placeholderData: keepPreviousData // avoids a flash back to skeleton when changing page/filters
  });
}