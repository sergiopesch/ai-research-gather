import { useEffect, useRef, useState } from 'react';
import { Check, KeyRound, Loader2, X } from 'lucide-react';

type Props = { authenticated: boolean; configured: boolean; onChanged: () => void };

export function PrivateAccess({ authenticated, configured, onChanged }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [accessKey, setAccessKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const reset = () => { setAccessKey(''); setStatus('idle'); setMessage(''); };
    dialog?.addEventListener('close', reset);
    return () => dialog?.removeEventListener('close', reset);
  }, []);

  if (!configured && !authenticated) return null;

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('working');
    setMessage('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Private access could not be started.');
      dialogRef.current?.close();
      onChanged();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Private access could not be started.');
    }
  };

  const signOut = async () => {
    setStatus('working');
    await fetch('/api/logout', { method: 'POST' });
    setStatus('idle');
    onChanged();
  };

  return (
    <>
      {authenticated ? (
        <button type="button" onClick={() => void signOut()} disabled={status === 'working'} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-[#7d5066] transition-colors hover:text-stone-950 disabled:opacity-50">
          {status === 'working' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Private
        </button>
      ) : (
        <button type="button" onClick={() => dialogRef.current?.showModal()} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-950">
          <KeyRound className="h-3.5 w-3.5" /> Private
        </button>
      )}

      <dialog ref={dialogRef} className="m-auto w-[min(92vw,390px)] rounded-lg border border-stone-200 bg-[#fbfaf7] p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/25">
        <form onSubmit={signIn} className="p-6">
          <div className="flex items-start justify-between gap-5">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7d5066]">Owner studio</p><h2 className="mt-2 font-editorial text-2xl">Private access</h2></div>
            <button type="button" onClick={() => dialogRef.current?.close()} className="minimal-icon-button -mr-2 -mt-2" aria-label="Close private access"><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-500">Unlock the models and voices configured securely on this server.</p>
          <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.13em] text-stone-500" htmlFor="owner-access-key">Access key</label>
          <input id="owner-access-key" type="password" autoComplete="current-password" autoFocus required minLength={12} maxLength={256} value={accessKey} onChange={(event) => setAccessKey(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition-colors focus:border-stone-950" />
          {message ? <p role="alert" className="mt-2 text-xs leading-5 text-[#7d5066]">{message}</p> : null}
          <button type="submit" disabled={status === 'working' || accessKey.length < 12} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300">
            {status === 'working' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Unlock studio
          </button>
        </form>
      </dialog>
    </>
  );
}
