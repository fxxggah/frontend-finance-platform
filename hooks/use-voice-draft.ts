"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVoiceDraft } from "@/lib/api/endpoints/voice";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query/keys";

export function useVoiceDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ audio, key, signal }: { audio: Blob; key: string; signal: AbortSignal }) =>
      createVoiceDraft(audio, key, signal),
    retry: false,
    gcTime: 0,
    onError: error => {
      if (error instanceof ApiError && error.status === 403) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      }
    },
  });
}
