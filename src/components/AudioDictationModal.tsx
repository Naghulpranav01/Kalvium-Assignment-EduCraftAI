import React, { useState, useRef } from 'react';
import { Mic, MicOff, Check, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyTranscript: (data: { title?: string; objective?: string; rawText: string }) => void;
}

export const AudioDictationModal: React.FC<Props> = ({ isOpen, onClose, onApplyTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscriptResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg('Microphone access denied or unsupported. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/audio/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64Data, mimeType: 'audio/webm' }),
        });
        const data = await res.json();
        if (data.success) {
          setTranscriptResult(data.transcript);
        } else {
          setErrorMsg(data.error || 'Transcription failed.');
        }
        setIsTranscribing(false);
      };
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process audio.');
      setIsTranscribing(false);
    }
  };

  const handleApply = () => {
    if (!transcriptResult) return;

    let title: string | undefined = undefined;
    let objective: string | undefined = undefined;

    const titleMatch = transcriptResult.match(/(?:title|lesson on|topic is):\s*([^\n\.]+)/i);
    if (titleMatch) title = titleMatch[1].trim();

    const objMatch = transcriptResult.match(/(?:objective|goal|explain|cover):\s*([^\n]+)/i);
    if (objMatch) objective = objMatch[1].trim();

    onApplyTranscript({
      title,
      objective: objective || transcriptResult,
      rawText: transcriptResult,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2f4a]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950 text-teal-300 border border-teal-800">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Voice Dictation (Speech-to-Text)</h3>
              <p className="text-xs text-slate-400">Speak your lesson title, learning goals, or lecture notes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Central Audio Recording Interface */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <div className="text-center">
            <div className="text-sm font-semibold text-white">
              {isRecording ? 'Listening... Speak clearly into microphone' : 'Click microphone to record'}
            </div>
            {isRecording && (
              <div className="text-xs font-mono text-teal-300 mt-1">
                Duration: {recordingSeconds}s
              </div>
            )}
          </div>
        </div>

        {isTranscribing && (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-teal-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Transcribing with Gemini Intelligence...</span>
          </div>
        )}

        {transcriptResult && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">Generated Transcription:</div>
            <div className="p-3 bg-[#0b121f] rounded-lg border border-[#1e2f4a] text-xs text-slate-200 leading-relaxed max-h-40 overflow-y-auto">
              {transcriptResult}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2f4a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {transcriptResult && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Lesson Input</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
