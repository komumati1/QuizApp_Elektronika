# Quiz — Elementy Elektroniczne

Aplikacja do nauki z pytaniami z egzaminów AGH.

## Wymagania

- Node.js 18+

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz http://localhost:5173

## Dane

Pytania w `pytania_extracted/extracted*.json`. Każdy plik to osobny zestaw — można je zaznaczać/odznaczać na ekranie startowym.

Zdjęcia źródłowe w `pytania/zestaw_*/`.

## Funkcje

- Losowa kolejność lub kolejność z pliku
- Pytania numeryczne (z tolerancją), single/multi choice
- Podgląd oryginalnego zdjęcia z egzaminu
- Edycja pytania/odpowiedzi zapisuje się do JSON
- Oznaczanie pytań jako problematycznych
- Powtórka błędnych i oznaczonych pytań po zakończeniu quizu
