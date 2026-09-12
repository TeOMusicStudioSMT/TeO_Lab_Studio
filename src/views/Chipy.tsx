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
import { Cpu, Loader2, Upload, Box, Hammer, FlaskConical, StickyNote, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { lab, model, kiedy, type SpecChipu, type LiczbyChipu, type Chip, type Analiza, type StanBlendera, type SpecZAnalizy, type Gatunek } from '../lib/lab';

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
    // 🔨 Przekucie analizy w projekt: które pola przyszły Z PLIKU, a które zostały domyślne.
    const [zAnalizy, setZAnalizy] = useState<SpecZAnalizy | null>(null);
    const [przekuwa, setPrzekuwa] = useState<string | null>(null);

    const odswiez = () => Promise.all([lab.chipy().then(setChipy), lab.analizy().then(setAnalizy)]).catch(() => {});
    useEffect(() => { void odswiez(); lab.blender().then(setBlender).catch(() => setBlender(null)); }, []);
    useEffect(() => {
        const t = setTimeout(() => lab.policz(spec).then(setLiczby).catch(() => {}), 200);
        return () => clearTimeout(t);
    }, [spec]);

    const projektuj = async (bezNoty: boolean) => {
        setLiczy(true);
        try { const c = await lab.projektuj({ nazwa, spec, model: model(), bezNoty, zAnalizy: zAnalizy?.analizaId ?? null }); setOtwarty(c); setZAnalizy(null); toast.success(`Projekt „${c.nazwa}" zapisany.`); void odswiez(); }
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
        try { const a = await lab.analizuj(plik, wklejka, pytanie); toast.success(a.uciete ? `Analiza gotowa — plik ucięty o ${a.uciete} znaków (limit modelu).` : 'Analiza gotowa.', { duration: 6000 }); setPlik(null); setWklejka(''); void odswiez(); }
        catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setAnalizuje(false); }
    };

    const przekuj = async (a: Analiza) => {
        setPrzekuwa(a.id);
        try {
            const r = await lab.specZAnalizy(a.id, model());
            // Tylko pola, które model znalazł w pliku — reszta zostaje jak w formularzu.
            setSpec((s) => { const n = { ...s }; for (const k of Object.keys(r.spec) as (keyof SpecChipu)[]) { const v = r.spec[k]; if (v !== null) n[k] = v; } return n; });
            setNazwa(r.nazwa);
            setZAnalizy(r);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toast.success(`${r.zPliku.length} pól z pliku, ${r.domyslne.length} domyślnych — sprawdź i kliknij Projektuj.`, { duration: 7000 });
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setPrzekuwa(null); }
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
                <ZywyProjekt c={otwarty} odswiez={() => lab.chip(otwarty.id).then(setOtwarty)} />
                {otwarty.nota && <details className="rounded-2xl border border-white/10 bg-black/40 p-5"><summary className="cursor-pointer text-xs uppercase tracking-widest text-slate-400">Nota projektowa · {otwarty.model}</summary><pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-200">{otwarty.nota}</pre></details>}
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
                    {zAnalizy && (
                        <div className="mb-3 rounded-lg border border-lab-accent/40 bg-lab-accent/10 p-2 text-[11px] text-slate-200">
                            <div className="font-bold text-lab-accent">Z analizy „{analizy.find((a) => a.id === zAnalizy.analizaId)?.nazwa ?? zAnalizy.analizaId}"</div>
                            <div>z pliku: <span className="font-mono text-lime-300">{zAnalizy.zPliku.join(', ') || '—'}</span></div>
                            <div>domyślne (w pliku nie było): <span className="font-mono text-amber-300">{zAnalizy.domyslne.join(', ') || '—'}</span></div>
                            {zAnalizy.uzasadnienie && <div className="mt-1 text-slate-400">{zAnalizy.model}: {zAnalizy.uzasadnienie}</div>}
                            <button onClick={() => setZAnalizy(null)} className="mt-1 text-[10px] text-slate-500 hover:text-slate-200">odłącz od analizy</button>
                        </div>
                    )}
                    <input value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="nazwa projektu (np. Krzem-8B-Nocny)" className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-slate-200 outline-none" />
                    <div className="grid grid-cols-3 gap-2">
                        {POLA.map((p) => (
                            <label key={p.k} className="text-[10px] uppercase tracking-wider text-slate-400">{p.et}
                                <input type="number" value={spec[p.k]} onChange={(e) => setSpec((s) => ({ ...s, [p.k]: Number(e.target.value) }))} className={`mt-0.5 w-full rounded border bg-black/40 p-1.5 font-mono text-xs text-slate-200 outline-none ${zAnalizy ? (zAnalizy.zPliku.includes(p.k) ? 'border-lime-400/60' : 'border-amber-400/40') : 'border-white/10'}`} title={zAnalizy ? (zAnalizy.zPliku.includes(p.k) ? 'z pliku' : 'domyślne — w pliku nie było') : undefined} />
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
                    {chipy.filter((c) => c.liczby).map((c) => (
                        <button key={c.id} onClick={() => lab.chip(c.id).then(setOtwarty)} className="rounded-xl border border-white/10 bg-lab-panel p-3 text-left hover:border-lab-primary/40">
                            <div className="text-sm font-bold text-white">{c.nazwa}</div>
                            <div className="font-mono text-[10px] text-slate-500">{c.liczby.pamiecGB} GB · {c.liczby.pasmoGBs} GB/s · {c.liczby.stosyHbm}× HBM · {c.render ? 'render ✓' : 'bez renderu'} · {kiedy(c.data)}</div>
                            <div className="mt-1 font-mono text-[10px]">{(c.pytanOtwartych ?? 0) > 0 && <span className="text-amber-300">{c.pytanOtwartych} pytań otwartych · </span>}<span className="text-slate-500">{c.badan ?? 0} badań · {c.notatek ?? 0} notatek</span></div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <h3 className="mb-2 flex items-center gap-2 font-bold"><Upload size={16} className="text-lab-accent" /> Własny plik z analizą</h3>
                    <p className="mb-2 text-[11px] text-slate-500"><b>PDF</b> (warstwa tekstu, bez OCR) albo tekst do 20 MB: txt, md, csv, json, yaml, py, Verilog/VHDL, config modelu… Na dysk idzie wynik + tekst źródła (do „przekucia w projekt"), nie sam plik.</p>
                    <input type="file" accept=".pdf,.txt,.md,.csv,.json,.yaml,.yml,.py,.v,.sv,.vhd,.vhdl,.toml,.ini,.cfg,.log,.ts,.js" onChange={(e) => setPlik(e.target.files?.[0] ?? null)} className="block w-full text-xs text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-slate-200" />
                    <textarea value={wklejka} onChange={(e) => setWklejka(e.target.value)} placeholder="…albo wklej treść (np. config.json modelu)" className="mt-2 h-20 w-full rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[11px] text-slate-200 outline-none" />
                    <input value={pytanie} onChange={(e) => setPytanie(e.target.value)} placeholder="pytanie (opcjonalnie)" className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-slate-200 outline-none" />
                    <button onClick={() => void analizuj()} disabled={analizuje} className="mt-2 flex items-center gap-1 rounded-lg bg-lab-accent px-4 py-2 text-xs font-bold text-black disabled:opacity-50">{analizuje ? <Loader2 size={12} className="animate-spin" /> : null} Analizuj modelem</button>
                </div>
                <div className="space-y-2">
                    <div className="text-xs uppercase tracking-widest text-slate-400">Analizy ({analizy.length})</div>
                    {analizy.map((a) => (
                        <details key={a.id} className="rounded-xl border border-white/10 bg-lab-panel p-3">
                            <summary className="cursor-pointer text-sm text-white">{a.nazwa} <span className="font-mono text-[10px] text-slate-500">· {a.znakow} zn.{a.stron ? ` · ${a.stron} str.` : ''} · {a.model} · {kiedy(a.data)}{a.projektId ? ' · → projekt' : ''}</span></summary>
                            <div className="mt-2 flex items-center gap-2">
                                <button onClick={() => void przekuj(a)} disabled={!!przekuwa} className="flex items-center gap-1 rounded-lg border border-lab-accent/40 px-3 py-1 text-[11px] text-lab-accent disabled:opacity-40">{przekuwa === a.id ? <Loader2 size={11} className="animate-spin" /> : <Hammer size={11} />} Przekuj w projekt</button>
                                {!a.maZrodlo && <span className="text-[10px] text-slate-500">analiza sprzed zapisu źródła — model wyciągnie parametry tylko z tekstu analizy</span>}
                                {a.projektId && <button onClick={() => lab.chip(a.projektId!).then(setOtwarty).catch(() => toast.error('Projekt już nie istnieje.'))} className="text-[10px] text-slate-400 hover:text-white">otwórz projekt</button>}
                            </div>
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

/**
 * 🧫 ŻYWY PROJEKT — notatki Suwerena, pytania otwarte, badania TeOgochi.
 *
 * Suweren: „dodać notkę i potem w całości projekt może być rozwijany, analizowany,
 * badany przez TeOgochi… TeOgochi pracują nad tymi wzorami geometrycznymi".
 * Pytania startują z sekcji „Czego nie wiemy" noty; badanie = Arena z pełnym
 * kontekstem projektu (liczby, nota, notatki, wcześniejsze badania) → wnioski
 * wracają do dziennika. Nocą to samo robi robot `lab-badanie`.
 */
const ZywyProjekt = ({ c, odswiez }: { c: Chip; odswiez: () => void }) => {
    const [notka, setNotka] = useState('');
    const [pyt, setPyt] = useState('');
    const [stado, setStado] = useState<Gatunek[]>([]);
    const [wybrani, setWybrani] = useState<string[]>([]);
    const [rundy, setRundy] = useState(2);
    const [bada, setBada] = useState<string | null>(null);
    const pytania = c.pytania ?? [];
    const dziennik = c.dziennik ?? [];
    const ktosBada = pytania.some((p) => p.stan === 'bada');

    useEffect(() => { lab.stado().then((s) => { setStado(s.gatunki); setWybrani(s.gatunki.filter((g) => g.wyklute).slice(0, 3).map((g) => g.id)); }).catch(() => {}); }, []);
    // Gdy trwa badanie — odświeżaj projekt co 6 s, aż wnioski wpadną do dziennika.
    useEffect(() => { if (!ktosBada) return; const i = setInterval(odswiez, 6000); return () => clearInterval(i); }, [ktosBada, odswiez]);

    const dodajNotke = async () => { if (!notka.trim()) return; try { await lab.notatka(c.id, notka); setNotka(''); odswiez(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } };
    const dodajPyt = async () => { if (!pyt.trim()) return; try { await lab.pytanie(c.id, pyt); setPyt(''); odswiez(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } };
    const zbadaj = async (pytanieId: string) => {
        if (wybrani.length < 2) return toast.error('Wybierz co najmniej dwoje TeOgochi.');
        setBada(pytanieId);
        try { const r = await lab.badaj(c.id, { pytanieId, uczestnicy: wybrani, rundy, model: model() }); toast.success(`${r.uczestnicy.join(', ')} badają — wnioski wpadną do dziennika.`); odswiez(); }
        catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setBada(null); }
    };

    return (
        <div className="space-y-4">
            {/* ── Pytania otwarte ── */}
            <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                <h3 className="mb-1 flex items-center gap-2 font-bold"><FlaskConical size={16} className="text-lab-accent" /> Pytania otwarte ({pytania.filter((p) => p.stan === 'otwarte').length})</h3>
                <p className="mb-3 text-[11px] text-slate-500">Z sekcji „Czego nie wiemy" noty i Twoje własne. Każde może wziąć na warsztat kilkoro TeOgochi — z liczbami i notatkami tego projektu przed oczami. Nocą robi to robot <code>lab-badanie</code>.</p>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-slate-400">badacze:</span>
                    {stado.map((g) => (
                        <button key={g.id} onClick={() => setWybrani((w) => (w.includes(g.id) ? w.filter((x) => x !== g.id) : [...w, g.id]))} title={`${g.dziedzina} · ${g.etap}${g.wyklute ? '' : ' · jeszcze jajko'}`}
                            className={`rounded-full border px-2 py-0.5 ${wybrani.includes(g.id) ? 'bg-white/10' : 'opacity-50'}`} style={{ borderColor: `${g.kolor}77`, color: g.kolor }}>{g.forma} {g.imie}</button>
                    ))}
                    <label className="ml-auto text-slate-400">rundy <input type="number" min={1} max={6} value={rundy} onChange={(e) => setRundy(Number(e.target.value))} className="ml-1 w-12 rounded border border-white/10 bg-black/40 p-0.5 text-center text-slate-200" /></label>
                </div>
                <ul className="space-y-2">
                    {!pytania.length && <li className="text-xs text-slate-500">Brak pytań — dopisz pierwsze.</li>}
                    {pytania.map((p) => (
                        <li key={p.id} className="flex items-start gap-2 rounded-lg border border-white/5 bg-black/30 p-2 text-xs">
                            <span className={`mt-0.5 font-mono text-[10px] ${p.stan === 'otwarte' ? 'text-amber-300' : p.stan === 'bada' ? 'text-sky-300' : 'text-lime-300'}`}>{p.stan}</span>
                            <span className="flex-1 text-slate-200">{p.tresc}<span className="ml-2 font-mono text-[10px] text-slate-600">{p.kto}</span></span>
                            {p.stan === 'bada' && <Loader2 size={12} className="animate-spin text-sky-300" />}
                            {p.stan !== 'bada' && <button onClick={() => void zbadaj(p.id)} disabled={!!bada} className="rounded border border-lab-accent/40 px-2 py-0.5 text-[10px] text-lab-accent disabled:opacity-40">{bada === p.id ? '…' : p.stan === 'zbadane' ? 'zbadaj ponownie' : 'zbadaj z TeOgochi'}</button>}
                            <button onClick={() => lab.usunPytanie(c.id, p.id).then(odswiez)} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                        </li>
                    ))}
                </ul>
                <div className="mt-2 flex gap-2">
                    <input value={pyt} onChange={(e) => setPyt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void dodajPyt(); }} placeholder="nowe pytanie — np. jak płynie energia w tej geometrii?" className="flex-1 rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-slate-200 outline-none" />
                    <button onClick={() => void dodajPyt()} className="rounded-lg border border-white/15 px-3 text-xs text-slate-200">dodaj</button>
                </div>
            </div>

            {/* ── Dziennik ── */}
            <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                <h3 className="mb-1 flex items-center gap-2 font-bold"><StickyNote size={16} className="text-lab-primary" /> Dziennik projektu ({dziennik.length})</h3>
                <div className="mb-3 flex gap-2">
                    <textarea value={notka} onChange={(e) => setNotka(e.target.value)} placeholder="notatka Suwerena — co wiesz, co czytałeś, dokąd to ma iść; TeOgochi dostają to w kontekście badań" className="h-20 flex-1 rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-slate-200 outline-none" />
                    <button onClick={() => void dodajNotke()} disabled={!notka.trim()} className="self-end rounded-lg bg-lab-primary px-3 py-2 text-xs font-bold text-black disabled:opacity-40">zapisz</button>
                </div>
                <div className="space-y-2">
                    {!dziennik.length && <div className="text-xs text-slate-500">Pusto. Pierwsza notatka albo badanie pojawi się tutaj.</div>}
                    {[...dziennik].reverse().map((w) => (
                        <div key={w.id} className={`rounded-lg border p-3 text-xs ${w.rodzaj === 'badanie' ? 'border-lab-accent/30 bg-lab-accent/5' : 'border-white/5 bg-black/30'}`}>
                            <div className="flex items-center font-mono text-[10px] text-slate-500"><span>{w.rodzaj === 'badanie' ? '🧫 badanie' : '📝 notatka'} · {w.kto} · {kiedy(w.data)}{w.model ? ` · ${w.model}` : ''}</span><button onClick={() => lab.usunWpis(c.id, w.id).then(odswiez)} className="ml-auto text-slate-600 hover:text-red-400" title="usuń wpis"><Trash2 size={11} /></button></div>
                            {w.rodzaj === 'badanie' && <div className="mt-1 font-bold text-slate-200">{w.pytanie}</div>}
                            <pre className="mt-1 whitespace-pre-wrap font-sans text-slate-300">{w.rodzaj === 'badanie' ? (w.wnioski ?? (w.blad ? `padło: ${w.blad}` : '(bez wniosków)')) : w.tresc}</pre>
                            {w.arenaId && <a href={`#arena`} onClick={() => sessionStorage.setItem('lab_arena_otworz', w.arenaId!)} className="mt-1 inline-block text-[10px] text-lab-accent">pełny transkrypt w Arenie →</a>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
