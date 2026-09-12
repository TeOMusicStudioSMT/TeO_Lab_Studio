# 🧪 TeO Lab Studio

Apka-córka Katedry OtakOS (port **5178**, most `:3001`). Było komponentem Story — od 2026-09-12 własne studio.

| Karta | Co robi | Zaplecze |
|---|---|---|
| **Piaskownica** | Zlecenia (apka · plik · cel) → Nocna Zmiana labuje je w osobnym `git worktree` (`_OtakOs_Piaskownica/<apka>`), rano diff + Tarcza Prawdy + tsc → Suweren zatwierdza (cherry-pick do drzewa, bez commitu) albo odrzuca | `/api/lab/zlecenia`, `/api/lab/eksperyment*` |
| **Printy** | TeOPrint z lokalnego modelu (Ollama), plik `.md` w `_OtakOs_Wymiar/lab/printy` | `/api/lab/printy` |
| **Arena** | Przeciągnij TeOgochi ze stada, temat, N rund, wnioski Kronikarza | `/api/lab/arena` |
| **Chipy** | Jawne wzory (wagi, KV cache, FLOPs/token, pasmo, stosy HBM), nota z modelu, skrypt bpy → render w Blenderze, analiza własnych plików | `/api/lab/chipy*` |

`localStorage.teo_most` = inny adres mostu (np. `http://127.0.0.1:3009` dla mostu testowego).

```bash
npm install
npm run dev
```
