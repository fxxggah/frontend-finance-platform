"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useVoiceDraft } from "@/hooks/use-voice-draft";
import { ApiError } from "@/lib/api/errors";
import type { TransactionDraft } from "@/types";

interface Props {
  onDraft: (draft: TransactionDraft) => void;
  onBusyChange: (busy: boolean) => void;
}

export function VoiceTransactionPanel({ onDraft, onBusyChange }: Props) {
  const user = useCurrentUser();
  const recorder = useAudioRecorder();
  const mutation = useVoiceDraft();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const key = useRef<string | null>(null);
  const inFlight = useRef(false);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const player = useRef<HTMLAudioElement>(null);
  const busy = sending || recorder.phase === "requesting" || recorder.phase === "recording";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); };
  }, []);
  useEffect(() => {
    const media = player.current;
    return () => { media?.pause(); media?.removeAttribute("src"); };
  }, [recorder.previewUrl]);
  useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);

  async function sendAudio() {
    if (!recorder.audio || inFlight.current || error) return;
    inFlight.current = true;
    setSending(true);
    onBusyChange(true);
    const controller = new AbortController();
    request.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 50000);
    try {
      key.current ??= crypto.randomUUID();
      const draft = await mutation.mutateAsync({ audio: recorder.audio, key: key.current, signal: controller.signal });
      if (!mounted.current || controller.signal.aborted) return;
      onDraft(draft);
      recorder.discard();
      key.current = null;
      setHasDraft(true); setExpanded(false);
    } catch (failure) {
      if (!mounted.current) return;
      if (failure instanceof ApiError) {
        const message = failure.status === 404 && failure.code !== "RESOURCE_NOT_FOUND"
          ? "A gravação por voz não está disponível neste ambiente. Preencha manualmente."
          : failure.status === 409
            ? "Este envio já foi usado ou está em andamento. Continue manualmente ou faça uma nova gravação."
            : failure.detail;
        setError(message + (failure.retryAfterSeconds ? " Tente depois de " + failure.retryAfterSeconds + " segundos." : ""));
      } else {
        setError(timedOut ? "O envio demorou mais que o esperado. Continue manualmente ou grave novamente."
          : "Não foi possível obter o rascunho. Continue manualmente ou grave novamente.");
      }
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      request.current = null;
      mutation.reset();
      if (mounted.current) setSending(false);
    }
  }

  function recordAgain() {
    if (inFlight.current || !recorder.available) return;
    onBusyChange(true);
    player.current?.pause();
    setError(""); key.current = null;
    void recorder.start();
  }
  function manual() {
    if (inFlight.current) return;
    onBusyChange(false);
    recorder.discard(); setExpanded(false); setError(""); key.current = null;
  }

  const pro = user.data?.plan === "PRO" && !user.isError;
  return (
    <section aria-label="Cadastro por voz" className="space-y-3 rounded-2xl border border-border bg-surface-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-text"><Mic className="size-4" /> Registrar por voz <span className="text-xs text-primary">PRO</span></span>
        {!expanded && <Button type="button" variant="outline" disabled={!pro || user.isPending || user.isError}
          onClick={() => setExpanded(true)}>{hasDraft ? "Gravar novamente" : "Usar gravação"}</Button>}
      </div>
      {!pro && <p className="text-sm text-text-muted">{user.isPending ? "Consultando seu acesso…" : user.isError
        ? "Não foi possível consultar o acesso. Você pode preencher manualmente."
        : "A gravação por voz está disponível para PRO. O formulário manual continua disponível."}</p>}
      {expanded && pro && <>
        <p className="text-sm text-text-muted">Piloto: use apenas dados fictícios. Informe valor, data, categoria e conta ou cartão. Grave uma transação por vez.</p>
        {recorder.available === false && <p role="status" className="text-sm text-text-muted">Este navegador precisa de HTTPS ou localhost e suporte à gravação. Preencha manualmente.</p>}
        <div className="flex flex-wrap gap-2">
          {recorder.phase !== "recording" && recorder.phase !== "requesting" && !sending &&
            <Button type="button" variant="outline" onClick={recordAgain} disabled={!recorder.available}>
              {recorder.audio ? "Gravar novamente" : "Gravar áudio"}
            </Button>}
          {recorder.phase === "recording" && <Button type="button" variant="outline" onClick={recorder.stop}><Square className="size-4" /> Parar gravação</Button>}
          {!sending && <Button type="button" variant="ghost" onClick={manual}>Preencher manualmente</Button>}
        </div>
        {recorder.phase === "requesting" && <p role="status" className="text-sm text-text-muted">Aguardando permissão do microfone…</p>}
        {recorder.phase === "recording" && <p role="status" className="text-sm text-text">Gravando · <span className="tabular-nums">{recorder.seconds}</span> s. A gravação para em até 29 s.</p>}
        {recorder.previewUrl && <audio ref={player} controls src={recorder.previewUrl} aria-label="Ouvir gravação" className="w-full" />}
        {recorder.audio && !error && <Button type="button" variant="outline" onClick={sendAudio} disabled={sending}>
          {sending ? "Preparando rascunho…" : "Preparar rascunho"}
        </Button>}
        {sending && <p role="status" className="text-sm text-text-muted">Aguarde o rascunho. A transação será registrada somente após sua revisão e confirmação.</p>}
      </>}
      {(error || recorder.error) && <p role="alert" className="text-sm text-expense">{error || recorder.error}</p>}
    </section>
  );
}
