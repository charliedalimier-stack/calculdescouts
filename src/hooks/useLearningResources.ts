import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LearningResource {
  id: string;
  title: string;
  description: string | null;
  type: "video" | "podcast" | "pdf";
  url: string;
  sort_order: number;
}

export function useLearningResources() {
  return useQuery({
    queryKey: ["learning-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_resources" as any)
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as LearningResource[];
    },
  });
}
