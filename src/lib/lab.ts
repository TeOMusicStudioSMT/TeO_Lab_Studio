/**
 * Typy i wywołania TeO Lab → most (/api/lab/*). Jedno miejsce, żeby widoki
 * nie zgadywały kształtu odpowiedzi.
 */
import { bridge, BRIDGE } from './bridge';

export interface Print { id: string; nazwa: string; problem: string; iskra: string; model: string; sekundy: number; data: string; silnik: string; znakow?: number; tresc?: string }

export interface Apka { id: string; nazwa: string; dir: string | null; jest: boolean; piaskownica: string | null }
export interface Zlecenie { id: string; apka: string; plik: string; cel: string; dodano: string; stan: 'otwarte' | 'w-toku' | 'zrobione' | 'padlo'; eksperymentId: string | null }
export interface Eksperyment {
    id: string; apka: string; nazwaApki: string; plik: string; cel: string; model: string; start: string; koniec?: string; sekundy?: number;
    stan: 'liczy' | 'do-decyzji' | 'wprowadzony' | 'odrzucony' | 'padl' | 'bez-zmian' | 'zablokowany'; etap?: string; blad?: string | null;
    tarcza?: { score: number; grade: string; blocked: boolean; summary: string; findings: { pillar: string; severity: string; what: string }[] };
    weryfikacja?: { ok: boolean | null; sposob: string; log: string; sekundy: number };
    sha?: string; statystyka?: string; diff?: string; diffZnakow?: number; uwagaModelu?: string | null; uwaga?: string; powodOdrzucenia?: string | null; bazaHead?: string;
}

export interface Gatunek { id: string; imie: string; dziedzina: string; kolor: string; forma: string; etap: string; xp: number; wyklute?: boolean }
export interface Wypowiedz { runda: number; id: string; imie: string; dziedzina: string; kolor: string; forma: string; tekst: string; kiedy: string }
export interface Arena { id: string; temat: string; rundy: number; model: string; uczestnicy: Gatunek[]; start: string; koniec?: string; stan: 'trwa' | 'gotowa' | 'padla'; runda: number; transkrypt?: Wypowiedz[]; wypowiedzi?: number; wnioski: string | null; blad: string | null }

export interface SpecChipu { parametryMld: number; bity: number; warstwy: number; dModel: number; kontekst: number; kvBity: number; grupyGqa: number; tokS: number; strumienie: number }
export interface LiczbyChipu { wejscie: SpecChipu; wagiGB: number; kvNaTokenKB: number; kvGB: number; pamiecGB: number; tflops: number; pasmoGBs: number; stosyHbm: number; hbm: { gbsNaStos: number; gbNaStos: number }; uwaga: string }
export interface Pytanie { id: string; tresc: string; stan: 'otwarte' | 'bada' | 'zbadane'; kto: string; data: string; badanieId: string | null; arenaId?: string }
export interface Wpis { id: string; rodzaj: 'notatka' | 'badanie'; kto: string; data: string; tresc?: string; pytanie?: string; pytanieId?: string; arenaId?: string; wnioski?: string | null; stan?: string; blad?: string | null; model?: string }
export interface Chip { id: string; nazwa: string; spec: SpecChipu; liczby: LiczbyChipu; data: string; model: string | null; nota: string | null; notaZnakow?: number; skrypt: string | null; render: string | null; blend: string | null; blenderWersja?: string; zAnalizy?: string | null; dziennik?: Wpis[]; pytania?: Pytanie[]; pytanOtwartych?: number; badan?: number; notatek?: number }
export interface Analiza { id: string; nazwa: string; znakow: number; stron?: number | null; pytanie: string | null; model: string; analiza: string; data: string; maZrodlo?: boolean; projektId?: string | null; uciete?: number }
export interface SpecZAnalizy { analizaId: string; nazwa: string; spec: Record<keyof SpecChipu, number | null>; zPliku: string[]; domyslne: string[]; uzasadnienie: string; model: string }
export interface StanBlendera { jest: boolean; sciezka?: string; wersja?: string; powod?: string; cozrobic?: string }

type Ok<T> = { success: true } & T;
type Lista<T> = { success: true; lista: T[] };

export const lab = {
    // printy
    printy: () => bridge.get<Lista<Print>>('/api/lab/printy').then((d) => d.lista),
    print: (id: string) => bridge.get<Ok<Print>>(`/api/lab/printy/${id}`),
    syntezuj: (b: { problem: string; iskra: string; model?: string }) => bridge.post<Ok<Print>>('/api/lab/printy', b),
    usunPrint: (id: string) => fetch(`${BRIDGE}/api/lab/printy/${id}`, { method: 'DELETE' }),
    // piaskownica
    apki: () => bridge.get<Ok<{ apki: Apka[] }>>('/api/lab/apki').then((d) => d.apki),
    pliki: (apka: string, q = '') => bridge.get<Lista<string>>(`/api/lab/apki/${apka}/pliki?q=${encodeURIComponent(q)}`).then((d) => d.lista),
    zlecenia: () => bridge.get<Lista<Zlecenie>>('/api/lab/zlecenia').then((d) => d.lista),
    dodajZlecenie: (b: { apka: string; plik: string; cel: string }) => bridge.post<Ok<Zlecenie>>('/api/lab/zlecenia', b),
    usunZlecenie: (id: string) => fetch(`${BRIDGE}/api/lab/zlecenia/${id}`, { method: 'DELETE' }),
    eksperymenty: () => bridge.get<Lista<Eksperyment>>('/api/lab/eksperymenty').then((d) => d.lista),
    eksperyment: (id: string) => bridge.get<Ok<Eksperyment>>(`/api/lab/eksperymenty/${id}`),
    labujTeraz: (b: { apka?: string; plik?: string; cel?: string; model?: string }) => bridge.post<Ok<Eksperyment & { nic?: boolean; message?: string }>>('/api/lab/eksperyment', b),
    zatwierdz: (id: string) => bridge.post<Ok<Eksperyment>>(`/api/lab/eksperymenty/${id}/zatwierdz`),
    odrzuc: (id: string, powod?: string) => bridge.post<Ok<Eksperyment>>(`/api/lab/eksperymenty/${id}/odrzuc`, { powod }),
    // arena
    stado: () => bridge.get<Ok<{ migawka: { wiekSekund: number } | null; powod: string | null; gatunki: Gatunek[] }>>('/api/lab/stado'),
    areny: () => bridge.get<Lista<Arena>>('/api/lab/arena').then((d) => d.lista),
    arena: (id: string) => bridge.get<Ok<Arena>>(`/api/lab/arena/${id}`),
    zacznijArene: (b: { uczestnicy: string[]; temat: string; rundy: number; model?: string }) => bridge.post<Ok<Arena>>('/api/lab/arena', b),
    // chipy
    policz: (spec: Partial<SpecChipu>) => bridge.post<Ok<LiczbyChipu>>('/api/lab/chipy/policz', spec),
    chipy: () => bridge.get<Lista<Chip>>('/api/lab/chipy').then((d) => d.lista),
    chip: (id: string) => bridge.get<Ok<Chip>>(`/api/lab/chipy/${id}`),
    projektuj: (b: { nazwa: string; spec: Partial<SpecChipu>; model?: string; bezNoty?: boolean; zAnalizy?: string | null }) => bridge.post<Ok<Chip>>('/api/lab/chipy', b),
    renderuj: (id: string) => bridge.post<Ok<Chip>>(`/api/lab/chipy/${id}/render`),
    blender: () => bridge.get<Ok<StanBlendera>>('/api/lab/chipy/blender'),
    analizy: () => bridge.get<Lista<Analiza>>('/api/lab/chipy/analizy').then((d) => d.lista),
    analizuj: async (plik: File | null, tresc: string, pytanie: string, nazwa = 'wklejka.txt') => {
        const fd = new FormData();
        if (plik) fd.append('plik', plik); else { fd.append('tresc', tresc); fd.append('nazwa', nazwa); }
        fd.append('pytanie', pytanie);
        const r = await fetch(`${BRIDGE}/api/lab/chipy/analiza`, { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok || !d.success) throw new Error(d.message || `HTTP ${r.status}`);
        return d as Ok<Analiza>;
    },
    notatka: (id: string, tresc: string) => bridge.post<Ok<Chip>>(`/api/lab/chipy/${id}/notatka`, { tresc }),
    pytanie: (id: string, tresc: string) => bridge.post<Ok<Chip>>(`/api/lab/chipy/${id}/pytanie`, { tresc }),
    usunWpis: (id: string, wid: string) => fetch(`${BRIDGE}/api/lab/chipy/${id}/wpis/${wid}`, { method: 'DELETE' }),
    usunPytanie: (id: string, pid: string) => fetch(`${BRIDGE}/api/lab/chipy/${id}/pytanie/${pid}`, { method: 'DELETE' }),
    badaj: (id: string, b: { pytanieId?: string; uczestnicy?: string[]; rundy?: number; model?: string }) => bridge.post<Ok<{ arena: string; uczestnicy: string[] }>>(`/api/lab/chipy/${id}/badaj`, b),
    specZAnalizy: (id: string, model?: string) => bridge.post<Ok<SpecZAnalizy>>(`/api/lab/chipy/analizy/${id}/spec`, { model }),
    renderUrl: (id: string) => `${BRIDGE}/api/lab/chipy/${id}/render`,
};

export const model = () => localStorage.getItem('otakos_active_model') || undefined;

export const kiedy = (iso?: string) => (iso ? new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : '—');
