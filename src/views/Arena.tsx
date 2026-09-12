/**
 * ⚔️ ARENA — przeciągnij kilka TeOgochi ze stada i daj im temat. Każdy mówi
 * swoją dziedziną (persona z migawki mostu: imię, dziedzina, etap), N rund,
 * na końcu wnioski. Wszystko przez Ollamę, w tle na moście — można zamknąć
 * kartę i wrócić.
 *
 * Stado przychodzi z /api/lab/stado (migawka publikowana przez Katedrę). Gdy
 * migawki nie ma — Arena mówi to wprost, nie wymyśla agentów.
 */
import { useEffect, useRef, useState } from 'react';
import { Swords, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { lab, model, kiedy, type Gatunek, type Arena as ArenaT } from '../lib/lab';

export default function Arena() {
    const [stado, setStado] = useState<Gatunek[]>([]);
    const [powod, setPowod] = useState<string | null>(null);
    const [wiek, setWiek] = useState<number | null>(null);
    const [wybrani, setWybrani] = useState<Gatunek[]>([]);
    const [temat, setTemat] = useState('');
    const [rundy, setRundy] = useState(3);
    const [areny, setAreny] = useState<ArenaT[]>([]);
    const [otwarta, setOtwarta] = useState<ArenaT | null>(null);
    const [nad, setNad] = useState(false);
    const przeciagany = useRef<string | null>(null);

    const odswiez = () => lab.areny().then(setAreny).catch(() => {});
    useEffect(() => {
        lab.stado().then((s) => { setStado(s.gatunki); setPowod(s.powod); setWiek(s.migawka?.wiekSekund ?? null); }).catch((e) => toast.error(e.message));
        void odswiez();
    }, []);
    // Trwająca arena — odpytuj co 4 s.
    useEffect(() => {
        if (otwarta?.stan !== 'trwa') return;
        const i = setInterval(() => lab.arena(otwarta.id).then(setOtwarta).catch(() => {}), 4000);
        return () => clearInterval(i);
    }, [otwarta]);

    const upusc = () => {
        setNad(false);
        const g = stado.find((x) => x.id === przeciagany.current);
        if (g && !wybrani.some((w) => w.id === g.id)) setWybrani((w) => [...w, g]);
        przeciagany.current = null;
    };

    const start = async () => {
        try {
            const a = await lab.zacznijArene({ uczestnicy: wybrani.map((w) => w.id), temat, rundy, model: model() });
            setOtwarta(a); toast.success('Arena ruszyła — labują w tle.');
            void odswiez();
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    };

    if (otwarta) {
        const t = otwarta.transkrypt ?? [];
        return (
            <div className="mx-auto max-w-4xl space-y-4">
                <button onClick={() => { setOtwarta(null); void odswiez(); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14} /> areny</button>
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        {otwarta.uczestnicy.map((u) => <span key={u.id} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: `${u.kolor}66`, color: u.kolor }}>{u.forma} {u.imie}</span>)}
                        <span className="ml-auto font-mono text-[10px] text-slate-500">{otwarta.model} · runda {otwarta.runda}/{otwarta.rundy} · {otwarta.stan === 'trwa' ? <Loader2 size={10} className="inline animate-spin" /> : otwarta.stan}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-bold">{otwarta.temat}</h2>
                    {otwarta.blad && <div className="mt-2 text-xs text-red-300">{otwarta.blad}</div>}
                </div>
                <div className="space-y-2">
                    {t.map((w, i) => (
                        <div key={i} className="rounded-xl border border-white/5 bg-black/30 p-3" style={{ borderLeftColor: w.kolor, borderLeftWidth: 3 }}>
                            <div className="text-[10px] font-mono" style={{ color: w.kolor }}>{w.forma} {w.imie} · {w.dziedzina} · runda {w.runda}</div>
                            <div className="mt-1 text-sm text-slate-200">{w.tekst}</div>
                        </div>
                    ))}
                    {otwarta.stan === 'trwa' && <div className="text-xs text-slate-500"><Loader2 size={12} className="inline animate-spin" /> ktoś właśnie mówi…</div>}
                </div>
                {otwarta.wnioski && (
                    <div className="rounded-2xl border border-lab-accent/30 bg-lab-panel p-5">
                        <div className="mb-2 text-xs uppercase tracking-widest text-lab-accent">Wnioski Kronikarza</div>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200">{otwarta.wnioski}</pre>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-lab-accent/30 bg-lab-accent/10"><Swords className="text-lab-accent" /></div>
                <div>
                    <h2 className="text-2xl font-bold">Arena</h2>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">przeciągnij TeOgochi · daj temat · niech labują</p>
                </div>
            </div>
            {powod && <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">{powod}</div>}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-4">
                    <div className="mb-2 text-xs uppercase tracking-widest text-slate-400">Stado {wiek !== null && <span className="text-slate-600">· migawka sprzed {Math.round(wiek / 60)} min</span>}</div>
                    <div className="flex flex-wrap gap-2">
                        {stado.map((g) => (
                            <div key={g.id} draggable onDragStart={() => { przeciagany.current = g.id; }} onClick={() => !wybrani.some((w) => w.id === g.id) && setWybrani((w) => [...w, g])}
                                className="cursor-grab select-none rounded-xl border bg-black/30 px-3 py-2 text-center active:cursor-grabbing" style={{ borderColor: `${g.kolor}55` }} title={`${g.dziedzina} · ${g.etap} · ${g.xp} XP`}>
                                <div className="text-2xl">{g.forma}</div>
                                <div className="text-[11px] font-bold" style={{ color: g.kolor }}>{g.imie}</div>
                                <div className="text-[9px] text-slate-500">{g.dziedzina}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    <div onDragOver={(e) => { e.preventDefault(); setNad(true); }} onDragLeave={() => setNad(false)} onDrop={upusc}
                        className={`min-h-32 rounded-2xl border-2 border-dashed p-4 transition-colors ${nad ? 'border-lab-accent bg-lab-accent/10' : 'border-white/15 bg-white/[0.02]'}`}>
                        <div className="mb-2 text-xs uppercase tracking-widest text-slate-400">Arena — upuść tutaj ({wybrani.length})</div>
                        <div className="flex flex-wrap gap-2">
                            {!wybrani.length && <div className="text-xs text-slate-600">Przeciągnij (albo kliknij) co najmniej dwoje TeOgochi.</div>}
                            {wybrani.map((g) => (
                                <button key={g.id} onClick={() => setWybrani((w) => w.filter((x) => x.id !== g.id))} className="rounded-xl border bg-black/40 px-3 py-2 text-center" style={{ borderColor: g.kolor }} title="kliknij, żeby zdjąć">
                                    <div className="text-2xl">{g.forma}</div>
                                    <div className="text-[11px] font-bold" style={{ color: g.kolor }}>{g.imie}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <input value={temat} onChange={(e) => setTemat(e.target.value)} placeholder="temat — np. jak Katedra ma oszczędzać VRAM nocą?" className="w-full rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-slate-200 outline-none" />
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-400">rundy <input type="number" min={1} max={8} value={rundy} onChange={(e) => setRundy(Number(e.target.value))} className="ml-1 w-14 rounded border border-white/10 bg-black/40 p-1 text-center text-slate-200" /></label>
                        <button onClick={() => void start()} disabled={wybrani.length < 2 || !temat.trim()} className="rounded-lg bg-lab-accent px-5 py-2 text-xs font-bold text-black disabled:opacity-40">Niech labują</button>
                        <span className="text-[10px] font-mono text-slate-600">{wybrani.length} × {rundy} wypowiedzi + wnioski · {model() ?? 'model mostu'}</span>
                    </div>
                </div>
            </div>
            <section>
                <h3 className="mb-2 text-sm uppercase tracking-widest text-slate-400">Poprzednie areny</h3>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {areny.map((a) => (
                        <button key={a.id} onClick={() => lab.arena(a.id).then(setOtwarta)} className="rounded-xl border border-white/10 bg-lab-panel p-3 text-left hover:border-lab-accent/40">
                            <div className="text-sm font-bold text-white">{a.temat}</div>
                            <div className="text-[10px] font-mono text-slate-500">{a.uczestnicy.map((u) => u.imie).join(', ')} · {a.wypowiedzi} wyp. · {a.stan} · {kiedy(a.start)}</div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
