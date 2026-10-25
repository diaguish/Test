// Génère les images de l'annonce Etsy (2700 x 2025 px) à partir des pages du kit.
// À lancer après build.js, qui laisse les pages HTML dans le dossier temporaire.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

const TMP = os.tmpdir();
const OUT = path.join(__dirname, '..', 'etsy');
const W = 2700, H = 2025;

const fontsCss = fs.readFileSync(path.join(__dirname, 'fonts/fonts.css'), 'utf8')
  .replace(/url\(([^)]+\.woff2)\)/g, (_, f) => `url(file://${path.join(__dirname, 'fonts', f)})`);

const C = { ink: '#4A3F35', muted: '#8C7B6B', accent: '#C4A484', bg: '#F3EBE1', bg2: '#E9DDCF' };
const img = (theme, n) => `file://${path.join(TMP, `hd-${theme}-${n}.png`)}`;
const sheet = (theme, n, w, extra = '') => `<img src="${img(theme, n)}" style="width:${w}px;border-radius:6px;box-shadow:0 30px 60px rgba(74,63,53,.18),0 6px 14px rgba(74,63,53,.10);${extra}">`;

const base = `${fontsCss}
* { margin:0; padding:0; box-sizing:border-box; }
body { width:${W}px; height:${H}px; overflow:hidden; font-family:'DM Sans',sans-serif; color:${C.ink};
  background: radial-gradient(circle at 80% 15%, #FBF7F2 0, ${C.bg} 45%, ${C.bg2} 100%); position:relative; }
.kicker { font-size:34px; letter-spacing:.3em; text-transform:uppercase; color:${C.muted}; }
h1 { font-family:'Playfair Display',serif; font-weight:400; font-size:150px; line-height:1.02; }
h1 em, h2 em { font-style:italic; color:${C.accent}; }
h2 { font-family:'Playfair Display',serif; font-weight:400; font-size:104px; line-height:1.05; }
.sub { font-size:46px; color:${C.muted}; font-weight:300; line-height:1.4; }
.pill { display:inline-block; background:#fff; border-radius:80px; padding:22px 48px; font-size:40px; box-shadow:0 10px 30px rgba(74,63,53,.08); }
.badge { position:absolute; width:330px; height:330px; border-radius:50%; background:${C.accent}; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-size:38px; line-height:1.2; }
.badge b { font-family:'Playfair Display',serif; font-weight:400; font-size:96px; line-height:1; }
`;

const slides = {
  // 1. Image principale : celle qu'on voit dans les résultats de recherche.
  '01-principale': `
    <div style="position:absolute;left:170px;top:520px;width:1050px;">
      <div class="kicker">Printable · PDF A4 · En euros</div>
      <h1 style="margin:40px 0 50px;">Kit <em>Épargne</em></h1>
      <div class="sub">Défi 52 semaines, trackers 1 000 € et 2 000 €, budget du mois et bilan.</div>
      <div style="margin-top:80px;display:flex;gap:24px;flex-wrap:wrap;">
        <span class="pill">8 pages</span><span class="pill">En français</span><span class="pill">À imprimer</span>
      </div>
    </div>
    <div style="position:absolute;left:1330px;top:230px;transform:rotate(-7deg);">${sheet('sauge', 1, 760)}</div>
    <div style="position:absolute;left:1820px;top:250px;transform:rotate(6deg);">${sheet('rose', 2, 760)}</div>
    <div style="position:absolute;left:1560px;top:330px;">${sheet('beige', '3-rempli', 900)}</div>
    <div class="badge" style="left:2240px;top:1560px;"><b>3</b>coloris<br>inclus</div>`,

  // 2. Contenu du kit.
  '02-contenu': (() => {
    const names = ['Couverture & mode d\'emploi', 'Défi 52 semaines', 'Objectif 1 000 €', 'Objectif 2 000 €', 'Mon objectif à moi', 'Budget du mois', '30 jours sans dépenses inutiles', 'Bilan du mois'];
    return `
    <div style="text-align:center;padding-top:110px;"><div class="kicker">Ce qu'il y a dedans</div><h2 style="margin-top:24px;">8 pages <em>pour épargner</em></h2></div>
    <div style="display:grid;grid-template-columns:repeat(4,520px);gap:60px 70px;justify-content:center;margin-top:70px;">
      ${names.map((n, i) => `<div style="text-align:center;">${sheet('beige', i + 1, 380, 'height:537px;object-fit:cover;object-position:top;')}<div style="font-size:34px;margin-top:26px;">${i + 1}. ${n}</div></div>`).filter((_, i) => i < 8).join('')}
    </div>`;
  })(),

  // 3. Défi 52 semaines.
  '03-defi-52-semaines': `
    <div style="position:absolute;left:170px;top:420px;width:1150px;">
      <div class="kicker">Le défi le plus populaire</div>
      <h2 style="margin:36px 0 50px;">Le défi des <em>52 semaines</em></h2>
      <div class="sub">Semaine 1 : j'épargne 1 €. Semaine 2 : 2 €.<br>Et ainsi de suite jusqu'à 52 €.<br>Je coche chaque semaine, sans y penser.</div>
      <div style="margin-top:80px;" class="pill">À la fin de l'année : <b style="font-weight:500;">1 378 €</b> 🎉</div>
    </div>
    <div style="position:absolute;left:1500px;top:150px;transform:rotate(3deg);">${sheet('beige', '2-rempli', 1220)}</div>`,

  // 4. Trackers 1 000 € et 2 000 €.
  '04-trackers': `
    <div style="text-align:center;padding-top:110px;"><div class="kicker">Une case = 10 € ou 20 €</div><h2 style="margin-top:24px;">Colorie <em>jusqu'à ton objectif</em></h2></div>
    <div style="position:absolute;left:330px;top:520px;transform:rotate(-4deg);">${sheet('rose', '3-rempli', 1000)}</div>
    <div style="position:absolute;left:1370px;top:500px;transform:rotate(4deg);">${sheet('rose', '4-rempli', 1000)}</div>`,

  // 5. Budget, défi 30 jours et bilan.
  '05-budget-bilan': `
    <div style="text-align:center;padding-top:110px;"><div class="kicker">Chaque mois</div><h2 style="margin-top:24px;">Budget, défi <em>et bilan</em></h2></div>
    <div style="display:flex;justify-content:center;gap:70px;margin-top:70px;">
      ${[6, 7, 8].map(n => sheet('sauge', n, 800)).join('')}
    </div>`,

  // 6. Les 3 coloris.
  '06-coloris': `
    <div style="text-align:center;padding-top:110px;"><div class="kicker">Inclus dans ton achat</div><h2 style="margin-top:24px;">3 coloris <em>au choix</em></h2></div>
    <div style="display:flex;justify-content:center;gap:80px;margin-top:60px;">
      ${[['beige', 'Beige'], ['rose', 'Rose poudré'], ['sauge', 'Vert sauge']].map(([t, n]) => `<div style="text-align:center;">${sheet(t, 1, 760)}<div style="font-size:44px;margin-top:30px;">${n}</div></div>`).join('')}
    </div>`,

  // 7. Comment ça marche.
  '07-comment-ca-marche': `
    <div style="text-align:center;padding-top:150px;"><div class="kicker">Produit numérique</div><h2 style="margin-top:24px;">Comment <em>ça marche</em></h2></div>
    <div style="display:flex;justify-content:center;gap:120px;margin-top:150px;">
      ${[['1', 'J\'achète', 'Le paiement se fait sur Etsy.'], ['2', 'Je télécharge', 'Les 3 PDF sont disponibles tout de suite.'], ['3', 'J\'imprime', 'Chez moi ou en imprimerie, autant de fois que je veux.']].map(([n, t, d]) => `
        <div style="width:620px;text-align:center;">
          <div style="width:190px;height:190px;border-radius:50%;border:4px solid ${C.accent};margin:0 auto 50px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:90px;color:${C.accent};">${n}</div>
          <div style="font-family:'Playfair Display',serif;font-size:66px;margin-bottom:24px;">${t}</div>
          <div class="sub">${d}</div></div>`).join('')}
    </div>
    <div style="text-align:center;margin-top:150px;font-size:36px;color:${C.muted};">Fichier numérique uniquement · Aucun produit physique ne sera envoyé</div>`,
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // Pages du kit en haute définition.
  const hd = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2.5 });
  for (const theme of ['beige', 'rose', 'sauge']) {
    await hd.goto('file://' + path.join(TMP, `kit-${theme}.html`));
    await hd.evaluate(() => document.fonts.ready);
    const els = await hd.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(TMP, `hd-${theme}-${i + 1}.png`) });
    // Versions « déjà commencées » : quelques cases coloriées, pour donner envie.
    await hd.evaluate(() => {
      const pages = document.querySelectorAll('.page');
      const fill = (el) => { el.style.background = 'var(--accent)'; el.style.color = '#fff'; };
      [2, 3].forEach((p, k) => pages[p].querySelectorAll('.circle').forEach((c, i) => { if (i < [37, 23][k]) fill(c); }));
      pages[1].querySelectorAll('.circle').forEach((c, i) => { if (i < 19) fill(c); });
    });
    for (const i of [1, 2, 3]) await els[i].screenshot({ path: path.join(TMP, `hd-${theme}-${i + 1}-rempli.png`) });
  }

  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const [name, body] of Object.entries(slides)) {
    const file = path.join(TMP, `etsy-${name}.html`);
    fs.writeFileSync(file, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${base}</style></head><body>${body}</body></html>`);
    await page.goto('file://' + file);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 90 });
    console.log('ok', name);
  }
  await browser.close();
})();
