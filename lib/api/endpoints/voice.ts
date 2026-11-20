import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { USE_MOCK } from "@/lib/config";
import type { TransactionDraft } from "@/types";

const draftSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).nullable(),
  amount: z.number().finite().positive().max(999999999.99).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().min(1).max(255),
  categoryId: z.number().int().positive().nullable(),
  accountId: z.number().int().positive().nullable(),
  creditCardId: z.number().int().positive().nullable(),
  installments: z.number().int().min(1).max(24),
  missingFields: z.array(z.enum(["type", "amount", "date", "categoryId", "paymentSource", "installments"])),
  requiresConfirmation: z.literal(true),
});

export async function createVoiceDraft(audio: Blob, key: string, signal?: AbortSignal): Promise<TransactionDraft> {
  if (USE_MOCK) throw new ApiError({ status: 503, title: "Voz indisponível", detail: "O piloto de voz precisa do backend de desenvolvimento." });
  if (!audio.size || audio.size > 2 * 1024 * 1024) throw new ApiError({
    status: 422, title: "Áudio inválido", detail: "Grave um áudio de até 30 segundos e 2 MiB.",
  });
  const mime = audio.type.split(";")[0].trim().toLowerCase();
  if (!["audio/webm", "audio/mp4", "audio/wav"].includes(mime)) throw new ApiError({
    status: 422, title: "Formato incompatível", detail: "Este formato de gravação não é compatível. Preencha o formulário manualmente.",
  });
  let response: unknown;
  try {
    response = await apiFetch<unknown>("/ai/transaction-drafts", {
      method: "POST", headers: { "Content-Type": mime, "Idempotency-Key": key }, body: audio, signal,
    });
  } catch (error) {
    if (error instanceof ApiError || signal?.aborted) throw error;
    throw new ApiError({ status: 502, title: "Resposta inválida", detail: "Não foi possível ler o rascunho. Preencha manualmente." });
  }
  const result = draftSchema.safeParse(response);
  if (!result.success) throw new ApiError({
    status: 502, title: "Rascunho inválido", detail: "O rascunho não pôde ser validado. Preencha o formulário manualmente.",
  });
  return result.data;
}
