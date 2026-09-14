"""Generate one vehicle detail page per simulated car, from inventory.html's shell.

Photographs are copied from Alex's projects into assets/img/vdp/, resized, and a
1200x630 social image is cut from the first. Run from anywhere; re-runnable.
"""
import html
import os
import re

from PIL import Image, ImageOps

ROOT = '/Users/alex/Desktop/WORK/Midwest Cobras, LLC'
WORK = '/Users/alex/Desktop/WORK'
SITE = 'https://sigovs.github.io/Midwest-cobras/'
os.chdir(ROOT)

M = ROOT + '/assets/img/'
H = WORK + '/HINDERER/assets/img/'
BEN = WORK + "/Sports Car Rescue /assets/img/rescued cars/Cars we've rescued photos Ben/"
GW = WORK + '/GULLWIMNG/CLIENT PHOTOS/2025.5 NEW Gullwing Motor Cars WEBSITE/# 22890 1956 Corvette Blue ('

CARS = [
    dict(id='mc-1024', year=2024, make='Backdraft Racing', model='RT4B Black Edition', price=78900, miles=420, stock='MC-1024',
         status='new', cond='New', cx=0.47,
         engine='Ford Coyote 5.0L V8', trans='Tremec TKX five-speed manual', ext='Red, black stripes', int_='Black leather',
         photos=[(M + 'car-rt4-front.jpg', 'three-quarter front'), (M + 'car-rt4b-side.jpg', 'profile, driver\'s side'),
                 (M + 'shot-02.jpg', 'front wing and headlight'), (M + 'shot-04.jpg', 'stripes across the bonnet'),
                 (M + 'shot-05.jpg', 'rear wheel and side pipe')],
         desc='A Backdraft Racing RT4B Black Edition in red with black stripes, on the Black Out package: ceramic-coated black side pipes and roll bar, and 18-inch matte black wheels. 420 miles since it was built.'),
    dict(id='mc-1025', year=2024, make='Backdraft Racing', model='RT4 Classic Edition', price=74500, miles=180, stock='MC-1025',
         status='new', cond='New', cx=0.46,
         engine='Ford 427 stroker V8', trans='Tremec TKX five-speed manual', ext='Navy, white stripes', int_='Tan leather',
         photos=[(M + 'car-rt4b-front.jpg', 'three-quarter front'), (M + 'car-rt4-side.jpg', 'profile, driver\'s side'),
                 (M + 'shot-01.jpg', 'stripes and headlight'), (M + 'shot-03.jpg', 'profile from the front wheel')],
         desc='A Backdraft Racing RT4 Classic Edition in navy with white stripes, on polished stainless side pipes and halibrand-style wheels, over tan leather. 180 miles since it was built.'),
    dict(id='mc-0981', year=2022, make='Backdraft Racing', model='RT4B Roadster', price=69900, miles=2140, stock='MC-0981',
         status='just', cond='Pre-owned', cx=0.5,
         engine='Ford 351W V8', trans='Tremec TKX five-speed manual', ext='Red, gunmetal centre stripe', int_='Black leather, red stitching',
         photos=[(H + 'vehicle-1.jpg', 'three-quarter front'), (H + 'vehicle-2.jpg', 'profile, driver\'s side'),
                 (H + 'vehicle-3.jpg', 'rear three-quarter'), (H + 'vehicle-4.jpg', 'cockpit, seats and shifter'),
                 (H + 'vehicle-5.jpg', 'door pocket and inner trim'), (H + 'vehicle-6.jpg', 'side profile with the aero screen')],
         desc='A 2022 RT4B Roadster in red with a gunmetal centre stripe, over black leather with red stitching and twin roll hoops. 2,140 miles.'),
    dict(id='mc-0952', year=2021, make='Backdraft Racing', model='RT4 Roadster', price=64500, miles=3860, stock='MC-0952',
         status='', cond='Pre-owned', cx=0.5,
         engine='Ford Coyote 5.0L V8', trans='Tremec TKX five-speed manual', ext='Black, red pinstripe', int_='Black leather',
         photos=[(H + 'inventory-1.jpg', 'three-quarter front')],
         desc='A 2021 RT4 Roadster in black with a red pinstripe, over black leather. 3,860 miles.'),
    dict(id='mc-0934', year=2020, make='Backdraft Racing', model='RT4 Roadster', price=61900, miles=5210, stock='MC-0934',
         status='', cond='Pre-owned', cx=0.56,
         engine='Ford 427 stroker V8', trans='Tremec TKX five-speed manual', ext='Blue, white stripes', int_='Black leather',
         photos=[(H + 'hero-cobra.jpg', 'parked at night')],
         desc='A 2020 RT4 Roadster in blue with white stripes, over black leather. 5,210 miles.'),
    dict(id='mc-0917', year=2019, make='Backdraft Racing', model='RT4 Roadster', price=58900, miles=6420, stock='MC-0917',
         status='sold', cond='Pre-owned', cx=0.76,
         engine='Ford 351W V8', trans='Tremec TKX five-speed manual', ext='Grey, white stripes', int_='Black leather',
         photos=[(H + 'build-base.jpg', 'profile')],
         desc='A 2019 RT4 Roadster in grey with white stripes. It has sold, and stays here as a record of what has passed through the shop.'),
    dict(id='mc-c112', year=1965, make='Shelby', model='GT350', price=185000, miles=48200, stock='MC-C112',
         status='consign', cond='Consignment', cx=0.5,
         engine='289 cu in V8', trans='Four-speed manual', ext='White, blue side stripes', int_='Black vinyl',
         photos=[(BEN + '1965 Shelby GT350.JPG', 'profile, driver\'s side')],
         desc='A 1965 Shelby GT350 in white with blue side stripes, offered on consignment. 48,200 miles.'),
    dict(id='mc-c108', year=1967, make='Porsche', model='911S', price=159500, miles=71300, stock='MC-C108',
         status='consign', cond='Consignment', cx=0.52,
         engine='2.0L flat six', trans='Five-speed manual', ext='Slate blue', int_='Black leatherette',
         photos=[(BEN + '1967 Porsche 911S Large.jpeg', 'three-quarter front')],
         desc='A 1967 Porsche 911S in slate blue, offered on consignment. 71,300 miles.'),
    dict(id='mc-c104', year=1956, make='Chevrolet', model='Corvette', price=98500, miles=34900, stock='MC-C104',
         status='sold', cond='Consignment', cx=0.46,
         engine='265 cu in V8', trans='Three-speed manual', ext='Light blue, beige coves', int_='Beige vinyl',
         photos=[(GW + '16).JPG', 'three-quarter front'), (GW + '9).JPG', 'profile, driver\'s side'),
                 (GW + '13).JPG', 'rear three-quarter'), (GW + '14).JPG', 'tail'), (GW + '18).JPG', 'front three-quarter, passenger\'s side')],
         desc='A 1956 Chevrolet Corvette in light blue with beige coves. It sold on consignment, and stays here as a record of what has passed through the shop.'),
    dict(id='mc-c101', year=1959, make='Elva', model='Mk V', price=89000, miles=0, stock='MC-C101',
         status='consign', cond='Consignment', cx=0.5,
         engine='1.1L four', trans='Four-speed manual', ext='White, number 39', int_='Race seat',
         photos=[(BEN + 'Elva Racecar.JPG', 'three-quarter front')],
         desc='A 1959 Elva Mk V race car in white, number 39, offered on consignment.'),
]
LABEL = {'new': 'New', 'just': 'Just in', 'sold': 'Sold', 'consign': 'Consignment', '': 'Available'}


def money(n):
    return '${:,}'.format(n)


def miles(c):
    return 'Race car' if c['miles'] == 0 else '{:,} mi'.format(c['miles'])


def esc(s):
    return html.escape(s, quote=True)


# ── photographs ────────────────────────────────────────────────────────────
os.makedirs('assets/img/vdp', exist_ok=True)
for c in CARS:
    c['files'] = []
    for n, (src, alt) in enumerate(c['photos'], 1):
        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        im.thumbnail((1600, 1600), Image.LANCZOS)
        name = 'assets/img/vdp/%s-%d.jpg' % (c['id'], n)
        im.save(name, quality=80, optimize=True, progressive=True)
        c['files'].append((name, im.size, alt))
    first = ImageOps.exif_transpose(Image.open(c['photos'][0][0])).convert('RGB')
    w, h = first.size
    tw, th = (w, int(w * 630 / 1200)) if w / h <= 1200 / 630 else (int(h * 1200 / 630), h)
    left = int(max(0, min(w - tw, c['cx'] * w - tw / 2)))
    top = (h - th) // 2
    first.crop((left, top, left + tw, top + th)).resize((1200, 630), Image.LANCZOS).save(
        'assets/img/vdp/%s-og.jpg' % c['id'], quality=82, optimize=True, progressive=True)

# ── the shell ──────────────────────────────────────────────────────────────
inv = open('inventory.html').read()
head_end = inv.index('<main id="top">')
shell_head = inv[:head_end]
after_main = inv[inv.index('</main>') + len('</main>'):]
dialog = after_main[after_main.index('\n\n<!-- ══'):after_main.index('</dialog>') + len('</dialog>')]
popover = after_main[after_main.index('</dialog>') + len('</dialog>'):after_main.index('</div>\n\n<footer') + len('</div>')]
footer = after_main[after_main.index('\n\n<footer'):]

ICON_TEXT = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
ICON_SHARE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M12 15V4m0 0L8 8m4-4 4 4M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ICON_SAVE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
PREV = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
NEXT = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'

PROMOS = [
    ('build.html', 'assets/img/build/gen-build-hero-rt4b.jpg', 'Build your own Cobra', 'Start a build'),
    ('finance.html', 'assets/img/photo-workshop.jpg', 'Apply for financing', 'Apply'),
    ('consignment.html', 'assets/img/hero-cover-day.jpg', 'Consign your car', 'Tell us about it'),
    ('index12.html#services', 'assets/img/service-transport.png', 'Transportation, door to door', 'How it works'),
]

for c in CARS:
    name = '%d %s %s' % (c['year'], c['make'], c['model'])
    page = 'vehicle-%s.html' % c['id']
    files = c['files']
    first_file, first_size, first_alt = files[0]
    sms = 'sms:+19136625000?&amp;body=' + esc('Hi Evan, is the %s (stock %s) still available?' % (name, c['stock'])).replace(' ', '%20')
    status = LABEL[c['status']]
    many = len(files) > 1

    stage_nav = ''
    thumbs = ''
    if many:
        stage_nav = '''
            <button class="stage__nav stage__nav--prev" type="button" data-stage-prev aria-label="Previous photograph">%s</button>
            <button class="stage__nav stage__nav--next" type="button" data-stage-next aria-label="Next photograph">%s</button>
            <p class="stage__index" data-stage-index>1 / %d</p>''' % (PREV, NEXT, len(files))
        thumbs = '\n          <div class="thumbs" role="group" aria-label="Photographs of this car">\n' + '\n'.join(
            '            <button class="thumb" type="button" aria-current="%s" data-thumb data-src="%s" data-alt="%s">'
            '<img src="%s" alt="Photograph %d: %s" width="%d" height="%d" loading="lazy" decoding="async"></button>'
            % ('true' if n == 0 else 'false', f, esc(name + ', ' + alt), f, n + 1, esc(alt), s[0], s[1])
            for n, (f, s, alt) in enumerate(files)) + '\n          </div>'

    photos_section = ''
    if len(files) > 2:
        photos_section = """

  <!-- Every photograph, on the dark. Each opens in the gallery at the top. -->
  <section class="sect sect--950 vdp-photos" id="photos" aria-labelledby="photos-title">
    <div class="vdp-photos__head">
      <p class="tag"><span class="tag__dot" aria-hidden="true"></span>Photographs</p>
      <h2 class="sect__title" id="photos-title">%d photographs.</h2>
    </div>
    <div class="photos__grid">
""" % len(files) + '\n'.join(
            '      <button class="photos__item" type="button" data-photo="%d" aria-label="Show photograph %d, %s, at the top">'
            '<img src="%s" alt="" width="%d" height="%d" loading="lazy" decoding="async"></button>'
            % (n, n + 1, esc(alt), f, s[0], s[1]) for n, (f, s, alt) in enumerate(files)) + """
    </div>
  </section>"""

    rows = [('Year', str(c['year'])), ('Make', c['make']), ('Model', c['model']), ('Engine', c['engine']),
            ('Transmission', c['trans']), ('Exterior', c['ext']), ('Interior', c['int_']), ('Mileage', miles(c)),
            ('Stock', c['stock']), ('Condition', c['cond']), ('Status', status)]
    spec_rows = '\n'.join('          <div><dt>%s</dt><dd>%s</dd></div>' % (k, esc(v)) for k, v in rows)
    sold = c['status'] == 'sold'
    ask_title = 'Ask Evan for one like it.' if sold else 'Ask Evan about it.'
    note = ('This car has sold. It stays here as a record of what has passed through the shop.' if sold
            else 'It is on the floor at the shop in Basehor, Kansas. The price excludes tax, title and delivery.')

    # three more cars, in inventory order after this one
    at_i = CARS.index(c)
    others = [CARS[(at_i + k) % len(CARS)] for k in range(1, 4)]
    more = '\n'.join("""        <li class="car%(cls)s">
          <div class="car__media">
            <a class="car__shot" href="vehicle-%(oid)s.html" tabindex="-1" aria-hidden="true"><img src="%(img)s" alt="" width="%(w)d" height="%(h)d" loading="lazy" decoding="async"></a>%(badge)s
          </div>
          <div class="car__body">
            <h3 class="car__title"><a href="vehicle-%(oid)s.html">%(oname)s</a></h3>
            <p class="car__price">%(oprice)s</p>
            <p class="car__meta"><span>%(omiles)s</span><span aria-hidden="true">&middot;</span><span>Stock %(ostock)s</span></p>
            <a class="btn btn--solid car__details" href="vehicle-%(oid)s.html">View details <span aria-hidden="true">&rarr;</span></a>
          </div>
        </li>""" % dict(cls=(' car--' + o['status']) if o['status'] else '', oid=o['id'], img=o['files'][0][0],
                       w=o['files'][0][1][0], h=o['files'][0][1][1],
                       badge=('\n            <p class="car__status">%s</p>' % LABEL[o['status']]) if o['status'] else '',
                       oname=esc('%d %s %s' % (o['year'], o['make'], o['model'])), oprice=money(o['price']),
                       omiles=miles(o), ostock=o['stock']) for o in others)

    main = """<main id="top">

  <!-- ══════════════════════════════════════════════════════════════════════
       A CAR'S OWN PAGE — Alex, 2026-09-14: "View details is a separate VDP
       page", and "Hinderer is not the model for the VDP". So it is set as
       this site sets a lot: the car first, large, on the dark, with its lot
       line under it — stock and status in the mono that records, the name in
       the display face, the price; then the record on bone, where the
       specification lives, beside a held card to ask Evan about it; every
       photograph on the dark; and three more cars from the floor.

       Generated per car (so a shared link previews this car), and SIMULATED
       like the inventory: real photographs from Alex's other projects, every
       figure made up. Content ledger, "inventory.html".
     ══════════════════════════════════════════════════════════════════════ -->
  <section class="sect sect--950 srp-page vdp-page" id="vehicle" aria-labelledby="vdp-title" data-vdp="%(id)s">
    <div class="vdp-bar">
      <a class="vdp-back" href="inventory.html"><span aria-hidden="true">&larr;</span>Inventory</a>
      <div class="vdp-bar__acts">
        <a class="car__act" data-enquiry-open aria-haspopup="dialog" href="%(sms)s">%(itext)sText</a>
        <button class="car__act" type="button" data-share aria-haspopup="true" aria-expanded="false" aria-controls="share-pop">%(ishare)s<span data-share-label>Share</span></button>
        <button class="car__act vdp-save" type="button" aria-pressed="false" data-save>%(isave)s<span data-save-label>Save</span></button>
      </div>
    </div>

    <div class="stage" data-stage tabindex="-1">
      <div class="stage__frame">
        <img src="%(first)s" alt="%(firstalt)s" width="%(fw)d" height="%(fh)d" data-stage-img fetchpriority="high">%(nav)s
      </div>%(thumbs)s
    </div>

    <header class="vdp-lot">
      <div class="vdp-lot__name">
        <p class="vdp-lot__line">Lot %(stock)s <span aria-hidden="true">&middot;</span> %(status)s</p>
        <h1 class="vdp-lot__title" id="vdp-title" data-vdp-name>%(name)s</h1>
      </div>
      <div class="vdp-lot__buy">
        <p class="vdp-lot__price">%(price)s</p>
        <a class="btn btn--solid" href="#enquire">Enquire <span aria-hidden="true">&rarr;</span></a>
      </div>
    </header>
  </section>

  <!-- The record: the specification on bone, beside a held card to ask. -->
  <section class="sect sect--bone vdp-record" id="specification" data-ground="light" aria-labelledby="spec-title">
    <div class="vdp-record__grid">
      <div class="vdp-record__main">
        <p class="tag"><span class="tag__dot" aria-hidden="true"></span>Specification</p>
        <h2 class="sect__title" id="spec-title">%(name)s.</h2>
        <p class="lede">%(desc)s</p>
        <dl class="spec vdp-spec">
%(spec)s
        </dl>
        <p class="vdp-record__note">%(note)s</p>
      </div>

      <aside class="vdp-ask" id="enquire" aria-labelledby="enquire-title">
        <p class="vdp-ask__k">Stock %(stock)s</p>
        <h2 class="vdp-ask__title" id="enquire-title">%(asktitle)s</h2>
        <p class="vdp-ask__price">%(price)s</p>
        <a class="btn btn--solid vdp-ask__call" href="tel:+19136625000">Call 913 662 5000 <span aria-hidden="true">&rarr;</span></a>
        <form class="vdp-form" data-apply method="post" novalidate>
          <div class="field"><label for="vq-name">Name <span class="field__req" aria-hidden="true">*</span></label>
            <input id="vq-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="vq-email">Email <span class="field__req" aria-hidden="true">*</span></label>
            <input id="vq-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="vq-phone">Phone</label>
            <input id="vq-phone" name="phone" type="tel" autocomplete="tel"></div>
          <div class="field"><label for="vq-msg">Message</label>
            <textarea id="vq-msg" name="message" rows="3">I would like to know more about stock %(stock)s.</textarea></div>
          <input type="hidden" name="vehicle" value="%(name)s, stock %(stock)s">
          <p class="vdp-form__note">Stock %(stock)s travels with the message.</p>
          <button class="btn vdp-form__send" type="submit">Send to Evan <span aria-hidden="true">&rarr;</span></button>
        </form>
      </aside>
    </div>
  </section>%(photos)s

  <!-- Three more from the floor, the inventory's own cards. -->
  <section class="sect sect--900 srp-page vdp-more" aria-labelledby="more-title">
    <div class="vdp-more__head">
      <div>
        <p class="tag"><span class="tag__dot" aria-hidden="true"></span>Inventory</p>
        <h2 class="sect__title" id="more-title">Also on the floor.</h2>
      </div>
      <a class="btn" href="inventory.html">All cars <span aria-hidden="true">&rarr;</span></a>
    </div>
    <ul class="results" data-no-reveal>
%(more)s
    </ul>
  </section>
</main>""" % dict(id=c['id'], sms=sms, itext=ICON_TEXT, ishare=ICON_SHARE, isave=ICON_SAVE, first=first_file,
                  firstalt=esc(name + ', ' + first_alt), fw=first_size[0], fh=first_size[1], nav=stage_nav, thumbs=thumbs,
                  status=status, name=esc(name), price=money(c['price']), stock=c['stock'], desc=esc(c['desc']),
                  spec=spec_rows, note=note, asktitle=ask_title, photos=photos_section, more=more)

    head = shell_head
    head = head.replace('<title>Inventory — Midwest Cobras</title>', '<title>%s — Midwest Cobras</title>' % esc(name))
    desc_meta = '%s, %s. %s. At Midwest Cobras in Basehor, Kansas.' % (name, money(c['price']), miles(c))
    head = re.sub(r'<meta name="description" content="[^"]*">',
                  '<meta name="description" content="%s">\n'
                  '<meta property="og:type" content="website">\n'
                  '<meta property="og:site_name" content="Midwest Cobras">\n'
                  '<meta property="og:title" content="%s — %s">\n'
                  '<meta property="og:description" content="%s">\n'
                  '<meta property="og:url" content="%s%s">\n'
                  '<meta property="og:image" content="%sassets/img/vdp/%s-og.jpg">\n'
                  '<meta property="og:image:width" content="1200">\n'
                  '<meta property="og:image:height" content="630">\n'
                  '<meta name="twitter:card" content="summary_large_image">'
                  % (esc(desc_meta), esc(name), money(c['price']), esc(desc_meta), SITE, page, SITE, c['id']), head, count=1)
    head = head.replace('<body class="page-inventory">', '<body class="page-vehicle">')
    head = head.replace('<a class="skip" href="#inventory">Skip to the cars</a>', '<a class="skip" href="#vehicle">Skip to the car</a>')
    head = head.replace('<link rel="stylesheet" href="assets/css/srp.css">',
                        '<link rel="stylesheet" href="assets/css/srp.css">\n<!-- The car\'s own page, over the search results\' layer. -->\n<link rel="stylesheet" href="assets/css/vdp.css">')
    c0 = head.index('<!-- INVENTORY HAS ITS OWN PAGE')
    c1 = head.index('-->', c0) + 3
    head = head[:c0] + '<!-- A CAR\'S OWN PAGE — generated from inventory.html\'s shell for %s. -->' % c['stock'] + head[c1:]

    d = dialog
    d = re.sub(r'(<img src=")[^"]*(" alt="" width=")\d+(" height=")\d+(" decoding="async" data-textcar-shot>)',
               lambda m: m.group(1) + first_file + m.group(2) + str(first_size[0]) + m.group(3) + str(first_size[1]) + m.group(4), d)
    d = re.sub(r'(data-textcar-name>)[^<]*(<)', lambda m: m.group(1) + esc(name) + m.group(2), d)
    d = re.sub(r'(data-textcar-price>)[^<]*(<)', lambda m: m.group(1) + money(c['price']) + m.group(2), d)
    d = re.sub(r'(data-textcar-miles>)[^<]*(<)', lambda m: m.group(1) + miles(c) + m.group(2), d)
    d = re.sub(r'(data-textcar-stock>)[^<]*(<)', lambda m: m.group(1) + c['stock'] + m.group(2), d)
    p = re.sub(r'(data-sharepop-name>)[^<]*(<)', lambda m: m.group(1) + esc(name) + m.group(2), popover)

    f = footer.replace('<script src="assets/js/srp.js" defer></script>', '<script src="assets/js/vdp.js" defer></script>')
    d = d.replace('srp.js', 'vdp.js')
    p = p.replace('srp.js', 'vdp.js')
    out = head + main + d + p + f
    assert out.count('<main') == 1 and 'src="assets/js/vdp.js"' in out and 'src="assets/js/srp.js"' not in out
    open(page, 'w').write(out)
    print(page, len(files), 'photos')

# ── the inventory and the home page point at the pages ─────────────────────
inv = open('inventory.html').read()
inv, n = re.subn(r'vehicle\.html\?car=(mc-[a-z0-9]+)', r'vehicle-\1.html', inv)
open('inventory.html', 'w').write(inv)
print('inventory links', n)
home = open('index12.html').read()
home, n2 = re.subn(r'inventory\.html#(mc-[a-z0-9]+)', r'vehicle-\1.html', home)
open('index12.html', 'w').write(home)
print('home links', n2)
