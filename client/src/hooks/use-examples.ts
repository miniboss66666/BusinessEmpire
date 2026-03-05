import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useHello() {
  return useQuery({
    queryKey: [api.examples.hello.path],
    queryFn: async () => {
      const res = await fetch(api.examples.hello.path, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch from hello endpoint");
      }
      return api.examples.hello.responses[200].parse(await res.json());
    },
    retry: false,
  });
}
