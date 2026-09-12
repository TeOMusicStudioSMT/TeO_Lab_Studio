/**
 * 🧪 TeO Lab Studio — apka-córka Katedry OtakOS (2026-09-12).
 *
 * Było komponentem w Story (TeOLab: Gemini + Firebase). Suweren: „zasługuje na
 * własne Studio — z sandboxem dla Nocnej Zmiany, gdzie mogą usprawniać nasze
 * appki i prezentować je po nocy; Suweren zatwierdza. Printy z modelem lokalnym.
 * Arena dla kilku TeOgochi. Dział projektowania chipów pod modele AI."
 *
 *   Printy       — TeOPrint z lokalnego modelu (Ollama przez most)
 *   Piaskownica  — zlecenia → eksperymenty w worktree → decyzja Suwerena
 *   Arena        — TeOgochi labują temat przez N rund
 *   Chipy        — jawne wzory, nota z modelu, bpy → Blender
 *
 * Pasek na górze mówi PRAWDĘ o moście: bez :3001 żadna karta nic nie policzy.
 */
import { useEffect, useState } from 'react';
import { FlaskConical, Moon, Swords, Cpu } from 'lucide-react';
import Printy from './views/Printy';
import Piaskownica from './views/Piaskownica';
import Arena from './views/Arena';
import Chipy from './views/Chipy';
import { mostZyje, BRIDGE } from './lib/bridge';

type Widok = 'printy' | 'piaskownica' | 'arena' | 'chipy';

const MENU: { id: Widok; nazwa: string; Ikona: typeof FlaskConical }[] = [
    { id: 'piaskownica', nazwa: 'Piaskownica', Ikona: Moon },
    { id: 'printy', nazwa: 'Printy', Ikona: FlaskConical },
    { id: 'arena', nazwa: 'Arena', Ikona: Swords },
    { id: 'chipy', nazwa: 'Chipy', Ikona: Cpu },
];

function zHasha(): Widok {
    const h = window.location.hash.replace('#', '') as Widok;
    return MENU.some((m) => m.id === h) ? h : 'piaskownica';
}

export default function App() {
    const [widok, setWidok] = useState<Widok>(zHasha);
    const [most, setMost] = useState<boolean | null>(null);

    useEffect(() => {
        mostZyje().then(setMost);
        const i = setInterval(() => mostZyje().then(setMost), 15000);
        const naHash = () => setWidok(zHasha());
        window.addEventListener('hashchange', naHash);
        return () => { clearInterval(i); window.removeEventListener('hashchange', naHash); };
    }, []);

    const idz = (w: Widok) => { window.location.hash = w; setWidok(w); };

    return (
        <div className="min-h-screen">
            <header className="border-b border-slate-800 bg-lab-panel/60 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
                    <h1 className="text-xl font-bold tracking-wide"><span className="text-lab-primary">TeO Lab</span> <span className="text-slate-400">Studio</span></h1>
                    <nav className="flex gap-1">
                        {MENU.map(({ id, nazwa, Ikona }) => (
                            <button key={id} onClick={() => idz(id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${widok === id ? 'bg-slate-800 text-lab-primary' : 'text-slate-400 hover:text-slate-200'}`}>
                                <Ikona size={16} /> {nazwa}
                            </button>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2 text-xs font-mono">
                        <span className={`h-2 w-2 rounded-full ${most === null ? 'bg-slate-600' : most ? 'bg-lime-400' : 'bg-red-500'}`} />
                        <span className="text-slate-400">{most === null ? 'most?' : most ? `most ${BRIDGE.replace('http://', '')}` : 'most milczy — odpal Katedrę'}</span>
                    </div>
                </div>
            </header>
            <main className="px-6 py-8">
                {widok === 'printy' && <Printy />}
                {widok === 'piaskownica' && <Piaskownica />}
                {widok === 'arena' && <Arena />}
                {widok === 'chipy' && <Chipy />}
            </main>
        </div>
    );
}
