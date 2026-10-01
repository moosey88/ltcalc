"""Reads the household Finances.xlsx (monthly tabs) and writes app/data/history.js.
Usage: python3 tools/extract_history.py <Finances.xlsx> [first_year]
The output holds personal financial data: it is git-ignored and must never be committed."""
import sys, re, json, datetime as dt
import openpyxl

SRC = sys.argv[1]
FIRST_YEAR = int(sys.argv[2]) if len(sys.argv) > 2 else 2023
MON = {'jan':1,'feb':2,'mar':3,'apr':4,'may':5,'jun':6,'jul':7,'aug':8,'sep':9,'oct':10,'nov':11,'dec':12}

def sheet_month(name):
    n = name.strip().lower()
    m = re.match(r'^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{2})$', n)
    if not m: return None
    return (2000 + int(m.group(2)), MON[m.group(1)])

def num(v):
    if isinstance(v, bool): return None
    if isinstance(v, (int, float)): return float(v)
    return None

def txt(v):
    return str(v).strip() if isinstance(v, str) and v.strip() else None

def grid(ws, maxr=90, maxc=45):
    g = {}
    for r in ws.iter_rows(min_row=1, max_row=maxr, max_col=maxc):
        for c in r:
            if c.value not in (None, ''):
                g[(c.row, c.column)] = c.value
    return g

def find(g, pred):
    out = []
    for (r, c), v in g.items():
        if isinstance(v, str) and pred(v.strip().lower()):
            out.append((r, c))
    return sorted(out)

def parse(ws):
    g = grid(ws)
    res = {}
    # savings balance and starting balance
    for key, label in (('savings', 'savings balance'), ('startBal', 'starting balance')):
        f = find(g, lambda s, l=label: s.startswith(l))
        if f:
            r, c = f[0]; res[key] = num(g.get((r, c + 1)))
    # incoming
    f = find(g, lambda s: s == 'incoming')
    inc = []
    if f:
        r0, c0 = f[0]
        r = r0 + 1
        while r < r0 + 30:
            n = txt(g.get((r, c0)))
            if n is None and (r, c0) not in g: 
                if r > r0 + 12: break
                r += 1; continue
            if n and n.lower().startswith('total'):
                res['inTotal'] = (num(g.get((r, c0 + 1))), num(g.get((r, c0 + 2)))); break
            if n:
                inc.append({'n': n, 'f': num(g.get((r, c0 + 1))), 'a': num(g.get((r, c0 + 2)))})
            r += 1
    res['incoming'] = inc
    # fixed bills
    f = find(g, lambda s: s.startswith('out (standard'))
    fixed = []
    if f:
        r0, c0 = f[0]
        # header row is r0+1 (Forecast/Actual/Variance); items follow
        r = r0 + 2 if txt(g.get((r0 + 1, c0 + 1))) is None and txt(g.get((r0 + 1, c0))) is None else r0 + 1
        r = r0 + 1
        while r < r0 + 45:
            n = txt(g.get((r, c0)))
            if n and n.lower().startswith('total'):
                res['outTotal'] = (num(g.get((r, c0 + 1))), num(g.get((r, c0 + 2)))); break
            if n and num(g.get((r, c0 + 1))) is not None or (n and num(g.get((r, c0 + 2))) is not None):
                fixed.append({'n': n, 'f': num(g.get((r, c0 + 1))), 'a': num(g.get((r, c0 + 2))), 'note': txt(g.get((r, c0 + 4)))})
            r += 1
    res['fixed'] = fixed
    # variable categories
    f = find(g, lambda s: s.startswith('additional outgoings'))
    var = []
    if f:
        r0, c0 = f[0]
        r = r0 + 1
        while r < r0 + 30:
            n = txt(g.get((r, c0)))
            if n and n.lower().startswith('total spend'):
                res['varTotal'] = (num(g.get((r, c0 + 1))), num(g.get((r, c0 + 2)))); r += 1; continue
            if n and n.lower().startswith('cash left'):
                res['cashLeft'] = (num(g.get((r, c0 + 1))), num(g.get((r, c0 + 2)))); break
            if n and (num(g.get((r, c0 + 1))) is not None or num(g.get((r, c0 + 2))) is not None):
                var.append({'n': n, 'f': num(g.get((r, c0 + 1))), 'a': num(g.get((r, c0 + 2)))})
            r += 1
        res['varCol'] = c0
    res['vars'] = var
    # itemised lines: category headers sit in the first 3 rows, to the right of the variable block
    lines = []
    cmin = (res.get('varCol') or 11) + 4
    headers = []
    for r in (1, 2, 3):
        for (rr, cc), v in g.items():
            if rr == r and cc >= cmin and isinstance(v, str) and v.strip() and not v.strip().startswith('='):
                headers.append((rr, cc, v.strip()))
    seen = set()
    for r, c, h in headers:
        if (c) in seen: continue
        seen.add(c)
        vals = []
        for rr in range(r + 1, 85):
            a = num(g.get((rr, c)))
            if a is None: continue
            vals.append((rr, a, txt(g.get((rr, c + 1)))))
        if len(vals) >= 2:
            s = sum(a for _, a, _ in vals[:-1])
            if abs(s - vals[-1][1]) < 0.02: vals = vals[:-1]
        for rr, a, note in vals:
            lines.append({'c': h, 'a': a, 'n': note})
    res['lines'] = lines
    return res

wb = openpyxl.load_workbook(SRC, data_only=True, read_only=False)
months = {}
for ws in wb.worksheets:
    ym = sheet_month(ws.title)
    if not ym or ym[0] < FIRST_YEAR: continue
    if ym[0] > 2026 or (ym[0] == 2026 and ym[1] > 9): continue
    try:
        p = parse(ws)
    except Exception as e:
        print('ERR', ws.title, e); continue
    k = '%04d-%02d' % ym
    p['sheet'] = ws.title
    months[k] = p
out = {'months': dict(sorted(months.items())), 'built': dt.date.today().isoformat()}
with open('app/data/history.js', 'w') as f:
    f.write('window.HISTORY = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print('months:', len(months), 'first', min(months), 'last', max(months))
