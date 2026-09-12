/**
 * 🔬 CHIPY — projekt układu pod konkretny model AI.
 *
 * Liczby są z JAWNYCH wzorów (most, policzChip): wagi = parametry × bity / 8,
 * KV/token = 2 × warstwy × d_model × bajty / grupy GQA, FLOPs/token ≈ 2 × parametry,
 * pasmo ≈ (wagi + KV) × tok/s. To szacunek dekodowania — punkt wyjścia do
 * projektu, nie symulacja. Nota projektowa pisze model; rozkład bloków
 * (interposer · die · stosy HBM) to skrypt bpy, który Blender renderuje —
 * gdy Blender jest na maszynie (most sprawdza i mówi wprost).
 *
 * Własne pliki (tekstowe) → analiza modelem pod kątem projektu układu.
 */
import { useEffect, useState } from 'react';
import { Cpu, Loader2, Upload, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { lab, model, kiedy, type SpecChipu, type LiczbyChipu, type Chip, type Analiza, type StanBlendera } from '../lib/lab';

const DOMYSLNA: SpecChipu = { parametryMld: 8, bity: 8, warstwy: 32, dModel: 4096, kontekst: 8192, kvBity: 16, grupyGqa: 4, tokS: 40, strumienie: 1 };

const POLA: { k: keyof SpecChipu; et: string; opis: string }[] = [
    { k: 'parametryMld', et: 'parametry [mld]', opis: 'np. 8 dla 8B' },
    { k: 'bity', et: 'bity wag', opis: '4 / 8 / 16' },
    { k: 'warstwy', et: 'warstwy', opis: 'bloki transformera' },
    { k: 'dModel', et: 'd_model', opis: 'szerokość ukryta' },
    { k: 'kontekst', et: 'kontekst [tok]', opis: 'długość KV cache' },
    { k: 'kvBity', et: 'bity KV', opis: '8 / 16' },
    { k: 'grupyGqa', et: 'grupy GQA', opis: '1 = MHA' },
    { k: 'tokS', et: 'cel tok/s', opis: 'na strumień' },
    { k: 'strumienie', et: 'strumienie', opis: 'równoległe sesje' },
];

export default function Chipy() {
    const [spec, setSpec] = useState<SpecChipu>(DOMYSLNA);
    const [nazwa, setNazwa] = useState('');
    const [liczby, setLiczby] = useState<LiczbyChipu | null>(null);
    const [chipy, setChipy] = useState<Chip[]>([]);
    const [otwarty, setOtwarty] = useState<Chip | null>(null);
    const [liczy, setLiczy] = useState(false);
    const [renderuje, setRenderuje] = useState(false);
    const [blender, setBlender] = useState<StanBlendera | null>(null);
    const [analizy, setAnalizy] = useState<Analiza[]>([]);
    const [plik, setPlik] = useState<File | null>(null);
    const [wklejka, setWklejka] = useState('');
    const [pytanie, setPytanie] = useState('');
    const [analizuje, setAnalizuje] = useState(false);

    const odswiez = () => Promise.all([lab.chipy().then(setChipy), lab.analizy().then(setAnalizy)]).catch(() => {});
    useEffect(() => { void odswiez(); lab.blender().then(setBlender).catch(() => setBlender(null)); }, []);
    useEffect(() => {
        const t = setTimeout(() => lab.policz(spec).then(setLiczby).catch(() => {}), 200);
        return () => clearTimeout(t);
    }, [spec]);

    const projektuj = async (bezNoty: boolean) => {
        setLiczy(true);
        try { const c = await lab.projektuj({ nazwa, spec, model: model(), bezNoty }); setOtwarty(c); toast.success(`Projekt „${c.nazwa}" zapisany.`); void odswiez(); }
        catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setLiczy(false); }
    };
    const renderujChip = async (id: string) => {
        setRenderuje(true);
        try { const c = await lab.renderuj(id); setOtwarty(c); toast.success(`Blender ${c.blenderWersja ?? ''} zrenderował rozkład bloków.`); }
        catch (e) { toast.error(e instanceof Error ? e.message : String(e), { duration: 8000 }); }
        finally { setRenderuje(false); }
    };
    const analizuj = async () => {
        if (!plik && !wklejka.trim()) return toast.error('Wybierz plik albo wklej treść.');
        setAnalizuje(true);
        try { await lab.analizuj(plik, wklejka, pytanie); toast.success('Analiza gotowa.'); setPlik(null); setWklejka(''); void odswiez(); }
        catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setAnalizuje(false); }
    };

    if (otwarty) {
        return (
            <div className="mx-auto max-w-4xl space-y-4">
                <button onClick={() => setOtwarty(null)} className="text-xs text-slate-400 hover:text-white">← projekty</button>
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <h2 className="text-xl font-bold">{otwarty.nazwa}</h2>
                    <div className="font-mono text-[10px] text-slate-500">{kiedy(otwarty.data)} · nota: {otwarty.model ?? 'bez noty'} · {otwarty.skrypt}</div>
                    <Liczby l={otwarty.liczby} />
                    <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => void renderujChip(otwarty.id)} disabled={renderuje || !blender?.jest} className="flex items-center gap-1 rounded-lg border border-lab-primary/40 px-3 py-1.5 text-xs text-lab-primary disabled:opacity-40">{renderuje ? <Loader2 size={12} className="animate-spin" /> : <Box size={12} />} Renderuj rozkład bloków w Blenderze</button>
                        <span className="text-[10px] font-mono text-slate-500">{blender?.jest ? `Blender ${blender.wersja ?? ''}` : blender?.powod ?? 'stan Blendera nieznany'}</span>
                    </div>
                    {otwarty.render && <img src={`${lab.renderUrl(otwarty.id)}?t=${Date.now()}`} alt="rozkład bloków" className="mt-3 w-full rounded-xl border border-white/10" />}
                    {otwarty.blend && <div className="mt-1 font-mono text-[10px] text-slate-500">.blend: {otwarty.blend}</div>}
                </div>
                {otwarty.nota && <div className="rounded-2xl border border-white/10 bg-black/40 p-5"><pre className="whitespace-pre-wrap font-sans text-sm text-slate-200">{otwarty.nota}</pre></div>}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-lab-primary/30 bg-lab-primary/10"><Cpu className="text-lab-primary" /></div>
                <div>
                    <h2 className="text-2xl font-bold">Projektowanie chipów pod modele AI</h2>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">jawne wzory · nota z modelu · bpy do Blendera</p>
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <input value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="nazwa projektu (np. Krzem-8B-Nocny)" className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-slate-200 outline-none" />
                    <div className="grid grid-cols-3 gap-2">
                        {POLA.map((p) => (
                            <label key={p.k} className="text-[10px] uppercase tracking-wider text-slate-400">{p.et}
                                <input type="number" value={spec[p.k]} onChange={(e) => setSpec((s) => ({ ...s, [p.k]: Number(e.target.value) }))} className="mt-0.5 w-full rounded border border-white/10 bg-black/40 p-1.5 font-mono text-xs text-slate-200 outline-none" />
                                <span className="text-[9px] normal-case text-slate-600">{p.opis}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button onClick={() => void projektuj(false)} disabled={liczy} className="flex items-center gap-1 rounded-lg bg-lab-primary px-4 py-2 text-xs font-bold text-black disabled:opacity-50">{liczy ? <Loader2 size={12} className="animate-spin" /> : null} Projektuj + nota z modelu</button>
                        <button onClick={() => void projektuj(true)} disabled={liczy} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-200 disabled:opacity-50">Tylko liczby + skrypt bpy</button>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <div className="text-xs uppercase tracking-widest text-slate-400">Wyliczenia na żywo</div>
                    {liczby ? <Liczby l={liczby} /> : <div className="mt-2 text-xs text-slate-500">most liczy…</div>}
                </div>
            </div>

            <section>
                <h3 className="mb-2 text-sm uppercase tracking-widest text-slate-400">Projekty ({chipy.length})</h3>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {chipy.map((c) => (
                        <button key={c.id} onClick={() => lab.chip(c.id).then(setOtwarty)} className="rounded-xl border border-white/10 bg-lab-panel p-3 text-left hover:border-lab-primary/40">
                            <div className="text-sm font-bold text-white">{c.nazwa}</div>
                            <div className="font-mono text-[10px] text-slate-500">{c.liczby.pamiecGB} GB · {c.liczby.pasmoGBs} GB/s · {c.liczby.stosyHbm}× HBM · {c.render ? 'render ✓' : 'bez renderu'} · {kiedy(c.data)}</div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <h3 className="mb-2 flex items-center gap-2 font-bold"><Upload size={16} className="text-lab-accent" /> Własny plik z analizą</h3>
                    <p className="mb-2 text-[11px] text-slate-500">Tekstowe do 2 MB: txt, md, csv, json, yaml, py, Verilog/VHDL, config modelu… Plik nie ląduje na dysku — tylko wynik analizy.</p>
                    <input type="file" onChange={(e) => setPlik(e.target.files?.[0] ?? null)} className="block w-full text-xs text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-slate-200" />
                    <textarea value={wklejka} onChange={(e) => setWklejka(e.target.value)} placeholder="…albo wklej treść (np. config.json modelu)" className="mt-2 h-20 w-full rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[11px] text-slate-200 outline-none" />
                    <input value={pytanie} onChange={(e) => setPytanie(e.target.value)} placeholder="pytanie (opcjonalnie)" className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-slate-200 outline-none" />
                    <button onClick={() => void analizuj()} disabled={analizuje} className="mt-2 flex items-center gap-1 rounded-lg bg-lab-accent px-4 py-2 text-xs font-bold text-black disabled:opacity-50">{analizuje ? <Loader2 size={12} className="animate-spin" /> : null} Analizuj modelem</button>
                </div>
                <div className="space-y-2">
                    <div className="text-xs uppercase tracking-widest text-slate-400">Analizy ({analizy.length})</div>
                    {analizy.map((a) => (
                        <details key={a.id} className="rounded-xl border border-white/10 bg-lab-panel p-3">
                            <summary className="cursor-pointer text-sm text-white">{a.nazwa} <span className="font-mono text-[10px] text-slate-500">· {a.znakow} zn. · {a.model} · {kiedy(a.data)}</span></summary>
                            <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-slate-300">{a.analiza}</pre>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}

const Liczby = ({ l }: { l: LiczbyChipu }) => (
    <div className="mt-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <L et="wagi" w={`${l.wagiGB} GB`} />
            <L et="KV cache" w={`${l.kvGB} GB`} pod={`${l.kvNaTokenKB} KB/token`} />
            <L et="pamięć razem" w={`${l.pamiecGB} GB`} />
            <L et="moc" w={`${l.tflops} TFLOPS`} pod="2·P·tok/s" />
            <L et="pasmo" w={`${l.pasmoGBs} GB/s`} pod="dekodowanie" />
            <L et="stosy HBM3" w={`${l.stosyHbm}`} pod={`${l.hbm.gbsNaStos} GB/s · ${l.hbm.gbNaStos} GB każdy`} />
        </div>
        <div className="mt-2 text-[10px] text-slate-500">{l.uwaga}</div>
    </div>
);
const L = ({ et, w, pod }: { et: string; w: string; pod?: string }) => (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
        <div className="text-[9px] uppercase tracking-wider text-slate-500">{et}</div>
        <div className="text-base font-bold text-lab-primary">{w}</div>
        {pod && <div className="text-[9px] text-slate-600">{pod}</div>}
    </div>
);
