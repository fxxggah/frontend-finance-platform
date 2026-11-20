"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "requesting" | "recording" | "ready" | "error";
interface Recording {
  cancelled: boolean;
  stream?: MediaStream;
  recorder?: MediaRecorder;
  stopTimer?: ReturnType<typeof setTimeout>;
  ticker?: ReturnType<typeof setInterval>;
}
const MAX_BYTES = 2 * 1024 * 1024;

function release(job: Recording) {
  clearTimeout(job.stopTimer);
  clearInterval(job.ticker);
  if (job.recorder?.state === "recording") job.recorder.stop();
  job.stream?.getTracks().forEach(track => track.stop());
}

export function useAudioRecorder() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const active = useRef<Recording | null>(null);
  const preview = useRef<string | null>(null);
  const mounted = useRef(false);

  const clearPreview = useCallback(() => {
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = null;
  }, []);

  const discard = useCallback(() => {
    const job = active.current;
    active.current = null;
    if (job) { job.cancelled = true; release(job); }
    clearPreview();
    if (mounted.current) {
      setAudio(null); setPreviewUrl(null); setSeconds(0); setError(""); setPhase("idle");
    }
  }, [clearPreview]);

  useEffect(() => {
    mounted.current = true;
    setAvailable(window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === "function" && typeof window.MediaRecorder !== "undefined");
    const leave = () => {
      if (active.current) {
        discard();
        if (mounted.current) { setError("Gravação interrompida ao sair da tela. Grave novamente ou preencha manualmente."); setPhase("error"); }
      }
    };
    const visibility = () => { if (document.hidden) leave(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    return () => {
      mounted.current = false;
      const job = active.current;
      active.current = null;
      if (job) { job.cancelled = true; release(job); }
      clearPreview();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave);
    };
  }, [clearPreview, discard]);

  const start = useCallback(async () => {
    if (!available || active.current) return;
    discard();
    const job: Recording = { cancelled: false };
    active.current = job;
    setPhase("requesting");
    const valid = () => mounted.current && !job.cancelled && active.current === job;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      job.stream = stream;
      if (!valid()) { release(job); return; }
      const mime = ["audio/webm;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/mp4"]
        .find(value => MediaRecorder.isTypeSupported(value));
      if (!mime) throw new DOMException("Formato incompatível", "NotSupportedError");
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      job.recorder = recorder;
      const chunks: Blob[] = [];
      let bytes = 0;
      const began = performance.now();
      recorder.addEventListener("dataavailable", event => {
        if (job.cancelled) return;
        if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
        if (bytes > MAX_BYTES && recorder.state === "recording") recorder.stop();
      });
      recorder.addEventListener("error", () => {
        if (!valid()) return;
        job.cancelled = true; release(job); active.current = null;
        setError("O navegador interrompeu a gravação. Grave novamente ou preencha manualmente."); setPhase("error");
      });
      recorder.addEventListener("stop", () => {
        release(job);
        if (!valid()) return;
        active.current = null;
        const blob = new Blob(chunks, { type: recorder.mimeType || mime });
        if (!blob.size || blob.size > MAX_BYTES) {
          setError("A gravação ficou vazia ou excedeu 2 MiB. Grave novamente."); setPhase("error"); return;
        }
        const url = URL.createObjectURL(blob);
        preview.current = url;
        setAudio(blob); setPreviewUrl(url); setPhase("ready");
      }, { once: true });
      recorder.start(250);
      setPhase("recording");
      job.ticker = setInterval(() => { if (valid()) setSeconds(Math.floor((performance.now() - began) / 1000)); }, 1000);
      job.stopTimer = setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 29000);
    } catch (failure) {
      release(job);
      if (!valid()) return;
      active.current = null;
      setError(failure instanceof DOMException && failure.name === "NotAllowedError"
        ? "Microfone bloqueado. Permita o acesso ou preencha manualmente."
        : "Não foi possível gravar neste navegador. Confira o microfone ou preencha manualmente.");
      setPhase("error");
    }
  }, [available, discard]);

  const stop = useCallback(() => {
    const job = active.current;
    if (job?.recorder?.state === "recording") job.recorder.stop();
  }, []);

  return { phase, available, error, seconds, audio, previewUrl, start, stop, discard };
}
