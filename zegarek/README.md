# Focus Clock Widget do Notion

## Pliki

- `index.html`
- `style.css`
- `script.js`

## Publikacja przez GitHub Pages

1. Utwórz nowe repozytorium na GitHubie, np. `focus-clock-widget`.
2. Wrzuć do niego pliki z tego folderu.
3. Wejdź w `Settings` → `Pages`.
4. W sekcji `Build and deployment` wybierz:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Zapisz.
6. Po chwili GitHub poda link w stylu:

```text
https://twoj-login.github.io/focus-clock-widget/
```

7. W Notion wpisz `/embed` i wklej ten link.

## Zalecane ustawienia w Notion

- szerokość: dopasuj ręcznie przeciągając bok embeda,
- wysokość: około 260–320 px,
- najlepiej działa w trybie ciemnym.

## Personalizacja

Kolory są w `style.css` w sekcji `:root`.

Najważniejsze zmienne:

```css
--cyan: #2bece0;
--coral: #ff5b4a;
--amber: #ffbd5a;
--bg: #06090f;
--card: #0b111a;
```
