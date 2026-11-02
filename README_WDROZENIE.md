# XSLT Extension: starter pack do audytu GitHub Actions

## Instalacja

1. Rozpakuj archiwum do katalogu głównego swojego lokalnego klona `Pawel20240101/xslt_extension`, zachowując ścieżki `.github/` i `scripts/`. Nie usuwaj istniejącego `scripts/bundle.mjs`.
2. Wykonaj:

   ```bash
   git checkout -b security-workflows
   git add .github/workflows/security-audit.yml .github/dependabot.yml scripts/security-policy.mjs
   git commit -m "Add CodeQL, Gitleaks and Chrome extension security checks"
   git push -u origin security-workflows
   ```

3. Utwórz Pull Request do `main`, sprawdź zakładkę **Checks** i wyniki w **Security and quality > Code scanning**. Po akceptacji scal zmiany.
4. W razie potrzeby, na forku włącz GitHub Actions: **Actions > I understand my workflows, go ahead and enable them**.
5. Użyj **Actions > XSLT Extension - security audit > Run workflow**, aby wymusić uruchomienie (po dodaniu workflow do domyślnej gałęzi).
6. W ustawieniach repozytorium włącz **Dependabot alerts**, **Dependabot security updates**, **Secret scanning / Push protection**, jeśli opcje są dostępne.

## Co bada

- CodeQL (JS/TS oraz pliki GitHub Actions), zestaw `security-extended`.
- Gitleaks (sekrety, tokeny, hasła w historii Git).
- Manifest V3 i lista uprawnień, szerokie dopasowanie oraz `world: MAIN` (ostrzeżenia).
- Obecność potrzebnych plików i parsowalność JavaScript.
- Potencjalnie nieograniczone wczytywanie XML do RAM (ostrzeżenie).
- Dependabot aktualizuje GitHub Actions użyte przez workflow.

## Granice testów

- To nie jest pentest ani runtime browser fuzzing.
- CodeQL i Gitleaks nie weryfikują automatycznie wersji skompilowanych `libxml2`/`libxslt` w WASM; nie potwierdzają braku XXE/XSS/DoS.
- Brak `package.json`: Dependabot nie potrafi samodzielnie odświeżyć `xslt-polyfill.min.js` ani zbadać transytywnych bibliotek WASM.
- Kod `content.js` nadal może pobierać całe odpowiedzi do pamięci; ostrzeżenie celowo nie blokuje bieżącej wersji.
- Pojawienie się zielonych testów oznacza jedynie, że zakończyły się sukcesem skonfigurowane skanery.
- Uruchamianie obcego PR w GHA: unikaj `pull_request_target` i nie udostępniaj workflow sekretów.
- Dla repozytorium indywidualnego Gitleaks nie wymaga dodatkowego klucza licencyjnego. Organizacje mogą go wymagać.

## Rekomendowane testy dynamiczne do rozwinięcia

- Test XML + poprawny XSLT, XML bez XSLT, XML z niepoprawnym XSLT, XSLT z `document()` i `xsl:include`.
- Próba odczytu `file:` i nieuprawnionych originów; sprawdzanie zachowania CORS.
- Test wyjściowego HTML ze skryptem w izolowanym środowisku (XSS).
- Wielkie XML oraz zagnieżdżone encje (zużycie RAM / CPU, timeout).
- Kontrola autentyczności użytego WASM: powtarzalny build ze źródła oraz SBOM z wersjami `libxml2` i `libxslt`.

## Uwaga: CodeQL default vs advanced

Do wyboru:
- **Default setup**: najprostszy start przez Settings > Advanced Security > CodeQL > Set up > Default.
- **Advanced setup**: własny workflow zawarty w tym pakiecie.

Nie włączaj obydwu konfiguracji CodeQL równocześnie. Jeśli GitHub domyślnie włączył CodeQL, przełącz go na Advanced setup przed wdrożeniem `security-audit.yml`.
