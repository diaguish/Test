// Génère le Kit Épargne Aesthetic (A4, 8 pages) en PDF pour chaque coloris.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SCRATCH = __dirname;
const OUT = path.join(__dirname, '..');
const TMP = require('os').tmpdir();

const THEMES = {
  beige: { name: 'Beige', ink: '#4A3F35', muted: '#8C7B6B', accent: '#C4A484', soft: '#EFE5D9', softer: '#F8F3EC', line: '#DCCDBC' },
  rose:  { name: 'Rose',  ink: '#5A3E42', muted: '#9A7A7E', accent: '#D4A0A7', soft: '#F6E4E6', softer: '#FCF4F5', line: '#E9CDD1' },
  sauge: { name: 'Sauge', ink: '#3E4A3F', muted: '#7A8A7B', accent: '#9CAF95', soft: '#E5ECE1', softer: '#F4F7F2', line: '#CCD8C7' },
};

const fontsCss = fs.readFileSync(path.join(SCRATCH, 'fonts/fonts.css'), 'utf8')
  .replace(/url\(([^)]+\.woff2)\)/g, (_, f) => `url(file://${path.join(SCRATCH, 'fonts', f)})`);

const css = (t) => `
${fontsCss}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --ink:${t.ink}; --muted:${t.muted}; --accent:${t.accent}; --soft:${t.soft}; --softer:${t.softer}; --line:${t.line}; }
body { font-family: 'DM Sans', sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 18mm 16mm 14mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; display: flex; flex-direction: column; }
.page:last-child { page-break-after: auto; }
.blob { position: absolute; border-radius: 50%; background: var(--softer); z-index: 0; }
.page > *:not(.blob) { position: relative; z-index: 1; }
.kicker { font-size: 8pt; letter-spacing: .32em; text-transform: uppercase; color: var(--muted); }
h1 { font-family: 'Playfair Display', serif; font-weight: 400; font-size: 30pt; line-height: 1.1; margin: 2mm 0 1.5mm; }
h1 em { font-style: italic; color: var(--accent); }
.sub { font-size: 10pt; color: var(--muted); font-weight: 300; }
.rule { height: 1px; background: var(--line); margin: 5mm 0; }
.footer { margin-top: auto; padding-top: 4mm; display: flex; justify-content: space-between; font-size: 7pt; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
.fields { display: flex; gap: 6mm; font-size: 9pt; color: var(--muted); }
.field { flex: 1; display: flex; align-items: flex-end; gap: 2mm; }
.field span { white-space: nowrap; }
.field i { flex: 1; border-bottom: 1px solid var(--line); height: 5mm; }
.box { border: 1px solid var(--line); border-radius: 4mm; padding: 4mm 5mm; }
.box h3 { font-family: 'Playfair Display', serif; font-weight: 400; font-size: 13pt; margin-bottom: 2.5mm; }
.box h3 em { color: var(--accent); }
.lines i { display: block; border-bottom: 1px solid var(--line); height: 7.5mm; }
.pill { display: inline-block; background: var(--soft); border-radius: 10mm; padding: 1.5mm 4.5mm; font-size: 9pt; }
.circle { border: 1.2px solid var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.milestones { display: flex; justify-content: space-between; font-size: 8pt; color: var(--muted); margin: 0 0 3mm; }
.milestones b { font-weight: 500; color: var(--ink); }
table { width: 100%; border-collapse: collapse; font-size: 9pt; }
td { border-bottom: 1px solid var(--line); height: 9.2mm; padding: 0 1mm; }
td.amt { width: 26mm; text-align: right; color: var(--muted); }
tr.total td { border-bottom: none; font-weight: 500; padding-top: 1.5mm; }
`;

const fields = (...labels) => `<div class="fields">${labels.map(l => `<div class="field"><span>${l}</span><i></i></div>`).join('')}</div>`;
const lines = (n) => `<div class="lines">${'<i></i>'.repeat(n)}</div>`;
const footer = (n) => `<div class="footer"><span>SouParSou · Kit Épargne</span><span>${String(n).padStart(2, '0')} / 08</span></div>`;
const blobs = (a, b) => `<div class="blob" style="${a}"></div><div class="blob" style="${b}"></div>`;
const header = (kicker, title, sub) => `<div class="kicker">${kicker}</div><h1>${title}</h1><div class="sub">${sub}</div>`;

// Grille de 100 cases à colorier pour un objectif fixe.
const grid100 = (step, label = (i) => i * step, gap = 4.6) => {
  const cells = Array.from({ length: 100 }, (_, i) => `<div class="circle" style="width:15mm;height:15mm;font-size:8pt;color:var(--muted)">${label(i + 1)}</div>`).join('');
  return `<div style="display:grid;grid-template-columns:repeat(10,15mm);justify-content:space-between;row-gap:${gap}mm;">${cells}</div>`;
};
const milestones = (total) => `<div class="milestones">${[0.25, 0.5, 0.75, 1].map(p => `<span>${p * 100} % · <b>${(total * p).toLocaleString('fr-FR')} €</b></span>`).join('')}</div>`;

const pages = [
  // 1. Couverture + mode d'emploi
  () => `<div class="page" style="justify-content:center;">
    ${blobs('width:150mm;height:150mm;top:-55mm;right:-55mm;', 'width:110mm;height:110mm;bottom:-40mm;left:-40mm;')}
    <div style="text-align:center;">
      <div class="kicker">Printable · 8 pages · A4</div>
      <h1 style="font-size:52pt;margin:6mm 0 3mm;">Kit <em>Épargne</em></h1>
      <div class="sub" style="font-size:12pt;">Mes défis et trackers pour atteindre mes objectifs</div>
      <div style="width:22mm;height:1px;background:var(--accent);margin:12mm auto;"></div>
    </div>
    <div class="box" style="max-width:130mm;margin:0 auto;padding:7mm 9mm;">
      <h3 style="text-align:center;margin-bottom:5mm;">Mode <em>d'emploi</em></h3>
      ${[
        ['Imprime', 'les pages dont tu as besoin, autant de fois que tu veux.'],
        ['Choisis', 'ton défi : 52 semaines, 1 000 €, 2 000 € ou ton propre objectif.'],
        ['Colorie', 'une case à chaque fois que tu mets de l\'argent de côté.'],
        ['Fais le point', 'chaque mois avec ton budget et ton bilan.'],
      ].map(([b, t], i) => `<div style="display:flex;gap:4mm;align-items:flex-start;margin-bottom:4mm;font-size:10pt;line-height:1.45;">
        <div class="circle" style="width:7mm;height:7mm;flex:none;font-size:8pt;">${i + 1}</div>
        <div><b style="font-weight:500;">${b}</b> ${t}</div></div>`).join('')}
    </div>
    <div style="text-align:center;margin-top:14mm;font-size:7.5pt;color:var(--muted);letter-spacing:.08em;">Un kit <span style="font-family:'Playfair Display',serif;font-style:italic;font-size:10pt;color:var(--accent);letter-spacing:0;">SouParSou</span> · Usage personnel uniquement · Revente et partage interdits</div>
  </div>`,

  // 2. Défi 52 semaines
  () => {
    const cells = Array.from({ length: 52 }, (_, i) => `<div style="display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:3mm;padding:0 3mm;height:12.6mm;">
      <div><div style="font-size:6.5pt;letter-spacing:.15em;color:var(--muted);text-transform:uppercase;">Semaine ${i + 1}</div><div style="font-family:'Playfair Display',serif;font-size:12pt;">${i + 1} €</div></div>
      <div class="circle" style="width:6mm;height:6mm;"></div></div>`).join('');
    return `<div class="page">
      ${blobs('width:90mm;height:90mm;top:-40mm;right:-30mm;', 'width:0;height:0;')}
      ${header('Défi', 'Le défi des <em>52 semaines</em>', 'Chaque semaine, j\'épargne le numéro de la semaine. À la fin : 1 378 €.')}
      <div class="rule"></div>
      ${fields('Date de début', 'Date de fin')}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2.2mm;margin-top:5mm;">${cells}</div>
      <div style="margin-top:4mm;text-align:center;"><span class="pill">Total à la fin du défi : <b style="font-weight:500;">1 378 €</b></span></div>
      ${footer(2)}</div>`;
  },

  // 3. Objectif 1 000 €
  () => `<div class="page">
    ${blobs('width:100mm;height:100mm;top:-45mm;left:-35mm;', 'width:70mm;height:70mm;bottom:-30mm;right:-25mm;')}
    ${header('Tracker', 'Objectif <em>1 000 €</em>', 'Une case = 10 €. Je colorie une case à chaque fois que j\'épargne.')}
    <div class="rule"></div>
    ${fields('Pour', 'Date de début', 'Objectif atteint le')}
    <div style="margin-top:6mm;">${milestones(1000)}${grid100(10)}</div>
    ${footer(3)}</div>`,

  // 4. Objectif 2 000 €
  () => `<div class="page">
    ${blobs('width:100mm;height:100mm;top:-45mm;right:-35mm;', 'width:70mm;height:70mm;bottom:-30mm;left:-25mm;')}
    ${header('Tracker', 'Objectif <em>2 000 €</em>', 'Une case = 20 €. Je colorie une case à chaque fois que j\'épargne.')}
    <div class="rule"></div>
    ${fields('Pour', 'Date de début', 'Objectif atteint le')}
    <div style="margin-top:6mm;">${milestones(2000)}${grid100(20)}</div>
    ${footer(4)}</div>`,

  // 5. Objectif personnalisé
  () => `<div class="page">
    ${blobs('width:90mm;height:90mm;top:-40mm;right:-30mm;', 'width:0;height:0;')}
    ${header('Tracker', 'Mon objectif <em>à moi</em>', 'Un voyage, le permis, un fonds d\'urgence… je choisis.')}
    <div class="rule"></div>
    ${fields('Mon objectif', 'Montant')}
    <div style="height:6mm"></div>
    ${fields('Date de début', 'Date limite', '1 case =')}
    <div class="box" style="margin-top:5mm;"><h3>Pourquoi c'est <em>important</em> pour moi</h3>${lines(2)}</div>
    <div style="margin-top:5mm;">${grid100(0, () => '', 2.6)}</div>
    ${footer(5)}</div>`,

  // 6. Budget mensuel
  () => {
    const tbl = (rows, totalLabel) => `<table>${rows.map(r => `<tr><td>${r}</td><td class="amt">€</td></tr>`).join('')}<tr class="total"><td>${totalLabel}</td><td class="amt">€</td></tr></table>`;
    return `<div class="page">
      ${blobs('width:100mm;height:100mm;top:-45mm;left:-35mm;', 'width:0;height:0;')}
      ${header('Budget', 'Mon budget <em>du mois</em>', 'Je sais ce qui rentre, ce qui sort, et ce que je mets de côté.')}
      <div class="rule"></div>
      ${fields('Mois', 'Année')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:5mm;">
        <div class="box"><h3><em>Revenus</em></h3>${tbl(['Salaire', 'Aides (APL, bourse…)', 'Revenus en plus', ''], 'Total revenus')}</div>
        <div class="box"><h3>Dépenses <em>fixes</em></h3>${tbl(['Logement', 'Transport', 'Téléphone / internet', 'Abonnements', ''], 'Total fixes')}</div>
        <div class="box"><h3>Dépenses <em>variables</em></h3>${tbl(['Courses', 'Sorties', 'Shopping', 'Imprévus', ''], 'Total variables')}</div>
        <div class="box"><h3>Mon <em>épargne</em></h3>${tbl(['Objectif du mois', 'Épargné', 'Différence'], 'Total épargne')}</div>
      </div>
      <div class="box" style="margin-top:5mm;background:var(--softer);border-color:var(--soft);">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:10pt;">
          ${['Revenus', '−', 'Dépenses', '=', 'Reste à épargner'].map(s => s.length === 1 ? `<span style="font-family:'Playfair Display',serif;font-size:16pt;color:var(--accent);">${s}</span>` : `<div style="text-align:center;"><div style="font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:2mm;">${s}</div><div style="width:38mm;height:10mm;border-radius:3mm;background:#fff;border:1px solid var(--line);"></div></div>`).join('')}
        </div></div>
      ${footer(6)}</div>`;
  },

  // 7. Défi 30 jours sans dépenses inutiles
  () => {
    const days = Array.from({ length: 30 }, (_, i) => `<div class="circle" style="width:19mm;height:19mm;font-family:'Playfair Display',serif;font-size:13pt;">${i + 1}</div>`).join('');
    return `<div class="page">
      ${blobs('width:90mm;height:90mm;top:-40mm;right:-30mm;', 'width:70mm;height:70mm;bottom:-30mm;left:-25mm;')}
      ${header('Défi', '30 jours <em>sans dépenses inutiles</em>', 'Je colorie chaque jour où je n\'achète rien en dehors de l\'essentiel.')}
      <div class="rule"></div>
      ${fields('Date de début', 'Date de fin')}
      <div style="display:grid;grid-template-columns:repeat(6,19mm);justify-content:space-between;row-gap:3.5mm;margin-top:6mm;">${days}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm;">
        <div class="box"><h3><em>Autorisé</em></h3>${lines(4)}</div>
        <div class="box"><h3><em>Pas autorisé</em></h3>${lines(4)}</div>
      </div>
      <div style="margin-top:5mm;text-align:center;"><span class="pill">Argent économisé grâce au défi : ________ €</span></div>
      ${footer(7)}</div>`;
  },

  // 8. Bilan du mois
  () => `<div class="page">
    ${blobs('width:100mm;height:100mm;top:-45mm;left:-35mm;', 'width:0;height:0;')}
    ${header('Bilan', 'Mon bilan <em>du mois</em>', 'Je regarde le chemin parcouru, et je prépare le mois suivant.')}
    <div class="rule"></div>
    ${fields('Mois', 'Année')}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:5mm;">
      ${['Épargné ce mois', 'Total épargné', 'Objectif atteint'].map((l, i) => `<div class="box" style="text-align:center;background:var(--softer);border-color:var(--soft);"><div style="font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);">${l}</div><div style="height:12mm;display:flex;align-items:flex-end;justify-content:center;font-family:'Playfair Display',serif;font-size:13pt;color:var(--accent);">${i === 2 ? '%' : '€'}</div></div>`).join('')}
    </div>
    <div class="box" style="margin-top:5mm;"><h3>Mes <em>3 réussites</em></h3>${lines(4)}</div>
    <div class="box" style="margin-top:5mm;"><h3>Ce que <em>j'améliore</em> le mois prochain</h3>${lines(4)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:5mm;">
      <div class="box"><h3>Ma note <em>du mois</em></h3><div style="display:flex;gap:3mm;margin-top:2mm;">${[1, 2, 3, 4, 5].map(n => `<div class="circle" style="width:10mm;height:10mm;font-size:9pt;color:var(--muted);">${n}</div>`).join('')}</div></div>
      <div class="box"><h3>Mon objectif <em>du mois prochain</em></h3>${lines(2)}</div>
    </div>
    ${footer(8)}</div>`,
];

(async () => {
  const browser = await chromium.launch();
  const only = process.argv[2];
  for (const [key, t] of Object.entries(THEMES)) {
    if (only && key !== only) continue;
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${css(t)}</style></head><body>${pages.map(p => p()).join('')}</body></html>`;
    fs.writeFileSync(path.join(TMP, `kit-${key}.html`), html);
    const page = await browser.newPage();
    await page.goto('file://' + path.join(TMP, `kit-${key}.html`));
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(OUT, `Kit-Epargne-Aesthetic-${t.name}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
    // Aperçus pour vérifier la mise en page.
    await page.setViewportSize({ width: 794, height: 1123 });
    const els = await page.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(TMP, `prev-${key}-${i + 1}.png`) });
    await page.close();
    console.log('ok', key);
  }
  await browser.close();
})();
