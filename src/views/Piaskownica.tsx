/**
 * 🏖️ PIASKOWNICA NOCNEJ ZMIANY.
 *
 * Dzień: Suweren pisze ZLECENIA (apka · plik · cel). Noc: robot `lab-eksperyment`
 * (Nocna Zmiana w Katedrze) bierze pierwsze otwarte i labuje je w osobnym
 * worktree — nic nie dotyka prawdziwych repozytoriów. Rano: lista eksperymentów
 * „do decyzji" z diffem, Tarczą Prawdy i wynikiem weryfikacji.
 *
 *   ZATWIERDŹ → `git cherry-pick -n` do drzewa roboczego apki (staged). Commit
 *               robi Suweren sam — Lab nie commituje w cudzym repo.
 *   ODRZUĆ    → gałąź lab/<id> znika.
 *
 * „Labuj teraz" robi to samo bez czekania na noc — dla testu zlecenia.
 */
import { useEffect, useState } from 'react';
import { Hammer, Check, X, Moon, Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { lab, model, kiedy, type Apka, type Zlecenie, type Eksperyment } from '../lib/lab';

const STAN_KOLOR: Record<Eksperyment['stan'], string> = {
    'liczy': 'text-sky-300', 'do-decyzji': 'text-amber-300', 'wprowadzony': 'text-lime-300', 'odrzucony': 'text-slate-500',
    'padl': 'text-red-400', 'bez-zmian': 'text-slate-400', 'zablokowany': 'text-red-300',
};

export default function Piaskownica() {
    const [apki, setApki] = useState<Apka[]>([]);
    const [zlecenia, setZlecenia] = useState<Zlecenie[]>([]);
    const [eks, setEks] = useState<Eksperyment[]>([]);
    const [apka, setApka] = useState('games');
    const [plik, setPlik] = useState('');
    const [pliki, setPliki] = useState<string[]>([]);
    const [cel, setCel] = useState('');
    const [otwarty, setOtwarty] = useState<Eksperyment | null>(null);
    const [labuje, setLabuje] = useState<string | null>(null);

    const odswiez = async () => {
        try {
            const [a, z, e] = await Promise.all([lab.apki(), lab.zlecenia(), lab.eksperymenty()]);
            setApki(a); setZlecenia(z); setEks(e);
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    };
    useEffect(() => { void odswiez(); }, []);
    useEffect(() => {
        if (!apka) return;
        const t = setTimeout(() => lab.pliki(apka, plik).then(setPliki).catch(() => setPliki([])), 250);
        return () => clearTimeout(t);
    }, [apka, plik]);
    // Gdy coś liczy — odświeżaj co 5 s, żeby etap był widoczny.
    useEffect(() => {
        if (!eks.some((e) => e.stan === 'liczy') && !labuje) return;
        const i = setInterval(() => void odswiez(), 5000);
        return () => clearInterval(i);
    }, [eks, labuje]);

    const dodaj = async () => {
        try { await lab.dodajZlecenie({ apka, plik, cel }); setCel(''); toast.success('Zlecenie czeka na Nocną Zmianę.'); void odswiez(); }
        catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    };

    const labujTeraz = async (z?: Zlecenie) => {
        setLabuje(z?.id ?? 'teraz');
        try {
            const r = await lab.labujTeraz(z ? { apka: z.apka, plik: z.plik, cel: z.cel, model: model() } : { model: model() });
            if (r.nic) toast(r.message ?? 'Brak zleceń.'); else toast.success(`Eksperyment: ${r.stan}${r.blad ? ` — ${r.blad}` : ''}`);
            if (z) await lab.usunZlecenie(z.id);
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setLabuje(null); void odswiez(); }
    };

    const decyzja = async (id: string, tak: boolean) => {
        try {
            const r = tak ? await lab.zatwierdz(id) : await lab.odrzuc(id);
            toast.success(tak ? r.uwaga ?? 'Wprowadzone.' : 'Odrzucone — gałąź usunięta.', { duration: 6000 });
            setOtwarty(null); void odswiez();
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e), { duration: 8000 }); }
    };

    const doDecyzji = eks.filter((e) => e.stan === 'do-decyzji');

    if (otwarty) return <Szczegoly e={otwarty} wroc={() => setOtwarty(null)} decyzja={decyzja} />;

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            {/* ── Rano: do decyzji ── */}
            <section>
                <h2 className="mb-1 flex items-center gap-2 text-xl font-bold"><Moon className="text-amber-300" size={20} /> Po nocnej zmianie — do decyzji ({doDecyzji.length})</h2>
                <p className="mb-3 text-xs text-slate-500">Każdy eksperyment to commit na gałęzi <code>lab/&lt;id&gt;</code> w piaskownicy. Zatwierdzenie = cherry-pick do Twojego drzewa (staged, bez commitu). Odrzucenie = gałąź znika.</p>
                {!doDecyzji.length && <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs text-slate-500">Nic nie czeka. Dodaj zlecenie poniżej — Nocna Zmiana (Katedra → karta „Nocna Zmiana", robot <code>lab-eksperyment</code>) zrobi je, gdy komputer będzie wolny.</div>}
                <div className="grid gap-3 md:grid-cols-2">
                    {doDecyzji.map((e) => <Karta key={e.id} e={e} onClick={() => lab.eksperyment(e.id).then(setOtwarty)} />)}
                </div>
            </section>

            {/* ── Dzień: zlecenia ── */}
            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-bold"><Plus size={16} className="text-lab-accent" /> Nowe zlecenie</h3>
                    <div className="space-y-2 text-sm">
                        <select value={apka} onChange={(e) => { setApka(e.target.value); setPlik(''); }} className="w-full rounded-lg border border-white/10 bg-black/40 p-2 text-slate-200">
                            {apki.map((a) => <option key={a.id} value={a.id} disabled={!a.jest}>{a.nazwa}{a.jest ? '' : ' (brak repo)'}{a.piaskownica ? ' · piaskownica gotowa' : ''}</option>)}
                        </select>
                        <input list="pliki-apki" value={plik} onChange={(e) => setPlik(e.target.value)} placeholder="plik (zacznij pisać — podpowiem z git ls-files)" className="w-full rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-xs text-slate-200 outline-none" />
                        <datalist id="pliki-apki">{pliki.map((p) => <option key={p} value={p} />)}</datalist>
                        <textarea value={cel} onChange={(e) => setCel(e.target.value)} placeholder="cel — jedno konkretne usprawnienie tego pliku" className="h-24 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-slate-200 outline-none" />
                        <div className="flex gap-2">
                            <button onClick={() => void dodaj()} className="rounded-lg bg-lab-accent px-4 py-2 text-xs font-bold text-black">Do kolejki nocnej</button>
                            <button onClick={() => void labujTeraz({ id: '', apka, plik, cel, dodano: '', stan: 'otwarte', eksperymentId: null })} disabled={!!labuje || !plik || !cel} className="flex items-center gap-1 rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-200 disabled:opacity-40">
                                {labuje === '' ? <Loader2 size={12} className="animate-spin" /> : <Hammer size={12} />} Labuj teraz
                            </button>
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">model kodu: {model() ?? 'Mechanika (most)'} · „teraz" = minuty na karcie, bez bram Nocnej Zmiany</div>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
                    <h3 className="mb-3 flex items-center justify-between font-bold"><span>Kolejka zleceń ({zlecenia.length})</span><button onClick={() => void odswiez()} className="text-slate-500 hover:text-white"><RefreshCw size={14} /></button></h3>
                    <div className="space-y-2">
                        {!zlecenia.length && <div className="text-xs text-slate-500">Pusta.</div>}
                        {zlecenia.map((z) => (
                            <div key={z.id} className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-slate-400">{apki.find((a) => a.id === z.apka)?.nazwa ?? z.apka} · {z.plik}</span>
                                    <span className={`font-mono text-[10px] ${z.stan === 'otwarte' ? 'text-amber-300' : z.stan === 'zrobione' ? 'text-lime-300' : z.stan === 'padlo' ? 'text-red-400' : 'text-sky-300'}`}>{z.stan}</span>
                                </div>
                                <div className="mt-1 text-slate-200">{z.cel}</div>
                                <div className="mt-1 flex gap-3">
                                    {z.stan === 'otwarte' && <button onClick={() => void labujTeraz(z)} disabled={!!labuje} className="flex items-center gap-1 text-[10px] text-sky-300 disabled:opacity-40">{labuje === z.id ? <Loader2 size={10} className="animate-spin" /> : <Hammer size={10} />} labuj teraz</button>}
                                    <button onClick={() => lab.usunZlecenie(z.id).then(odswiez)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400"><Trash2 size={10} /> usuń</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Historia ── */}
            <section>
                <h3 className="mb-2 text-sm uppercase tracking-widest text-slate-400">Wszystkie eksperymenty ({eks.length})</h3>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {eks.filter((e) => e.stan !== 'do-decyzji').map((e) => <Karta key={e.id} e={e} onClick={() => lab.eksperyment(e.id).then(setOtwarty)} mala />)}
                </div>
            </section>
        </div>
    );
}

const Karta = ({ e, onClick, mala }: { e: Eksperyment; onClick: () => void; mala?: boolean }) => (
    <button onClick={onClick} className={`rounded-xl border border-white/10 bg-lab-panel text-left hover:border-lab-primary/40 ${mala ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-slate-400">{e.nazwaApki} · {e.plik}</span>
            <span className={`font-mono text-[10px] ${STAN_KOLOR[e.stan]}`}>{e.stan}{e.stan === 'liczy' && e.etap ? ` · ${e.etap}` : ''}</span>
        </div>
        <div className={`mt-1 text-slate-100 ${mala ? 'text-xs' : 'text-sm'}`}>{e.cel}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] font-mono text-slate-500">
            <span>{kiedy(e.start)}</span>
            {e.model && <span>{e.model}</span>}
            {e.weryfikacja && <span className={e.weryfikacja.ok === true ? 'text-lime-300' : e.weryfikacja.ok === false ? 'text-red-400' : 'text-slate-400'}>{e.weryfikacja.sposob}: {e.weryfikacja.ok === true ? 'OK' : e.weryfikacja.ok === false ? 'PADŁA' : 'pominięta'}</span>}
            {e.tarcza && <span>tarcza {e.tarcza.score}/100 {e.tarcza.grade}</span>}
            {e.statystyka && <span>{e.statystyka}</span>}
            {e.blad && <span className="text-red-300">{e.blad.slice(0, 120)}</span>}
        </div>
    </button>
);

const Szczegoly = ({ e, wroc, decyzja }: { e: Eksperyment; wroc: () => void; decyzja: (id: string, tak: boolean) => Promise<void> }) => (
    <div className="mx-auto max-w-5xl space-y-4">
        <button onClick={wroc} className="text-xs text-slate-400 hover:text-white">← piaskownica</button>
        <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
            <div className="font-mono text-[10px] text-slate-400">{e.nazwaApki} · {e.plik} · {e.model} · {e.sekundy ?? '?'} s · baza {e.bazaHead?.slice(0, 7)}</div>
            <h2 className="mt-1 text-lg font-bold">{e.cel}</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <span className={`font-mono ${STAN_KOLOR[e.stan]}`}>{e.stan}</span>
                {e.weryfikacja && <span className={e.weryfikacja.ok === true ? 'text-lime-300' : e.weryfikacja.ok === false ? 'text-red-400' : 'text-slate-400'}>weryfikacja ({e.weryfikacja.sposob}): {e.weryfikacja.ok === true ? 'OK' : e.weryfikacja.ok === false ? 'PADŁA' : 'pominięta'} · {e.weryfikacja.sekundy} s</span>}
                {e.tarcza && <span className="text-slate-300">Tarcza Prawdy {e.tarcza.score}/100 ({e.tarcza.grade}) — {e.tarcza.summary}</span>}
            </div>
            {e.tarcza?.findings?.length ? <ul className="mt-2 text-[11px] text-amber-200">{e.tarcza.findings.map((f, i) => <li key={i}>· {f.pillar} {f.severity}: {f.what}</li>)}</ul> : null}
            {e.weryfikacja?.ok === false && <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/50 p-2 text-[10px] text-red-200">{e.weryfikacja.log}</pre>}
            {e.blad && <div className="mt-2 text-xs text-red-300">{e.blad}</div>}
            {e.uwagaModelu && <div className="mt-2 text-xs text-slate-400">model: {e.uwagaModelu}</div>}
            {e.uwaga && <div className="mt-2 text-xs text-lime-200">{e.uwaga}</div>}
            {e.stan === 'do-decyzji' && (
                <div className="mt-4 flex gap-2">
                    <button onClick={() => void decyzja(e.id, true)} className="flex items-center gap-1 rounded-lg bg-lime-500 px-4 py-2 text-xs font-bold text-black"><Check size={14} /> Wprowadź do {e.nazwaApki}</button>
                    <button onClick={() => void decyzja(e.id, false)} className="flex items-center gap-1 rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-200"><X size={14} /> Odrzuć</button>
                </div>
            )}
        </div>
        {e.diff && (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/60 p-4">
                <pre className="font-mono text-[11px] leading-snug">
                    {e.diff.split('\n').map((l, i) => (
                        <div key={i} className={l.startsWith('+') && !l.startsWith('+++') ? 'text-lime-300' : l.startsWith('-') && !l.startsWith('---') ? 'text-red-300' : l.startsWith('@@') ? 'text-sky-300' : 'text-slate-400'}>{l || ' '}</div>
                    ))}
                </pre>
            </div>
        )}
    </div>
);
