# Kalkulátor splátek

PWA aplikace pro výpočet anuitních splátek dluhu. Funguje offline, lze nainstalovat na Android jako nativní aplikace.

## Funkce

- Výpočet měsíční anuitní splátky
- Zobrazení souhrnu (jistina, úroková sazba, celkem zaplaceno, celkové úroky)
- Rozbalitelný splátkový kalendář (úrok / úmor / zůstatek pro každý měsíc)
- Plná offline funkčnost (Service Worker)
- Instalovatelné na Android / iOS

## Vzorec

$$M = P \cdot \frac{i(1+i)^n}{(1+i)^n - 1}$$

| Symbol | Význam |
|--------|--------|
| M | Měsíční splátka |
| P | Jistina (dlužná částka) |
| i | Měsíční úroková sazba = roční sazba / 12 / 100 |
| n | Počet splátek (měsíců) |

## Struktura projektu

```
splatky/
├── index.html          # Hlavní stránka
├── style.css           # Styly
├── app.js              # Logika aplikace
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline)
└── icons/
    ├── icon.svg        # Ikona aplikace
    └── icon-maskable.svg  # Maskable ikona (Android)
```

## Nasazení na GitHub Pages

### 1. Vytvoření repozitáře

1. Přihlaste se na [github.com](https://github.com)
2. Klikněte **New repository**
3. Pojmenujte ho např. `splatky`
4. Nastavte jako **Public**
5. Klikněte **Create repository**

### 2. Nahrání souborů

**Varianta A – přes webové rozhraní:**

1. Otevřete repozitář
2. Klikněte **Add file → Upload files**
3. Přetáhněte všechny soubory (včetně složky `icons/`)
4. Klikněte **Commit changes**

**Varianta B – přes Git (příkazový řádek):**

```bash
git init
git add .
git commit -m "První verze kalkulátoru splátek"
git branch -M main
git remote add origin https://github.com/blek2CZ/Dluh-kalkulacka.git
git push -u origin main
```

### 3. Zapnutí GitHub Pages

1. V repozitáři otevřete **Settings → Pages**
2. Pod **Source** vyberte větev `main`, složku `/ (root)`
3. Klikněte **Save**
4. Po chvíli bude aplikace dostupná na:
   https://blek2CZ.github.io/Dluh-kalkulacka/

## Instalace na Android

1. Otevřete adresu aplikace v **Chrome**
2. Klepněte na menu (⋮) → **„Přidat na plochu"** / **„Nainstalovat aplikaci"**
3. Aplikace se nainstaluje jako samostatná aplikace bez lišty prohlížeče

## Příklad výpočtu

| Vstup | Hodnota |
|-------|---------|
| Jistina | 1 750 000 Kč |
| Roční úrok | 6 % |
| Počet splátek | 36 měsíců |

**Výsledek:**
- Měsíční splátka: **53 248,82 Kč**
- Celkem zaplaceno: **1 916 957,51 Kč**
- Celkové úroky: **166 957,51 Kč**
