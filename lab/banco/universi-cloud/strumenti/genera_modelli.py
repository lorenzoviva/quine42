# The MarkovJunior programs of orichalcum's models, written by hand and assembled here.
# Every model is a fixed body (solid shapes) and some groups of variants. Each variant is drawn in a hidden letter of its own; for every group a
# `one` turns one voxel of one variant (a variant with more voxels is a little likelier) into its chosen letter, an `all` floods the chosen letter
# through the voxels of that variant only, the chosen letters take their colours and what was not chosen goes back to air. The program itself
# draws a different thing on every seed: that is the variance (lab/banco/universi-cloud/strumenti/modelli.ts measures it).
#   python3 lab/banco/universi-cloud/strumenti/genera_modelli.py
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'orichalcum', 'models')
POOL = '0123456789abcdefghijklmnopqrstuvwxyz'


def model(mid, name, size, colors, body, groups, after='', note='', root_sym='(xy)'):
    """colors: [(letter, hex, name, extra attrs)]; body: xml lines; groups: [[variant]], a variant a list of parts (colour, [shapes with {L}]),
    a single part, or None (nothing). Each group draws its shapes just before its choice, so a later group leans on what the earlier ones left;
    the choice is uniform: one marker voxel per variant (and one, out of sight in a corner of the box, for «nothing»)."""
    used = set('B' + ''.join(c[0] for c in colors))
    pool = [c for c in POOL + 'ACDEFGHIJKLMNOPQRSTUVWXYZ' if c not in used]
    letters = []
    out = []
    X, Y, Z = (int(v) for v in size.split())
    for g in groups:
        draw, marks, fill, colour_rules, clear = [], [], [], [], []
        choose = []
        for variant in g:
            mk = pool.pop(0)
            letters.append(mk)
            if variant is None:
                # «nothing»: a marker in a corner of the box at the top, where no model reaches; it goes back to air.
                draw.append(f'<box at="0 0 {Z - 1}" size="1 1 1" color="{mk}" on="B"/>')
                choose.append(f'<rule in="{mk}" out="B"/>')
                clear.append(f'<rule in="{mk}" out="B"/>')
                continue
            parts = variant if isinstance(variant, list) else [variant]
            hs, cs = [], []
            for colour, shapes in parts:
                h, c = pool.pop(0), pool.pop(0)
                hs.append(h); cs.append(c); letters += [h, c]
                draw += [s.replace('{L}', h) for s in shapes]
                colour_rules.append(f'<rule in="{c}" out="{colour}"/>')
                clear.append(f'<rule in="{h}" out="B"/>')
            marks.append(f'<one steps="1"><rule in="{hs[0]}" out="{mk}"/></one>')
            choose.append(f'<rule in="{mk}" out="{cs[0]}"/>')
            clear.append(f'<rule in="{mk}" out="B"/>')
            for c in cs:
                for h, c2 in zip(hs, cs):
                    fill += [f'<rule in="{c}{h}" out="{c}{c2}"/>', f'<rule in="{c} {h}" out="{c} {c2}"/>', f'<rule in="{h} {c}" out="{c2} {c}"/>']
        out += ['  ' + s for s in draw] + ['  ' + s for s in marks]
        out.append('  <one steps="1">' + ''.join(choose) + '</one>')
        if fill:
            out.append('  <all>' + ''.join(fill) + '</all>')
        out.append('  <all>' + ''.join(colour_rules + clear) + '</all>')
    values = 'B' + ''.join(c[0] for c in colors) + ''.join(letters)
    assert len(set(values)) == len(values), mid
    xml = [f'<!-- {note or name}: scritto a mano per orichalcum (Cantiere 4A), corpo fisso e varianti scelte a ogni seme. -->',
           f'<sequence values="{values}" size="{size}" symmetry="{root_sym}" name="{name}">']
    for c in colors:
        extra = ''.join(f' {k}="{v}"' for k, v in (c[3] if len(c) > 3 else {}).items())
        xml.append(f'  <color symbol="{c[0]}" value="{c[1]}" name="{c[2]}"{extra}/>')
    for h in letters:
        xml.append(f'  <color symbol="{h}" value="ff00ff" name="variante" hidden="True"/>')
    xml += ['  ' + s for s in body]
    xml += out
    if after:
        xml += ['  ' + s for s in after.strip().split('\n')]
    xml.append('</sequence>')
    with open(os.path.join(OUT, mid + '.xml'), 'w') as f:
        f.write('\n'.join(xml) + '\n')


def box(x, y, z, w, d, h, c='{L}', on='B'):
    return f'<box at="{x} {y} {z}" size="{w} {d} {h}" color="{c}"' + (f' on="{on}"' if on else '') + '/>'


def cyl(x, y, z, w, d, h, c='{L}', on='B'):
    return f'<cylinder at="{x} {y} {z}" size="{w} {d} {h}" color="{c}"' + (f' on="{on}"' if on else '') + '/>'


def ell(x, y, z, w, d, h, c='{L}', on='B'):
    return f'<ellipsoid at="{x} {y} {z}" size="{w} {d} {h}" color="{c}"' + (f' on="{on}"' if on else '') + '/>'


def cone(x, y, z, w, d, h, c='{L}', on='B'):
    return f'<cone at="{x} {y} {z}" size="{w} {d} {h}" color="{c}"' + (f' on="{on}"' if on else '') + '/>'


def line(a, b, r, c='{L}', on='B'):
    return f'<line at="{a[0]} {a[1]} {a[2]}" to="{b[0]} {b[1]} {b[2]}" r="{r}" color="{c}"' + (f' on="{on}"' if on else '') + '/>'


GLOW = {'glow': 'True'}
P = lambda colour, *shapes: (colour, list(shapes))


def carve(shape, *a, on):
    return shape(*a, c='B', on=on)


# 1. Caldaia a vapore (edificio, 50×50×50): ghisa panciuta e cava, fasce d'ottone, portello rovente; comignolo, serbatoio e ciò che ha davanti cambiano.
model('caldaia-vapore', 'Caldaia a vapore', '50 50 50',
      [('G', '4a4e56', 'ghisa'), ('O', 'c8a04a', 'fasce d\'ottone'), ('F', 'ff7a2a', 'fuoco del portello', GLOW), ('N', '2a2c30', 'ferro nero'), ('R', 'b0603a', 'rame'), ('W', 'e8e4dc', 'vapore')],
      [cyl(25, 25, 0, 28, 28, 4, 'N', None), carve(cyl, 25, 25, 1, 24, 24, 3, on='N'), cyl(25, 25, 4, 24, 24, 24, 'G', None), carve(cyl, 25, 25, 5, 20, 20, 23, on='G'),
       ell(25, 25, 26, 24, 24, 12, 'G'), carve(ell, 25, 25, 27, 20, 20, 9, on='G'), cyl(25, 25, 10, 26, 26, 2, 'O'), cyl(25, 25, 20, 26, 26, 2, 'O'), box(25, 37, 6, 10, 1, 8, 'F', None)],
      [[P('N', cyl(25, 25, 36, 6, 6, 14)), P('N', cyl(18, 25, 33, 5, 5, 14), cyl(32, 25, 33, 5, 5, 14)), P('R', cyl(25, 32, 31, 8, 8, 12))],
       [[P('R', cyl(43, 25, 0, 10, 10, 24)), P('O', line((37, 25, 20), (40, 25, 20), 2))], [P('R', cyl(7, 25, 0, 10, 10, 24)), P('O', line((13, 25, 20), (10, 25, 20), 2))], P('G', box(25, 7, 0, 22, 10, 20))],
       [P('N', ell(13, 43, 0, 12, 8, 8)), [P('O', line((36, 33, 14), (43, 44, 3), 2)), P('R', box(43, 44, 0, 5, 5, 3))], P('W', ell(25, 25, 38, 18, 18, 10))]],
      note='Caldaia a vapore')

# 2. Valvola con manometro (mobile): il tubo dal suolo, il volantino rosso; il manometro e i tubi cambiano posto.
model('valvola-manometro', 'Valvola con manometro', '20 20 20',
      [('R', 'b0603a', 'tubo di rame'), ('V', 'c0302a', 'volantino rosso'), ('O', 'c8a04a', 'ottone'), ('Q', 'f0ece0', 'quadrante'), ('N', '2a2c30', 'base')],
      [box(10, 10, 0, 8, 8, 2, 'N', None), cyl(10, 10, 2, 4, 4, 12, 'R'), cyl(10, 10, 13, 10, 10, 1, 'V'), carve(cyl, 10, 10, 13, 6, 6, 1, on='V'), box(10, 10, 13, 10, 2, 1, 'V'), box(10, 10, 13, 2, 10, 1, 'V')],
      [[[P('O', cyl(10, 10, 14, 6, 6, 4)), P('Q', box(10, 14, 15, 2, 1, 2))], [P('O', cyl(4, 10, 5, 5, 5, 5), box(7, 10, 6, 4, 2, 2)), P('Q', box(4, 13, 7, 2, 1, 2))], [P('O', cyl(16, 10, 5, 5, 5, 5), box(13, 10, 6, 4, 2, 2)), P('Q', box(16, 13, 7, 2, 1, 2))]],
       [P('R', line((10, 10, 4), (10, 2, 4), 1), box(10, 2, 0, 3, 3, 5)), P('R', line((10, 10, 4), (10, 18, 4), 1), box(10, 18, 0, 3, 3, 5))]],
      note='Valvola con manometro')

# 3. Banco dell'orologiaio (mobile): il piano di noce sulle gambe; cassettiera, lampada e cose sul piano cambiano.
model('banco-orologiaio', "Banco dell'orologiaio", '20 20 20',
      [('W', '6a4024', 'noce'), ('D', '3e2414', 'cassettini'), ('O', 'c8a04a', 'ottone'), ('L', 'ffe08a', 'lampada', GLOW), ('Q', 'f0ece0', 'quadranti'), ('S', '8a8e96', 'attrezzi')],
      [box(10, 10, 9, 20, 12, 2, 'W', None), box(2, 5, 0, 2, 2, 9, 'W', None), box(18, 5, 0, 2, 2, 9, 'W', None), box(2, 15, 0, 2, 2, 9, 'W', None), box(18, 15, 0, 2, 2, 9, 'W', None)],
      [[[P('W', box(6, 10, 0, 7, 9, 9)), P('D', box(6, 15, 2, 5, 1, 5))], [P('W', box(14, 10, 0, 7, 9, 9)), P('D', box(14, 15, 2, 5, 1, 5))], [P('W', box(10, 10, 5, 16, 9, 4)), P('D', box(10, 15, 6, 12, 1, 2))]],
       [[P('O', line((2, 6, 11), (2, 6, 18), 1), line((2, 6, 18), (7, 9, 18), 1)), P('L', box(7, 9, 15, 3, 3, 2))], [P('O', line((18, 6, 11), (18, 6, 18), 1), line((18, 6, 18), (13, 9, 18), 1)), P('L', box(13, 9, 15, 3, 3, 2))]],
       [[P('Q', cyl(7, 11, 11, 5, 5, 1), cyl(13, 12, 11, 4, 4, 1)), P('S', box(10, 7, 11, 6, 2, 3))], [P('S', box(10, 6, 11, 14, 3, 6)), P('O', box(10, 6, 17, 10, 3, 1))], [P('O', cyl(10, 11, 11, 7, 7, 4), cyl(10, 11, 15, 3, 3, 3))]]],
      note="Banco dell'orologiaio")

# 4. Fucina d'oricalco (edificio): forno di mattoni cavo, bocca rovente, canale di colata; mantice, comignolo e crogiolo cambiano.
model('fucina-oricalco', "Fucina d'oricalco", '50 50 50',
      [('M', '8a4a34', 'mattoni refrattari'), ('m', '5e3022', 'giunti scuri'), ('F', 'ffb040', 'bocca rovente', GLOW), ('C', 'e08a3a', 'oricalco fuso', GLOW), ('N', '2a2c30', 'ferro nero'), ('L', '7a5a3a', 'cuoio del mantice')],
      [box(25, 24, 0, 30, 26, 20, 'M', None), carve(box, 25, 24, 1, 26, 22, 18, on='M'), box(25, 24, 20, 26, 22, 4, 'M', None), carve(box, 25, 24, 20, 22, 18, 3, on='M'),
       box(25, 37, 4, 12, 1, 10, 'F', None), box(25, 38, 3, 14, 1, 1, 'm'), box(25, 38, 14, 14, 1, 1, 'm'), box(25, 43, 0, 6, 12, 3, 'N'), box(25, 43, 2, 4, 10, 1, 'C', 'N')],
      [[P('L', box(5, 24, 0, 9, 12, 12), line((9, 24, 8), (10, 24, 8), 2)), P('L', box(45, 24, 0, 9, 12, 12), line((41, 24, 8), (40, 24, 8), 2))],
       [P('M', box(25, 18, 24, 8, 8, 20)), P('N', cyl(15, 20, 24, 6, 6, 22), cyl(35, 20, 24, 6, 6, 16)), P('M', box(25, 24, 24, 18, 14, 6), box(25, 24, 30, 6, 6, 14))],
       [[P('N', cyl(38, 41, 0, 8, 8, 8)), P('C', cyl(38, 41, 8, 6, 6, 1))], [P('N', cyl(12, 41, 0, 8, 8, 8)), P('C', cyl(12, 41, 8, 6, 6, 1))]]],
      note="Fucina d'oricalco")

# 5. Carrello del minerale (mobile): cassone di ferro cavo su ruote; carico, leva e respingente cambiano.
model('carrello-minerario', 'Carrello del minerale', '20 20 20',
      [('I', '5a5e66', 'ferro del cassone'), ('N', '2a2c30', 'ruote'), ('R', 'a8442a', 'minerale rosso'), ('r', 'd0703a', 'vene lucenti'), ('W', '6a4024', 'leva di legno')],
      [cyl(4, 5, 0, 4, 4, 4, 'N', None), cyl(16, 5, 0, 4, 4, 4, 'N', None), cyl(4, 15, 0, 4, 4, 4, 'N', None), cyl(16, 15, 0, 4, 4, 4, 'N', None),
       box(10, 10, 3, 18, 16, 8, 'I', None), carve(box, 10, 10, 5, 14, 12, 6, on='I')],
      [[P('R', ell(10, 10, 6, 14, 12, 10)), P('R', ell(6, 10, 6, 8, 12, 11), ell(14, 10, 6, 6, 10, 7)), P('R', ell(10, 10, 5, 12, 10, 4))],
       [P('W', line((19, 10, 6), (19, 10, 18), 1)), P('W', line((1, 10, 6), (1, 10, 18), 1))],
       [P('N', box(10, 19, 5, 8, 1, 3)), P('N', box(10, 1, 5, 8, 1, 3))]],
      after='<prl steps="1"><rule in="R" out="r" p="0.12"/></prl>',
      note='Carrello del minerale')

# 6. Telegrafo pneumatico (monumento): colonnina d'ottone cava con lo sportello; cappello, tubo e leva cambiano.
model('telegrafo-pneumatico', 'Telegrafo pneumatico', '20 20 60',
      [('O', 'c8a04a', 'ottone'), ('o', '8a6a2a', 'ottone scuro'), ('N', '2a2c30', 'base di ghisa'), ('V', 'd8eef0', 'vetro dello sportello'), ('R', 'b0603a', 'tubo di rame')],
      [cyl(10, 10, 0, 12, 12, 4, 'N', None), cyl(10, 10, 4, 8, 8, 30, 'O', None), carve(cyl, 10, 10, 5, 6, 6, 28, on='O'), cyl(10, 10, 12, 9, 9, 2, 'o'), cyl(10, 10, 28, 9, 9, 2, 'o'), box(10, 14, 18, 4, 1, 5, 'V', None)],
      [[P('O', cyl(10, 10, 34, 6, 6, 14)), None],
       [P('O', ell(10, 10, 34, 10, 10, 8)), None],
       [P('o', cone(10, 10, 34, 10, 10, 22)), None],
       [P('R', line((10, 6, 30), (10, 2, 30), 2), line((10, 2, 30), (10, 2, 0), 2)), P('R', line((6, 10, 30), (2, 10, 30), 2), line((2, 10, 30), (2, 10, 0), 2)), P('R', line((14, 10, 30), (18, 10, 30), 2), line((18, 10, 30), (18, 10, 0), 2))],
       [P('N', line((13, 12, 22), (17, 16, 31), 1)), P('N', line((7, 12, 22), (3, 16, 31), 1))]],
      note='Telegrafo pneumatico')

# 7. Pilone d'ormeggio (monumento): traliccio di ferro; la cima, i rinforzi e i cavi cambiano.
model('pilone-ormeggio', "Pilone d'ormeggio", '20 20 60',
      [('I', '4a4e56', 'ferro del traliccio'), ('i', '6a6e76', 'ferro chiaro'), ('O', 'c8a04a', 'anello d\'ottone'), ('C', 'b8a888', 'cavi di canapa'), ('L', 'ffcf70', 'fanale', GLOW)],
      [box(10, 10, 0, 14, 14, 3, 'I', None), line((4, 4, 3), (9, 9, 49), 1, 'I'), line((16, 4, 3), (11, 9, 49), 1, 'I'), line((4, 16, 3), (9, 11, 49), 1, 'I'), line((16, 16, 3), (11, 11, 49), 1, 'I'),
       cyl(10, 10, 48, 6, 6, 4, 'i')],
      [[[P('O', cyl(10, 10, 52, 12, 12, 2)), P('L', box(10, 16, 51, 2, 1, 2))], None],
       [[P('O', ell(10, 10, 52, 8, 8, 8)), P('L', box(10, 10, 59, 2, 2, 1))], None],
       [P('i', box(10, 10, 14, 13, 13, 2), box(10, 10, 30, 11, 11, 2)), P('i', line((4, 4, 12), (16, 16, 26), 1), line((16, 4, 12), (4, 16, 26), 1)), None],
       [P('C', line((10, 10, 50), (19, 19, 0), 1)), P('C', line((10, 10, 50), (1, 19, 0), 1)), P('C', line((10, 10, 50), (19, 1, 0), 1), line((10, 10, 50), (1, 1, 0), 1))]],
      note="Pilone d'ormeggio")

# 8. Serratura a ingranaggi (mobile): piastra di ghisa; tre ruote dentate d'ottone (dischi rivolti al davanti) cambiano posto e misura.
model('enigma-ingranaggi', 'Serratura a ingranaggi', '20 20 20',
      [('G', '3e4248', 'ghisa'), ('O', 'c8a04a', 'ruote d\'ottone'), ('o', '8a6a2a', 'denti'), ('R', 'c0302a', 'denti segnati')],
      [box(10, 10, 0, 18, 6, 2, 'G', None), box(10, 10, 2, 16, 3, 17, 'G', None)],
      [[[P('O', ell(6, 13, 3, 9, 3, 9)), P('R', box(6, 15, 7, 2, 1, 2))], [P('O', ell(7, 13, 10, 9, 3, 9)), P('R', box(7, 15, 14, 2, 1, 2))]],
       [[P('O', ell(14, 13, 10, 7, 3, 7)), P('R', box(14, 15, 13, 1, 1, 1))], [P('O', ell(14, 13, 3, 7, 3, 7)), P('R', box(14, 15, 6, 1, 1, 1))]],
       [P('o', ell(11, 13, 14, 5, 3, 5)), P('o', ell(11, 13, 2, 5, 3, 5)), P('o', ell(3, 13, 14, 5, 3, 5))]],
      after='<prl steps="1"><rule in="BO" out="oO" p="0.35"/></prl>',
      note='Serratura a ingranaggi')

# 9. Cassaforte di ghisa (mobile): cubo cavo con lo sportello, la manopola e la maniglia; zoccolo, cima e maniglie laterali cambiano.
model('cassaforte-ghisa', 'Cassaforte di ghisa', '20 20 20',
      [('G', '2e3238', 'ghisa'), ('g', '4a4e56', 'spigoli'), ('O', 'c8a04a', 'manopola e maniglia'), ('N', '1a1c20', 'fessure')],
      [box(10, 10, 0, 14, 14, 15, 'G', None), carve(box, 10, 10, 1, 12, 12, 13, on='G'), box(10, 17, 3, 10, 1, 10, 'N', None), cyl(8, 18, 8, 4, 1, 4, 'O'), box(13, 18, 8, 1, 1, 4, 'O')],
      [[P('g', box(10, 10, 0, 18, 18, 2)), None],
       [P('g', box(10, 10, 15, 16, 16, 2), box(10, 10, 17, 10, 10, 2)), P('O', box(10, 10, 15, 6, 6, 4)), None],
       [P('g', box(2, 10, 6, 1, 6, 4), box(18, 10, 6, 1, 6, 4)), P('O', box(10, 2, 4, 8, 1, 8)), None],
       [P('O', box(4, 18, 2, 2, 1, 3), box(4, 18, 10, 2, 1, 3)), None]],
      note='Cassaforte di ghisa')

# 10. Lampione a gas (monumento): fusto di ghisa; lanterna (in cima, a braccio, doppia), base e insegna cambiano.
model('lampione-gas', 'Lampione a gas', '20 20 60',
      [('N', '22262a', 'ghisa nera'), ('n', '3a3e44', 'ghisa'), ('L', 'ffcf70', 'vetro acceso', GLOW), ('O', 'c8a04a', 'ottone')],
      [cyl(10, 10, 0, 6, 6, 4, 'n', None), cyl(10, 10, 4, 3, 3, 42, 'N', None)],
      [[[P('N', box(10, 10, 46, 7, 7, 1), cone(10, 10, 53, 8, 8, 5)), P('L', box(10, 10, 47, 5, 5, 6))],
        [P('N', line((10, 10, 45), (17, 10, 45), 1), box(17, 10, 43, 5, 5, 1)), P('L', box(17, 10, 38, 4, 4, 5))],
        [P('N', line((10, 10, 45), (3, 10, 45), 1), line((10, 10, 45), (17, 10, 45), 1), box(3, 10, 43, 5, 5, 1), box(17, 10, 43, 5, 5, 1)), P('L', box(3, 10, 38, 4, 4, 5), box(17, 10, 38, 4, 4, 5))]],
       [P('n', cyl(10, 10, 4, 6, 6, 10)), P('O', cyl(10, 10, 18, 5, 5, 3), cyl(10, 10, 28, 5, 5, 3))],
       [P('n', line((10, 10, 32), (4, 10, 32), 1), box(4, 10, 25, 1, 5, 6)), P('O', box(10, 10, 12, 7, 7, 1), box(10, 10, 36, 7, 7, 1))]],
      note='Lampione a gas')

# 11. Bacheca delle corporazioni (monumento): tavola di legno su due gambe; tettoia, fogli e piedi cambiano.
model('bacheca-corporazione', 'Bacheca delle corporazioni', '20 20 60',
      [('W', '5a3a20', 'legno scuro'), ('P', 'e8dcb8', 'fogli'), ('p', 'd8c088', 'fogli ingialliti'), ('U', '6a6e74', 'lamiera'), ('R', 'a83a2a', 'manifesto rosso')],
      [box(10, 10, 14, 18, 3, 22, 'W', None), box(3, 10, 0, 2, 2, 14, 'W', None), box(17, 10, 0, 2, 2, 14, 'W', None)],
      [[P('U', box(10, 11, 36, 20, 7, 2)), None],
       [P('U', box(10, 11, 36, 14, 5, 6)), P('W', box(3, 10, 36, 2, 2, 14), box(17, 10, 36, 2, 2, 8)), None],
       [P('P', box(6, 12, 18, 5, 1, 7), box(13, 12, 24, 5, 1, 8)), P('p', box(10, 12, 16, 12, 1, 6), box(7, 12, 27, 6, 1, 6)), P('R', box(10, 12, 20, 10, 1, 12))],
       [P('W', box(10, 12, 0, 18, 6, 2), box(10, 8, 0, 18, 6, 2)), P('W', box(10, 10, 6, 16, 2, 2)), None]],
      note='Bacheca delle corporazioni')

# 12. Guardiano d'ottone (persona): gambe di ghisa, corpo a botte; testa, braccia e chiave nella schiena cambiano.
model('automa-ottone', "Guardiano d'ottone", '20 15 30',
      [('O', 'c8a04a', 'ottone', {'part': 'braccio'}), ('o', 'a8802a', 'ottone del corpo'), ('G', '3e4248', 'ghisa delle gambe', {'part': 'gamba'}), ('E', '5aff8a', 'occhi verdi', GLOW), ('N', '2a2c30', 'rivetti')],
      [box(7, 7, 0, 4, 5, 8, 'G', None), box(13, 7, 0, 4, 5, 8, 'G', None), cyl(10, 7, 8, 12, 11, 10, 'o', None), carve(cyl, 10, 7, 9, 9, 8, 8, on='o'), cyl(10, 7, 11, 13, 12, 1, 'N'), cyl(10, 7, 15, 13, 12, 1, 'N')],
      [[[P('o', ell(10, 7, 18, 10, 9, 8)), P('E', box(8, 12, 21, 2, 1, 2), box(12, 12, 21, 2, 1, 2))], [P('o', box(10, 7, 18, 9, 8, 8), cyl(10, 7, 26, 2, 2, 3)), P('E', box(10, 12, 21, 6, 1, 2))]],
       [P('O', cyl(3, 7, 9, 3, 3, 9), cyl(17, 7, 9, 3, 3, 9)), P('O', cyl(3, 7, 4, 3, 3, 14), cyl(17, 7, 4, 3, 3, 14), ell(3, 7, 2, 4, 4, 3), ell(17, 7, 2, 4, 4, 3))],
       [P('N', line((10, 1, 13), (10, 0, 13), 1), box(10, 0, 11, 5, 1, 5)), P('N', line((10, 1, 15), (10, 0, 15), 1), cyl(10, 0, 12, 6, 1, 6))],
       [P('O', ell(10, 7, 26, 7, 7, 4)), None],
       [P('o', box(3, 7, 17, 5, 6, 3), box(17, 7, 17, 5, 6, 3)), None],
       [P('N', box(10, 13, 8, 8, 2, 6)), None]],
      note="Guardiano d'ottone")

# 13. Chiave inglese (oggetto): manico e testa; la ganascia aperta o chiusa, l'impugnatura cambia.
model('chiave-inglese', 'Chiave inglese', '12 12 12',
      [('I', '8a8e96', 'ferro'), ('i', '5a5e66', 'ferro scuro'), ('W', '6a4024', 'impugnatura')],
      [box(7, 6, 0, 8, 2, 2, 'I', None), box(2, 6, 0, 3, 6, 2, 'i', None)],
      [[P('i', box(2, 2, 0, 3, 2, 2), box(2, 10, 0, 3, 2, 2)), P('i', box(2, 6, 2, 3, 6, 2))],
       [P('W', box(9, 6, 0, 5, 4, 3)), None],
       [P('i', box(11, 6, 0, 2, 4, 4)), None]],
      note='Chiave inglese')

# 14. Gente delle Città del Vapore (persona): stivali, giacca, braccia, testa grande; gambe o gonna, cappello, grembiule, zaino e attrezzo cambiano.
model('persona-vapore', 'Gente del vapore', '20 15 30',
      [('N', '2e2018', 'stivali', {'part': 'gamba'}), ('P', '4a4038', 'pantaloni', {'part': 'gamba'}), ('C', '6a5040', 'giacca'), ('S', 'dfa57e', 'pelle'), ('M', '5a4434', 'maniche', {'part': 'braccio'}),
       ('E', '1c140e', 'occhi'), ('H', '3e2a18', 'capelli'), ('K', '2a2c30', 'cappello scuro'), ('A', '8a5a34', 'cuoio'), ('O', 'c8a04a', 'ottone'), ('G', '7a2a22', 'gonna e sciarpa')],
      [box(7, 7, 0, 4, 5, 3, 'N', None), box(13, 7, 0, 4, 5, 3, 'N', None), cyl(10, 7, 8, 11, 9, 9, 'C', None), cyl(3, 7, 9, 3, 4, 8, 'M', None), cyl(17, 7, 9, 3, 4, 8, 'M', None),
       ell(3, 7, 7, 3, 3, 3, 'S'), ell(17, 7, 7, 3, 3, 3, 'S'), ell(10, 7, 17, 11, 10, 9, 'S', None), box(8, 12, 20, 2, 1, 2, 'E'), box(12, 12, 20, 2, 1, 2, 'E'), ell(10, 6, 21, 11, 9, 5, 'H')],
      [[P('P', box(7, 7, 3, 4, 5, 5), box(13, 7, 3, 4, 5, 5)), P('G', cone(10, 7, 3, 13, 11, 7))],
       [P('K', cyl(10, 7, 24, 9, 8, 6), cyl(10, 7, 24, 13, 12, 1)), P('K', ell(10, 7, 24, 11, 10, 4), box(10, 11, 24, 9, 3, 1)), [P('A', ell(10, 7, 23, 12, 11, 4)), P('O', box(8, 12, 23, 3, 1, 2), box(12, 12, 23, 3, 1, 2))]],
       [P('A', box(10, 12, 4, 9, 2, 10)), P('A', line((5, 12, 16), (15, 12, 9), 1), box(10, 12, 7, 11, 1, 1)), P('C', box(10, 7, 4, 11, 9, 4))],
       [P('O', box(10, 2, 9, 8, 3, 7)), P('A', box(10, 2, 8, 9, 3, 9)), P('G', cyl(10, 7, 16, 12, 10, 1))],
       [[P('O', line((17, 9, 6), (17, 9, 15), 1)), P('A', box(17, 10, 15, 3, 3, 2))], P('A', line((3, 9, 4), (3, 9, 16), 1), box(3, 11, 2, 4, 4, 2))]],
      note='Gente delle Città del Vapore')

# 15. Casa comune (edificio): casa di mattoni stretta e alta, cava, con la porta sul davanti; il piano di sopra, il tetto, i comignoli e l'annesso cambiano.
model('casa-comune-edificio-ee18c0d6', 'Casa di mattoni', '50 50 50',
      [('Q', '9a4a32', 'mattoni rossi'), ('q', '6e3422', 'fasce di mattoni scuri'), ('T', '4e5560', 'ardesia'), ('V', 'ffd890', 'finestre accese', GLOW), ('N', '2a2c30', 'comignolo'), ('L', '7a7268', 'pietra della soglia')],
      [box(25, 25, 0, 26, 22, 22, 'Q', None), carve(box, 25, 25, 1, 22, 18, 21, on='Q'), box(25, 25, 22, 26, 22, 1, 'q', None), box(25, 36, 1, 6, 2, 10, 'B', 'Q'), box(25, 37, 0, 8, 2, 1, 'L'), box(25, 37, 11, 8, 1, 1, 'q'),
       box(16, 36, 4, 4, 1, 4, 'V', None), box(34, 36, 4, 4, 1, 4, 'V', None), box(12, 25, 14, 1, 4, 4, 'V', None), box(38, 25, 14, 1, 4, 4, 'V', None)],
      [[[P('Q', box(25, 25, 23, 26, 22, 10)), P('V', box(16, 37, 26, 4, 1, 4), box(34, 37, 26, 4, 1, 4))], None],
       [P('T', cone(25, 25, 23, 30, 26, 18)), None],
       [P('T', box(25, 25, 23, 28, 24, 2), box(25, 25, 25, 20, 16, 4)), None],
       [P('N', box(16, 20, 23, 4, 4, 22)), P('N', box(34, 30, 23, 4, 4, 22), box(16, 20, 23, 3, 3, 18)), P('N', box(25, 14, 23, 6, 3, 24))],
       [[P('q', box(6, 25, 0, 12, 14, 12)), P('T', box(6, 25, 12, 14, 16, 2))], [P('q', box(44, 25, 0, 12, 14, 12)), P('T', box(44, 25, 12, 14, 16, 2))], P('L', box(25, 43, 0, 22, 10, 1), box(15, 47, 1, 2, 2, 6), box(35, 47, 1, 2, 2, 6)), None]],
      note='Casa comune delle Città del Vapore (edificio)')

# 16. Casa comune grande (grande, 100×100×80): palazzina operaia di mattoni a due piani con la scala; tetto, ali e torre dell'acqua cambiano.
model('casa-comune-grande-ee18c0d6', 'Palazzina di mattoni', '100 100 80',
      [('Q', '9a4a32', 'mattoni rossi'), ('q', '6e3422', 'marcapiani'), ('T', '4e5560', 'ardesia'), ('V', 'ffd890', 'finestre accese', GLOW), ('N', '2a2c30', 'ferro'), ('L', '7a7268', 'pietra'), ('F', '8e6a44', 'pavimenti')],
      [box(50, 50, 0, 52, 44, 30, 'Q', None), carve(box, 50, 50, 1, 48, 40, 29, on='Q'), box(50, 50, 30, 52, 44, 1, 'q', None), box(50, 50, 15, 48, 40, 1, 'F', 'B'), box(38, 50, 15, 12, 8, 1, 'B', 'F'), box(50, 72, 1, 12, 2, 12, 'B', 'Q'), box(50, 73, 0, 16, 3, 1, 'L'),
       box(50, 50, 14, 52, 44, 1, 'q', 'Q'), box(30, 72, 4, 6, 1, 6, 'V', None), box(70, 72, 4, 6, 1, 6, 'V', None), box(30, 72, 19, 6, 1, 6, 'V', None), box(70, 72, 19, 6, 1, 6, 'V', None), box(50, 72, 19, 6, 1, 6, 'V', None),
       box(24, 50, 6, 1, 6, 6, 'V', None), box(76, 50, 6, 1, 6, 6, 'V', None), box(24, 50, 20, 1, 6, 6, 'V', None), box(76, 50, 20, 1, 6, 6, 'V', None),
       line((44, 50, 1), (33, 50, 14), 2, 'F')],
      [[[P('Q', box(50, 50, 31, 52, 44, 12)), P('V', box(30, 73, 34, 6, 1, 6), box(70, 73, 34, 6, 1, 6))], None],
       [P('T', cone(50, 50, 31, 58, 50, 24)), None],
       [[P('Q', box(13, 50, 0, 22, 30, 22)), P('T', box(13, 50, 22, 24, 32, 2))], [P('Q', box(87, 50, 0, 22, 30, 22)), P('T', box(87, 50, 22, 24, 32, 2))], P('N', box(50, 87, 0, 40, 2, 10), box(31, 80, 0, 3, 14, 10), box(69, 80, 0, 3, 14, 10))],
       [P('N', cyl(34, 40, 31, 10, 10, 30), cyl(34, 40, 61, 14, 14, 10)), P('N', box(66, 40, 31, 6, 6, 32)), P('N', box(50, 30, 31, 8, 8, 36)), None]],
      note='Casa comune delle Città del Vapore (grande)')
print('modelli scritti')
