# Quiz — Elementy Elektroniczne

[![Deploy to GitHub Pages](https://github.com/komumati1/QuizApp_Elektronika/actions/workflows/deploy.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/deploy.yml)

**[▶ Otwórz quiz online](https://USERNAME.github.io/REPO/)**


---

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Otwórz **http://localhost:3000**

Lokalnie dostępna jest edycja pytań (zapis do JSON). Na GitHub Pages edycja jest wyłączona.

## Deploy na GitHub Pages

Push na `main` → GitHub Actions automatycznie buduje i deployuje.

Wymagane ustawienie w repo: **Settings → Pages → Source → GitHub Actions**

## Dodawanie pytań

Dorzuć plik `pytania_extracted/extracted_N.json` zgodny ze schematem (patrz `extracted.json`).
Pojawi się automatycznie w selektorze źródeł po odświeżeniu.

## Struktura

```
quiz/
  pytania/zestaw_*/     zdjęcia źródłowe (w repo)
  pytania_extracted/    pliki JSON z pytaniami
  components/           komponenty React
  lib/                  typy, loader danych, helper URL
  scripts/              prepare-static.js (kopiuje assets przed buildem)
  app/                  Next.js App Router
  server.js             Express — lokalny backend (API + serwowanie zdjęć)
```
