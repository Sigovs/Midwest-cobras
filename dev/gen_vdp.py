"""Generate one vehicle detail page per simulated car, from inventory.html's shell.

Photographs are copied from Alex's projects into assets/img/vdp/, resized, and a
1200x630 social image is cut from the first. Run from anywhere; re-runnable.

The page follows Alex's own Chicago Motor Cars VDP (AAN_PPREVIEW_CHICAGOMOTORCARS/
vdp.html) in order and in parts — the gallery beside the price and specification,
an action bar, the car's own panels (about, walkaround, ask, financing),
the standards every car here comes with, the gallery, related cars — and sets
each in this site's own grounds and components.
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
         desc='A Backdraft Racing RT4B Black Edition in red with black stripes, on the Black Out package: ceramic-coated black side pipes and roll bar, and 18-inch matte black wheels. 420 miles since it was built.',
         hl=['Black Out package: ceramic-coated black side pipes and roll bar', '18-inch matte black wheels',
             'Ford Coyote 5.0L V8 and a Tremec TKX five-speed', '420 miles since it was built']),
    dict(id='mc-1025', year=2024, make='Backdraft Racing', model='RT4 Classic Edition', price=74500, miles=180, stock='MC-1025',
         status='new', cond='New', cx=0.46,
         engine='Ford 427 stroker V8', trans='Tremec TKX five-speed manual', ext='Navy, white stripes', int_='Tan leather',
         photos=[(M + 'car-rt4b-front.jpg', 'three-quarter front'), (M + 'car-rt4-side.jpg', 'profile, driver\'s side'),
                 (M + 'shot-01.jpg', 'stripes and headlight'), (M + 'shot-03.jpg', 'profile from the front wheel')],
         desc='A Backdraft Racing RT4 Classic Edition in navy with white stripes, on polished stainless side pipes and halibrand-style wheels, over tan leather. 180 miles since it was built.',
         hl=['Polished stainless side pipes', 'Halibrand-style wheels',
             'Ford 427 stroker V8 and a Tremec TKX five-speed', '180 miles since it was built']),
    dict(id='mc-0981', year=2022, make='Backdraft Racing', model='RT4B Roadster', price=69900, miles=2140, stock='MC-0981',
         status='just', cond='Pre-owned', cx=0.5,
         engine='Ford 351W V8', trans='Tremec TKX five-speed manual', ext='Red, gunmetal centre stripe', int_='Black leather, red stitching',
         photos=[(H + 'vehicle-1.jpg', 'three-quarter front'), (H + 'vehicle-2.jpg', 'profile, driver\'s side'),
                 (H + 'vehicle-3.jpg', 'rear three-quarter'), (H + 'vehicle-4.jpg', 'cockpit, seats and shifter'),
                 (H + 'vehicle-5.jpg', 'door pocket and inner trim'), (H + 'vehicle-6.jpg', 'side profile with the aero screen')],
         desc='A 2022 RT4B Roadster in red with a gunmetal centre stripe, over black leather with red stitching and twin roll hoops. 2,140 miles.',
         hl=['Gunmetal centre stripe over red', 'Twin roll hoops', 'Black leather with red stitching', '2,140 miles']),
    dict(id='mc-0952', year=2021, make='Backdraft Racing', model='RT4 Roadster', price=64500, miles=3860, stock='MC-0952',
         status='', cond='Pre-owned', cx=0.5,
         engine='Ford Coyote 5.0L V8', trans='Tremec TKX five-speed manual', ext='Black, red pinstripe', int_='Black leather',
         photos=[(H + 'inventory-1.jpg', 'three-quarter front')],
         desc='A 2021 RT4 Roadster in black with a red pinstripe, over black leather. 3,860 miles.',
         hl=['Red pinstripe over black', 'Ford Coyote 5.0L V8', 'Black leather', '3,860 miles']),
    dict(id='mc-0934', year=2020, make='Backdraft Racing', model='RT4 Roadster', price=61900, miles=5210, stock='MC-0934',
         status='', cond='Pre-owned', cx=0.56,
         engine='Ford 427 stroker V8', trans='Tremec TKX five-speed manual', ext='Blue, white stripes', int_='Black leather',
         photos=[(H + 'hero-cobra.jpg', 'parked at night')],
         desc='A 2020 RT4 Roadster in blue with white stripes, over black leather. 5,210 miles.',
         hl=['White stripes over blue', 'Ford 427 stroker V8', 'Black leather', '5,210 miles']),
    dict(id='mc-0917', year=2019, make='Backdraft Racing', model='RT4 Roadster', price=58900, miles=6420, stock='MC-0917',
         status='sold', cond='Pre-owned', cx=0.76,
         engine='Ford 351W V8', trans='Tremec TKX five-speed manual', ext='Grey, white stripes', int_='Black leather',
         photos=[(H + 'build-base.jpg', 'profile')],
         desc='A 2019 RT4 Roadster in grey with white stripes. It has sold, and stays here as a record of what has passed through the shop.',
         hl=['White stripes over grey', 'Ford 351W V8', '6,420 miles when it sold']),
    dict(id='mc-c112', year=1965, make='Shelby', model='GT350', price=185000, miles=48200, stock='MC-C112',
         status='consign', cond='Consignment', cx=0.5,
         engine='289 cu in V8', trans='Four-speed manual', ext='White, blue side stripes', int_='Black vinyl',
         photos=[(BEN + '1965 Shelby GT350.JPG', 'profile, driver\'s side')],
         desc='A 1965 Shelby GT350 in white with blue side stripes, offered on consignment. 48,200 miles.',
         hl=['289 cu in V8 and a four-speed manual', 'White with blue side stripes', 'Offered on consignment for its owner']),
    dict(id='mc-c108', year=1967, make='Porsche', model='911S', price=159500, miles=71300, stock='MC-C108',
         status='consign', cond='Consignment', cx=0.52,
         engine='2.0L flat six', trans='Five-speed manual', ext='Slate blue', int_='Black leatherette',
         photos=[(BEN + '1967 Porsche 911S Large.jpeg', 'three-quarter front')],
         desc='A 1967 Porsche 911S in slate blue, offered on consignment. 71,300 miles.',
         hl=['2.0L flat six and a five-speed manual', 'Slate blue over black leatherette', 'Offered on consignment for its owner']),
    dict(id='mc-c104', year=1956, make='Chevrolet', model='Corvette', price=98500, miles=34900, stock='MC-C104',
         status='sold', cond='Consignment', cx=0.46,
         engine='265 cu in V8', trans='Three-speed manual', ext='Light blue, beige coves', int_='Beige vinyl',
         photos=[(GW + '16).JPG', 'three-quarter front'), (GW + '9).JPG', 'profile, driver\'s side'),
                 (GW + '13).JPG', 'rear three-quarter'), (GW + '14).JPG', 'tail'), (GW + '18).JPG', 'front three-quarter, passenger\'s side')],
         desc='A 1956 Chevrolet Corvette in light blue with beige coves. It sold on consignment, and stays here as a record of what has passed through the shop.',
         hl=['265 cu in V8', 'Light blue with beige coves', 'Sold on consignment']),
    dict(id='mc-c101', year=1959, make='Elva', model='Mk V', price=89000, miles=0, stock='MC-C101',
         status='consign', cond='Consignment', cx=0.5,
         engine='1.1L four', trans='Four-speed manual', ext='White, number 39', int_='Race seat',
         photos=[(BEN + 'Elva Racecar.JPG', 'three-quarter front')],
         desc='A 1959 Elva Mk V race car in white, number 39, offered on consignment.',
         hl=['1.1L four and a four-speed manual', 'White, number 39', 'A race car: no road mileage is recorded']),
]
LABEL = {'new': 'New', 'just': 'Just in', 'sold': 'Sold', 'consign': 'Consignment', '': 'Available'}

# The estimators' starting figures. SIMULATED, and the page says each is an
# estimate: a rate and a deposit a reader changes.
APR = 7.9
TERM = 60
DEPOSIT_SHARE = 0.2
TERMS = [36, 48, 60, 72, 84]



def money(n):
    return '${:,}'.format(n)


def miles(c):
    return 'Race car' if c['miles'] == 0 else '{:,} mi'.format(c['miles'])


def esc(s):
    return html.escape(s, quote=True)


def monthly(price, down, apr, n):
    p = max(0, price - down)
    r = apr / 100 / 12
    return round(p * r / (1 - (1 + r) ** -n) if r else p / n)


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
ICON_GRID = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'
PREV = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
NEXT = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW = '<span aria-hidden="true">&rarr;</span>'


# One glyph per panel, in the set the page already uses: 24-unit box, 1.6 stroke.
ACC_ICONS = {
    'about-car': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5.5M12 7.6v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    'walkaround': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 9.5v5l4-2.5-4-2.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    'ask': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    'finance': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><rect x="5" y="3.5" width="14" height="17" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 7.5h7M8.5 11.5h1.5M14 11.5h1.5M8.5 15.5h1.5M14 15.5h1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
}


def acc(pid, label, value, body, tool=None, opened=False):
    """One part of the car's record as a panel under the photograph and the
    details — Alex, 2026-09-14: "below the main section, an accordion at the
    bottom like Chicago Motor Cars". A native <details>, so it opens without
    script and find-in-page reaches the closed ones. Inside, what the part is
    on the left and the thing to use on the right."""
    va = ' data-rec-val' if pid == 'finance' else ''
    val = '<span class="acc__val"%s>%s</span>' % (va, value) if value else ''
    inner = body if tool is None else (
        '\n          <div class="rec__split">\n            <div class="rec__lead">%s\n            </div>\n'
        '            <div class="rec__tool">%s\n            </div>\n          </div>' % (body, tool))
    return f"""
      <details class="acc" id="{pid}"{' open' if opened else ''}>
        <summary class="acc__sum"><span class="acc__ico">{ACC_ICONS[pid]}</span><span class="acc__label">{label}</span>{val}<span class="acc__mark" aria-hidden="true"></span></summary>
        <div class="acc__body">{inner}
        </div>
      </details>"""


for c in CARS:
    name = '%d %s %s' % (c['year'], c['make'], c['model'])
    ename = esc(name)
    page = 'vehicle-%s.html' % c['id']
    files = c['files']
    first_file, first_size, first_alt = files[0]
    sms = 'sms:+19136625000?&amp;body=' + esc('Hi Evan, is the %s (stock %s) still available?' % (name, c['stock'])).replace(' ', '%20')
    status = LABEL[c['status']]
    stock = c['stock']
    price = money(c['price'])
    sold = c['status'] == 'sold'
    many = len(files) > 1

    # ── the gallery, beside the panel ──────────────────────────────────────
    stage_nav = ''
    thumbs = ''
    if many:
        stage_nav = f"""
            <button class="stage__nav stage__nav--prev" type="button" data-stage-prev aria-label="Previous photograph">{PREV}</button>
            <button class="stage__nav stage__nav--next" type="button" data-stage-next aria-label="Next photograph">{NEXT}</button>
            <a class="stage__all" href="#gallery">{ICON_GRID}Gallery <span data-stage-index>1 / {len(files)}</span></a>"""
        thumbs = '\n          <div class="thumbs" role="group" aria-label="Photographs of this car">\n' + '\n'.join(
            '            <button class="thumb" type="button" aria-current="%s" data-thumb data-src="%s" data-alt="%s">'
            '<img src="%s" alt="Photograph %d: %s" width="%d" height="%d" loading="lazy" decoding="async"></button>'
            % ('true' if n == 0 else 'false', f, esc(name + ', ' + alt), f, n + 1, esc(alt), s[0], s[1])
            for n, (f, s, alt) in enumerate(files)) + '\n          </div>'

    # Carfax under the photographs — Alex, 2026-09-16: "VDP page needs Carfax,
    # below main image, the size of the Enquire button". A live report link
    # carries the car's VIN; these simulated cars have none, so it opens
    # Carfax's own report page until a VIN is on record. Content ledger.
    carfax = """
        <a class="vdp-cfx" href="https://www.carfax.com/vehicle-history-reports/" target="_blank" rel="noopener noreferrer">
          <img src="assets/img/carfax.svg" width="253" height="60" alt="Show me the Carfax" decoding="async">
        </a>"""

    panel_rows = [('Mileage', miles(c)), ('Engine', c['engine']), ('Transmission', c['trans']),
                  ('Drivetrain', 'Rear-wheel drive'), ('Exterior', c['ext']), ('Interior', c['int_']), ('Stock', stock)]
    panel_specs = '\n'.join('            <div><dt>%s</dt><dd>%s</dd></div>' % (k, esc(v)) for k, v in panel_rows)
    cta = 'Ask for one like it' if sold else 'Enquire about this car'
    price_note = 'Sold. Kept here as a record.' if sold else 'Plus tax, title and delivery.'

    fin_btn = '' if sold else f"""
        <a class="btn btn--solid" href="finance.html">Start financing {ARROW}</a>"""

    # ── the record's panels ────────────────────────────────────────────────
    rows = [('Year', str(c['year'])), ('Make', c['make']), ('Model', c['model']), ('Engine', c['engine']),
            ('Transmission', c['trans']), ('Drivetrain', 'Rear-wheel drive'), ('Exterior', c['ext']),
            ('Interior', c['int_']), ('Mileage', miles(c)), ('Stock', stock), ('Condition', c['cond']), ('Status', status)]
    spec_rows = '\n'.join('              <div><dt>%s</dt><dd>%s</dd></div>' % (k, esc(v)) for k, v in rows)
    highlights = '\n'.join('                <li>%s</li>' % esc(h) for h in c['hl'])
    fine = ('It has sold. It stays on the site as a record of what has passed through the shop, and Evan can look for another like it.'
            if sold else
            'The price leaves out tax, title, registration and delivery. Mileage is as listed, and can change with test drives and transport. If anything on this page is wrong, tell us and it is corrected.')

    about = f"""
          <div class="about">
            <div class="about__text">
              <p class="about__lead">{esc(c['ext'])} over {esc(c['int_'].lower())}</p>
              <p>{esc(c['desc'])}</p>
              <h3 class="about__h">Highlights</h3>
              <ul class="about__list">
{highlights}
              </ul>
              <p class="about__fine">{fine}</p>
            </div>
            <dl class="spec vdp-spec" aria-label="Specification">
{spec_rows}
            </dl>
          </div>"""

    poster = files[1] if many else files[0]
    walk_msg = esc('Could you film a walkaround of stock %s and send it to me?' % stock)
    walk = f"""
          <div class="walk">
            <img class="walk__poster" src="{poster[0]}" alt="" width="{poster[1][0]}" height="{poster[1][1]}" loading="lazy" decoding="async">
            <div class="walk__text">
              <p>There is no walkaround of {stock} filmed yet. Ask, and Evan will film the car
                on the floor and send it to you.</p>
              <a class="btn" href="#ask" data-ask-msg="{walk_msg}">Ask for a walkaround {ARROW}</a>
            </div>
          </div>"""

    ask_msg = esc('I would like one like the %s. Can you find one?' % name) if sold else esc('I would like to know more about stock %s.' % stock)
    ask = f"""
          <form class="ask" data-ask method="post" novalidate>
            <input type="hidden" name="vehicle" value="{ename}, stock {stock}">
            <div class="ask__grid">
              <div class="field"><label for="a-first">First name <span class="field__req" aria-hidden="true">*</span></label>
                <input id="a-first" name="first_name" autocomplete="given-name" required></div>
              <div class="field"><label for="a-last">Last name</label>
                <input id="a-last" name="last_name" autocomplete="family-name"></div>
              <div class="field"><label for="a-email">Email <span class="field__req" aria-hidden="true">*</span></label>
                <input id="a-email" name="email" type="email" autocomplete="email" required></div>
              <div class="field"><label for="a-phone">Phone</label>
                <input id="a-phone" name="phone" type="tel" autocomplete="tel"></div>
            </div>
            <fieldset class="ask__when">
              <legend>Best time to reach you</legend>
              <label class="ask__opt"><input type="radio" name="best_time" value="morning" checked> Morning</label>
              <label class="ask__opt"><input type="radio" name="best_time" value="afternoon"> Afternoon</label>
              <label class="ask__opt"><input type="radio" name="best_time" value="evening"> Evening</label>
            </fieldset>
            <div class="field"><label for="a-msg">Message</label>
              <textarea id="a-msg" name="message" rows="4">{ask_msg}</textarea></div>
            <div class="ask__send">
              <button class="btn btn--solid" type="submit">Send to Evan {ARROW}</button>            </div>
            <p class="ask__status" data-ask-status role="status" hidden></p>
          </form>"""

    ask_lead = f"""
              <p class="rec__text">The message goes to Evan with stock <span class="nobr">{stock}</span> attached, so there is no need to say which car.</p>
              <a class="rec__call" href="tel:+19136625000"><span class="rec__k">Or call</span>913 662 5000</a>"""
    panels = acc('about-car', 'About this car', '', about, opened=True)
    panels += acc('walkaround', 'Walkaround video', 'Not filmed yet', walk)
    panels += acc('ask', 'Ask about this car', 'Evan &middot; 913 662 5000', ask_lead, ask)

    if not sold:
        down = int(round(c['price'] * DEPOSIT_SHARE, -3))
        mo = monthly(c['price'], down, APR, TERM)
        term_opts = ''.join('<option value="%d"%s>%d months</option>' % (t, ' selected' if t == TERM else '', t) for t in TERMS)
        fin_lead = f"""
              <p class="rec__text">Midwest Cobras works with lending partners on the cars it sells. The figure
                is arithmetic on the numbers you set; the rate you are actually given depends on the lender and on you.</p>
              <a class="btn" href="finance.html">Apply for financing {ARROW}</a>"""
        finance = f"""
          <form class="calc" data-calc>
            <div class="calc__grid">
              <div class="field"><label for="c-price">Price</label>
                <input id="c-price" inputmode="numeric" value="{c['price']:,}" data-calc-price></div>
              <div class="field"><label for="c-down">Deposit</label>
                <input id="c-down" inputmode="numeric" value="{down:,}" data-calc-down></div>
              <div class="field"><label for="c-term">Term</label>
                <select id="c-term" data-calc-term>{term_opts}</select></div>
              <div class="field"><label for="c-apr">Rate, APR %</label>
                <input id="c-apr" inputmode="decimal" value="{APR}" data-calc-apr></div>
            </div>
            <p class="calc__out"><span class="calc__k">Estimated monthly</span>
              <output class="calc__figure" for="c-price c-down c-term c-apr" data-calc-out>${mo:,} / mo</output></p>
            <p class="rec__note">An estimate, nothing more: not an offer and not a quote, and it leaves out tax,
              title and registration.</p>
          </form>"""
        panels += acc('finance', 'Financing &amp; payments', 'Est. ${:,} / mo'.format(mo), fin_lead, finance)
        # No shipping panel — Alex, 2026-09-14: "remove it altogether, they
        # have no shipping". Transport is arranged by phone, as on the home page.

    # ── standards: the same on every car ───────────────────────────────────
    standards = f"""

  <!-- STANDARDS. What comes with buying any car here, so it is its own section
       after the car's record rather than a part of it — as on the Chicago Motor
       Cars VDP. Every line is the home page's own services copy. -->
  <section class="sect sect--900 stds" aria-labelledby="stds-title">
    <header class="stds__head">
      <p class="tag"><span class="tag__dot" aria-hidden="true"></span>Buying from Midwest Cobras</p>
      <h2 class="sect__title" id="stds-title">What comes with the car.</h2>
    </header>
    <ul class="stds__grid">
      <li class="stds__item"><h3 class="stds__k">Service in house</h3>
        <p class="stds__v">Setup, carburetion, cooling, brakes and the annual going-over, done by the people who build the cars.</p></li>
      <li class="stds__item"><h3 class="stds__k">Enclosed transport</h3>
        <p class="stds__v">To your door, to an event, or back to the shop. Never an open trailer.</p></li>
      <li class="stds__item"><h3 class="stds__k">Financing</h3>
        <p class="stds__v">Apply on the site and the application goes straight to Evan. <a class="stds__link" href="finance.html">Apply {ARROW}</a></p></li>
      <li class="stds__item"><h3 class="stds__k">Forty years</h3>
        <p class="stds__v">Forty years of experience with these cars, from the shop at 14510 Parallel Lane, Basehor.</p></li>
    </ul>
  </section>"""

    gallery = ''
    if many:
        gallery = f"""

  <!-- GALLERY. Every photograph of the car, on the dark. Each opens at the top. -->
  <section class="sect sect--950 gallery" id="gallery" aria-labelledby="gallery-title">
    <header class="gallery__head">
      <p class="tag"><span class="tag__dot" aria-hidden="true"></span>{stock} &middot; {len(files)} photographs</p>
      <h2 class="sect__title" id="gallery-title">Gallery.</h2>
    </header>
    <div class="gallery__grid">
""" + '\n'.join(
            '      <button class="gallery__item" type="button" data-photo="%d" aria-label="Show photograph %d, %s, at the top">'
            '<img src="%s" alt="" width="%d" height="%d" loading="lazy" decoding="async"></button>'
            % (n, n + 1, esc(alt), f, s[0], s[1]) for n, (f, s, alt) in enumerate(files)) + """
    </div>
  </section>"""

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

    main = f"""<main id="top">

  <!-- ══════════════════════════════════════════════════════════════════════
       A CAR'S OWN PAGE. The order is Alex's own Chicago Motor Cars VDP —
       Alex, 2026-09-14: "VDP, where is the rest? description, finance,
       shipping… and PHOTOS should be called Gallery". The gallery beside the
       price and the specification; an action bar; the car's record in panels
       (about, walkaround, ask, financing); the standards every car
       here comes with; the gallery; related cars. The parts are that page's,
       the grounds are this site's: the car on the dark, its record on bone.

       Generated per car (so a shared link previews this car), and SIMULATED
       like the inventory: real photographs from Alex's other projects, every
       figure made up. Content ledger, "vehicle-*.html".
     ══════════════════════════════════════════════════════════════════════ -->
  <section class="sect sect--950 srp-page vdp-page" id="vehicle" aria-labelledby="vdp-title" data-vdp="{c['id']}">
    <div class="vdp-top">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="index12.html">Home</a><span class="crumbs__sep" aria-hidden="true">/</span><a href="inventory.html">Inventory</a><span class="crumbs__sep" aria-hidden="true">/</span><span aria-current="page">{ename}</span>
      </nav>
      <div class="vdp-top__acts">
        <a class="car__act" data-enquiry-open aria-haspopup="dialog" href="{sms}">{ICON_TEXT}Text</a>
        <button class="car__act" type="button" data-share aria-haspopup="true" aria-expanded="false" aria-controls="share-pop">{ICON_SHARE}<span data-share-label>Share</span></button>
        <button class="car__act vdp-save" type="button" aria-pressed="false" data-save>{ICON_SAVE}<span data-save-label>Save</span></button>
      </div>
    </div>

    <div class="vdp-sum">
      <div class="stage" data-stage tabindex="-1">
        <div class="stage__frame">
          <img src="{first_file}" alt="{esc(name + ', ' + first_alt)}" width="{first_size[0]}" height="{first_size[1]}" data-stage-img fetchpriority="high">{stage_nav}
        </div>{thumbs}{carfax}
      </div>

      <div class="vdp-panel">
        <p class="vdp-panel__k">Stock {stock} <span aria-hidden="true">&middot;</span> {status}</p>
        <h1 class="vdp-panel__title" id="vdp-title" data-vdp-name>{ename}</h1>
        <div class="vdp-panel__price">
          <p class="vdp-panel__figure">{price}</p>
          <p class="vdp-panel__note">{price_note}</p>
        </div>
        <dl class="spec vdp-panel__specs">
{panel_specs}
        </dl>
        <a class="btn btn--solid vdp-panel__cta" href="#ask" data-ask-msg="{ask_msg}">{cta} {ARROW}</a>
      </div>
    </div>

    <div class="vdp-act">
      <div class="vdp-act__contact">
        <a class="btn" href="tel:+19136625000">Call 913 662 5000</a>
        <a class="btn" href="{sms}">Text Evan</a>{fin_btn}
      </div>
    </div>
  </section>

  <!-- THE RECORD, on bone: the car's own panels under the photograph and the
       details, as accordions, as on the Chicago Motor Cars VDP. About is open. -->
  <section class="sect sect--bone vdp-record" id="record" data-ground="light" aria-labelledby="record-title">
    <header class="vdp-record__head">
      <p class="tag"><span class="tag__dot" aria-hidden="true"></span>The record</p>
      <h2 class="vdp-record__title" id="record-title">{stock}, in full.</h2>
    </header>
    <div class="accs">{panels}
    </div>
  </section>{standards}{gallery}

  <!-- Related cars, the inventory's own cards. -->
  <section class="sect sect--900 srp-page vdp-more" aria-labelledby="more-title">
    <div class="vdp-more__head">
      <div>
        <p class="tag"><span class="tag__dot" aria-hidden="true"></span>Inventory</p>
        <h2 class="sect__title" id="more-title">Also on the floor.</h2>
      </div>
      <a class="btn" href="inventory.html">All cars {ARROW}</a>
    </div>
    <ul class="results" data-no-reveal>
{more}
    </ul>
  </section>
</main>"""

    head = shell_head
    head = head.replace('<title>Inventory — Midwest Cobras</title>', '<title>%s — Midwest Cobras</title>' % ename)
    desc_meta = '%s, %s. %s. At Midwest Cobras in Basehor, Kansas.' % (name, price, miles(c))
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
                  % (esc(desc_meta), ename, price, esc(desc_meta), SITE, page, SITE, c['id']), head, count=1)
    head = head.replace('<body class="page-inventory">', '<body class="page-vehicle">')
    head = head.replace('<a class="skip" href="#inventory">Skip to the cars</a>', '<a class="skip" href="#vehicle">Skip to the car</a>')
    head = head.replace('<link rel="stylesheet" href="assets/css/srp.css">',
                        '<link rel="stylesheet" href="assets/css/srp.css">\n<!-- The car\'s own page, over the search results\' layer. -->\n<link rel="stylesheet" href="assets/css/vdp.css">')
    c0 = head.index('<!-- INVENTORY HAS ITS OWN PAGE')
    c1 = head.index('-->', c0) + 3
    head = head[:c0] + '<!-- A CAR\'S OWN PAGE — generated from inventory.html\'s shell for %s. -->' % stock + head[c1:]

    d = dialog
    d = re.sub(r'(<img src=")[^"]*(" alt="" width=")\d+(" height=")\d+(" decoding="async" data-textcar-shot>)',
               lambda m: m.group(1) + first_file + m.group(2) + str(first_size[0]) + m.group(3) + str(first_size[1]) + m.group(4), d)
    d = re.sub(r'(data-textcar-name>)[^<]*(<)', lambda m: m.group(1) + ename + m.group(2), d)
    d = re.sub(r'(data-textcar-price>)[^<]*(<)', lambda m: m.group(1) + price + m.group(2), d)
    d = re.sub(r'(data-textcar-miles>)[^<]*(<)', lambda m: m.group(1) + miles(c) + m.group(2), d)
    d = re.sub(r'(data-textcar-stock>)[^<]*(<)', lambda m: m.group(1) + stock + m.group(2), d)
    p = re.sub(r'(data-sharepop-name>)[^<]*(<)', lambda m: m.group(1) + ename + m.group(2), popover)

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
