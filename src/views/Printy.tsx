/**
 * 🧬 PRINTY — TeOPrint z LOKALNEGO modelu.
 *
 * Przeprowadzka z Story (components/TeOLab): tamten szedł do Gemini po kluczu
 * `teo_gemini_key` i zapisywał do Firebase `global_teoprints`. Tu: Ollama przez
 * most, plik .md/.json w `_OtakOs_Wymiar/lab/printy`. Struktura dokumentu ta sama
 * plus sekcja „Czego NIE wiemy" — bo print bez pytań to reklama, nie koncept.
 */
import { useEffect, useState } from 'react';
import { FlaskConical, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { lab, model, kiedy, type Print } from '../lib/lab';

export default function Printy() {
    const [lista, setLista] = useState<Print[]>([]);
    const [problem, setProblem] = useState('');
    const [iskra, setIskra] = useState('');
    const [liczy, setLiczy] = useState(false);
    const [otwarty, setOtwarty] = useState<Print | null>(null);

    const odswiez = () => lab.printy().then(setLista).catch((e) => toast.error(e.message));
    useEffect(() => { void odswiez(); }, []);

    const syntezuj = async () => {
        if (!problem.trim() || !iskra.trim()) return toast.error('Potrzebuję problemu i iskry.');
        setLiczy(true);
        try {
            const p = await lab.syntezuj({ problem, iskra, model: model() });
            toast.success(`TeOPrint „${p.nazwa}" — ${p.sekundy} s, ${p.model}`);
            setOtwarty(p);
            void odswiez();
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setLiczy(false); }
    };

    const usun = async (id: string) => {
        await lab.usunPrint(id);
        if (otwarty?.id === id) setOtwarty(null);
        void odswiez();
    };

    if (otwarty) {
        return (
            <div className="mx-auto max-w-4xl">
                <button onClick={() => setOtwarty(null)} className="mb-3 flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14} /> lista printów</button>
                <div className="rounded-2xl border border-lab-primary/30 bg-lab-panel p-6">
                    <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">{otwarty.silnik} · {kiedy(otwarty.data)} · {otwarty.sekundy} s</div>
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200">{otwarty.tresc}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-lab-primary/30 bg-lab-primary/10"><FlaskConical className="text-lab-primary" /></div>
                    <div>
                        <h2 className="text-2xl font-bold">TeOPrinty</h2>
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">model lokalny · zero chmury · plik na dysku</p>
                    </div>
                </div>
                <label className="block text-xs uppercase tracking-widest text-slate-400">1. Problem
                    <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Opisz wyzwanie (np. brak wody pitnej w strefach suszy…)" className="mt-1 h-24 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-white outline-none focus:border-lab-primary/50" />
                </label>
                <label className="block text-xs uppercase tracking-widest text-slate-400">2. Iskra — Twój pomysł, nawet szalony
                    <textarea value={iskra} onChange={(e) => setIskra(e.target.value)} placeholder="np. magnesy do wyciągania soli z wody…" className="mt-1 h-40 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-white outline-none focus:border-lab-accent/50" />
                </label>
                <button onClick={() => void syntezuj()} disabled={liczy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-700 to-lime-700 py-4 font-bold uppercase tracking-widest text-white disabled:opacity-50">
                    {liczy ? <><Loader2 className="animate-spin" size={18} /> model pisze…</> : 'Uruchom syntezę TeOPrintu'}
                </button>
                <div className="text-[10px] font-mono text-slate-600">model: {model() ?? 'domyślny mostu'} · zapis: _OtakOs_Wymiar/lab/printy/&lt;id&gt;.md</div>
            </div>
            <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-slate-400">Repozytorium ({lista.length})</div>
                {!lista.length && <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs text-slate-500">Pusto. Pierwszy print pojawi się tutaj.</div>}
                {lista.map((p) => (
                    <div key={p.id} className="group rounded-xl border border-white/10 bg-lab-panel p-3">
                        <button onClick={() => lab.print(p.id).then(setOtwarty)} className="block w-full text-left">
                            <div className="text-sm font-bold text-white">{p.nazwa}</div>
                            <div className="text-[10px] text-slate-500">{kiedy(p.data)} · {p.model} · {p.znakow} zn.</div>
                        </button>
                        <button onClick={() => void usun(p.id)} className="mt-1 flex items-center gap-1 text-[10px] text-slate-600 hover:text-red-400"><Trash2 size={11} /> usuń</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
