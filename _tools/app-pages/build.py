# Build digirunestudios.com/<slug>/index.html app info pages from data.py.
# Base look (tokens, nav, buttons, badges, footer) is lifted from the live portfolio page so the
# pages stay one brand system. Usage: python3 build.py /path/to/digirunestudios-repo
import sys, re, os, json, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data import APPS

REPO = sys.argv[1]
src = open(os.path.join(REPO, 'portfolio/index.html'), encoding='utf8').read()
base_css = re.search(r'<style>\n(:root\{.*?)</style>', src, re.S).group(1)
apple_svg = re.search(r'(<span class="g"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12\.15.*?</svg></span>)', src).group(1)
play_svg = re.search(r'(<span class="g"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22\.02.*?</svg></span>)', src).group(1)
footer = re.search(r'(<footer>.*?</footer>)', src, re.S).group(1).replace('<a href="/#apps">Apps</a>', '<a href="/portfolio/">Portfolio</a>', 1)

PAGE_CSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'page.css'), encoding='utf8').read()

def esc(s): return html.escape(s, quote=True)

def badges(a, slug, where):
    return (f'<div class="badges">'
            f'<a class="badge" data-goatcounter-click="store-{slug}-apple-{where}" data-goatcounter-title="{esc(a["name"])}: App Store ({where})" href="{a["apple"]}" target="_blank" rel="noopener">{apple_svg}<span><small>Download on the</small><strong>App Store</strong></span></a>'
            f'<a class="badge" data-goatcounter-click="store-{slug}-google-{where}" data-goatcounter-title="{esc(a["name"])}: Google Play ({where})" href="{a["play"]}" target="_blank" rel="noopener">{play_svg}<span><small>Get it on</small><strong>Google Play</strong></span></a>'
            f'</div>')

def build(slug, a):
    url = f'https://digirunestudios.com/{slug}/'
    ld = {"@context": "https://schema.org", "@type": "MobileApplication", "name": a['name'],
          "operatingSystem": "iOS, Android", "applicationCategory": "GameApplication",
          "description": a['meta'], "url": url, "image": f'https://digirunestudios.com/assets/apps/{slug}-feature.jpg',
          "author": {"@type": "Organization", "name": "DigiRune Studios", "url": "https://digirunestudios.com/"},
          "sameAs": [a['apple'], a['play']]}
    shots = '\n'.join(
        f'<figure class="shot"><img src="../assets/apps/{f}.webp" width="640" height="1138" alt="{esc(alt)}" loading="lazy" decoding="async"></figure>'
        for f, alt in a['shots'])
    inside = '\n'.join(f'<article class="feat"><h3>{esc(t)}</h3><p>{esc(d)}</p></article>' for t, d in a['inside'])
    tools = '\n'.join(f'<li><b>{esc(t)}</b><span>{esc(d)}</span></li>' for t, d in a['tools'])
    built = '\n'.join(f'<li>{esc(b)}</li>' for b in a['built'])
    pills = ''.join(f'<span class="ap-pill">{esc(p)}</span>' for p in a['pills'])
    extra = ''
    if a['extra']:
        extra = (f'<section class="sec sec-tight"><div class="wrap"><div class="secret">'
                 f'<span class="eyebrow">Hidden lore</span><h2>{esc(a["extra"][0])}</h2><p>{esc(a["extra"][1])}</p></div></div></section>')
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(a['title'])}</title>
<meta name="description" content="{esc(a['meta'])}">
<meta name="theme-color" content="#0F0B07">
<link rel="icon" href="../favicon.png">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DigiRune Studios">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(a['title'])}">
<meta property="og:description" content="{esc(a['meta'])}">
<meta property="og:image" content="https://digirunestudios.com/assets/apps/{slug}-feature.jpg">
<meta property="og:image:width" content="1024">
<meta property="og:image:height" content="500">
<meta name="twitter:card" content="summary_large_image">
<meta name="apple-itunes-app" content="app-id={a['apple'].rsplit('id',1)[1]}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{base_css}</style>
<style>
:root{{--accent:{a['accent']};--accent-2:{a['accent2']};--glow:{a['glow']};--tint:{a['tint']}}}
{PAGE_CSS}</style>
</head>
<body class="app-page">
<header class="nav" id="nav">
  <div class="wrap nav-in">
    <a class="brand" href="/"><img src="../assets/medallion-96.webp" width="36" height="36" alt="DigiRune Studios"><span>DigiRune <b>Studios</b></span></a>
    <nav class="nav-links">
      <a href="/portfolio/">Portfolio</a>
      <a href="/#publishers">Publishers</a>
      <a href="/#contact">Contact</a>
      <a class="btn btn-primary btn-sm nav-cta" href="#get"><span class="d-full">Get the App</span><span class="d-short">Get It</span></a>
    </nav>
  </div>
</header>
<main>
<section class="ap-hero">
  <div class="wrap ap-grid">
    <div class="ap-copy">
      <div class="ap-id"><img class="ap-icon" src="{a['icon']}" width="72" height="72" alt="{esc(a['name'])} app icon"><span class="eyebrow">{esc(a['eyebrow'])}</span></div>
      <h1>{a['h1']}</h1>
      <p class="tagline">{' '.join('<span class="nw">'+esc(x)+'</span>' for x in re.split(r'(?<=[.,]) ', a['tagline']))}</p>
      <p class="ap-lede">{esc(a['lede'])}</p>
      {badges(a, slug, 'hero')}
      <div class="ap-pills">{pills}</div>
    </div>
    <div class="ap-art"><img src="{a['feature']}" width="1024" height="500" alt="{esc(a['name'])}: {esc(a['tagline'])}" fetchpriority="high"></div>
  </div>
</section>

<section class="sec sec-tight" id="look">
  <div class="wrap">
    <div class="sec-head center"><span class="eyebrow">A look inside</span><h2>See it at the table</h2></div>
  </div>
  <div class="shots" tabindex="0" aria-label="App screenshots, scroll sideways">
{shots}
  </div>
</section>

<section class="sec sec-tight" id="demo">
  <div class="wrap demo-grid">
    <div class="demo-copy"><span class="eyebrow">Watch the demo</span><h2>See it in action</h2><p>A quick tour of the real app, in&nbsp;under&nbsp;20&nbsp;seconds.</p></div>
    <div class="demo-frame"><video controls playsinline preload="none" poster="{a['poster']}" src="{a['video']}" aria-label="{esc(a['name'])} demo video"></video></div>
  </div>
</section>

<section class="sec" id="inside">
  <div class="wrap">
    <div class="sec-head center"><span class="eyebrow">{esc(a['kicker'])}</span><h2>{esc(a['inside_title'])}</h2></div>
    <div class="feat-grid">
{inside}
    </div>
    <div class="two-col">
      <div class="panel"><h3>{esc(a['tools_title'])}</h3><ul class="tool-list">
{tools}
      </ul></div>
      <div class="panel"><h3>{esc(a['built_title'])}</h3><ul class="check-list">
{built}
      </ul></div>
    </div>
  </div>
</section>
{extra}
<section class="sec get" id="get">
  <div class="wrap get-in">
    <img class="get-icon" src="{a['icon']}" width="88" height="88" alt="" loading="lazy">
    <h2>Get {esc(a['name'])}</h2>
    <p>Available now on iPhone, iPad and Android.</p>
    {badges(a, slug, 'footer')}
    <p class="credit">{esc(a['credit'])}</p>
    <a class="btn btn-ghost btn-sm" href="/portfolio/">See Our Entire Portfolio <span class="arw" aria-hidden="true">&rarr;</span></a>
  </div>
</section>
</main>
{footer}
<script>
(function(){{var nav=document.getElementById('nav');function s(){{nav.classList.toggle('scrolled',window.scrollY>12)}}window.addEventListener('scroll',s,{{passive:true}});s();}})();
</script>
<!-- GoatCounter analytics (privacy-friendly, no cookies) -->
<script data-goatcounter="https://digirune.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
'''

for slug, a in APPS.items():
    out = os.path.join(REPO, slug, 'index.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    page = build(slug, a)
    assert '—' not in page.split('<style>')[0] and '—' not in page.split('</style>')[-1], 'em dash in copy'
    open(out, 'w', encoding='utf8').write(page)
    print('wrote', out, len(page))
