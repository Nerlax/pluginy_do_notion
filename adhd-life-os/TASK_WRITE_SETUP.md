# Etap 1B — włączenie zapisu zadań w Cloudflare Worker

Frontend jest wdrożony w `app.html` i `index.html`, ale checkboxy są ukryte, dopóki GET `/api/dashboard` nie zwróci `capabilities.taskStatusWrite: true`.

## Wymagane czynności

1. **Zachowaj kopię aktualnego Workera** w Cloudflare (Workers & Pages → `adhd-life-os-api` → Edit code). Nie zastępuj całego Workera gotowym adapterem.
2. Dodaj funkcję `handleTaskPatch` z [task-update.js](./worker/task-update.js) do istniejącego źródła Workera (import modułu w projekcie z bundlerem albo wklejenie funkcji do pojedynczego skryptu).
3. W istniejącym `fetch(request, env, ctx)`, **po aktualnym sprawdzeniu autoryzacji i obsłudze CORS/preflight**, dodaj trasę:
   ```js
   if (request.method === "PATCH" && /^\/api\/tasks\/[0-9a-f-]{32,36}$/i.test(new URL(request.url).pathname)) {
     const response = await handleTaskPatch(request, env);
     // Zastosuj tu ten sam mechanizm nagłówków CORS, którego używa GET /api/dashboard.
     return withCors(response, request); // Nazwę withCors DOPASUJ do swojej implementacji.
   }
   ```
   Nie wklejaj wprost `withCors`, jeśli Twoja wersja Workera używa innej funkcji. Przeglądarka musi dopuszczać metody GET, PATCH, OPTIONS i nagłówek Authorization + Content-Type.
4. Sprawdź nazwę istniejącego sekretu dostępu. Adapter używa `env.DASHBOARD_KEY`; jeśli Worker ma inną nazwę, zmień ją tylko w adapterze. **Nie podawaj klucza ani tokenu Notion do repozytorium.**
5. W Cloudflare **Settings → Variables and Secrets** dodaj/zweryfikuj:
   - `NOTION_TOKEN` — istniejący sekret integracji Notion (może wymagać dopasowania nazwy);
   - `DASHBOARD_KEY` — sekret autoryzacji pulpitu (lub wykorzystaj już istniejący);
   - `TASKS_DATA_SOURCE_ID` — identyfikator *data source* bazy ✅ Zadania z API Notion, nie ID widoku ani strony.
6. Zweryfikuj w Notion, że integracja ma prawo aktualizacji bazy ✅ Zadania i pole `Status` jest typu select z opcją `Zrobione`.
7. **Test**: wywołaj PATCH z poprawnym kluczem i identyfikatorem jednego testowego zadania, body `{"status":"Zrobione"}`. Sprawdź rekord bezpośrednio w Notion. Test błędnego klucza powinien zwrócić 401; obcego ID strony — 403.
8. Dopiero po poprawnym teście uzupełnij istniejącą odpowiedź `GET /api/dashboard` o:
   ```json
   "capabilities": { "taskStatusWrite": true }
   ```
   Nie usuwaj pozostałych pól dashboardu. Teraz frontend automatycznie pokaże checkboxy.

## Uwaga bezpieczeństwa

- Cloudflare Worker musi wykonywać autoryzację przy **każdym** żądaniu modyfikującym, a nie tylko przy GET.
- Sam nagłówek CORS nie zabezpiecza API.
- Adapter celowo dopuszcza wyłącznie pola `status` i rekordy należące do wskazanego źródła `TASKS_DATA_SOURCE_ID`.
- Jeśli obecny Worker korzysta z własnej kontroli dostępu, użyj tej samej kontroli w nowej trasie. Nie wdrażaj drugiej, słabszej ścieżki autoryzacji.
- Jeśli Notion API zwraca błąd `400` albo `403`, skontroluj nazwę pola, identyfikator data source i uprawnienia integracji.

## Stan

- [x] Przygotowana kontrolka w frontendzie.
- [x] Przygotowany adapter PATCH.
- [ ] Adapter podłączony do uruchomionego Workera.
- [ ] Test zapisu i odczytu z Notion.
- [ ] Aktywacja `capabilities.taskStatusWrite`.
