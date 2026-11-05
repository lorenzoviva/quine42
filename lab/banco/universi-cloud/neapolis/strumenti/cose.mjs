// Le cose di Neapolis (obj.*) e il sistema del quartiere (sys.quartiere): manifest e logic.lua.
// node lab/banco/universi-cloud/neapolis/strumenti/cose.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
const DIR = 'lab/banco/universi-cloud/neapolis/modules';

const HEAD = `-- La parte del giorno, come la conta il kernel (un giorno dura 600 secondi).
local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function giorno() return math.floor((time or 0) / 600 + 0.12) end

-- Uno stato che le rune pronunciate lasciano addosso al viandante (vedi core.effects).
local function addosso(user, nome)
  local st = ecs.get(user, "stati")
  return st and st[nome] and true or false
end

local function quartiere()
  local q = ecs.first("quartiere")
  return q, q and ecs.get(q, "quartiere")
end

local function dai(user, nome, n)
  local it = items.find(nome)
  if it then return inventory.add(user, it, n or 1) end
  return 0
end
`;

const COSE = [
  { id: 'obj.distributore', name: 'Distributore automatico', glyph: '▥', color: '#d83a3a', model: 'distributore', aspetto: 'un distributore automatico rosso con la vetrina illuminata, le spirali di bibite e la feritoia delle monete',
    description: 'Un distributore di bibite e merendine: a volte dà il resto, a volte no.', context: 'stazioni, uffici, ospedali', tags: ['insegna', 'metallo'],
    components: { luce: { raggio: 2.5, accesa: false, colore: '#ff9a7a' } },
    actions: [{ id: 'compra', label: 'Metti cento lire', requires: 'item.cento-lire' }, { id: 'scuoti', label: 'Scuoti il distributore' }, { id: 'gettone', label: 'Prova con un gettone', requires: 'item.gettone' }],
    logic: `-- Distributore: cento lire, una cosa a caso dalle spirali; scosso, a volte lascia cadere qualcosa, a volte niente.
-- Chi è carico della runa dei fili lo fa ripartire gratis. Lo stato vive nel componente "spirali".
local M = {}
${HEAD}
local SPIRALI = { "Acqua minerale", "Caramella alla menta", "Pila", "Acqua minerale", "Cornetto" }

function M.on_spawn(id)
  ecs.set(id, "spirali", { scossoni = 0, giorno = -1 })
end

function M.on_act(id, user, action)
  local s = ecs.get(id, "spirali") or { scossoni = 0, giorno = -1 }
  if action == "compra" then
    inventory.remove(user, "item.cento-lire", 1)
    local nome = SPIRALI[math.floor(hash(id, giorno(), s.scossoni) * #SPIRALI) + 1]
    dai(user, nome, 1)
    ecs.set(id, "spirali", { scossoni = s.scossoni + 1, giorno = s.giorno })
    return "Clic, la spirale gira: cade " .. nome .. "."
  end
  if action == "gettone" then
    return "Il gettone entra, gira, e torna fuori dalla feritoia del resto. I distributori non telefonano."
  end
  if action == "scuoti" then
    if addosso(user, "carico") then
      dai(user, "Acqua minerale", 1)
      return "Appena lo tocchi, il distributore ronza, si illumina tutto e lascia cadere una bottiglia d’acqua. Chissà perché."
    end
    if s.giorno == giorno() then return "Lo scuoti, ma è già stato scosso oggi: dentro non si muove più niente." end
    ecs.set(id, "spirali", { scossoni = s.scossoni, giorno = giorno() })
    if hash(id, giorno(), 7) < 0.4 then
      dai(user, "Caramella alla menta", 1)
      return "Uno scossone, due scossoni: cade una caramella alla menta. Il vigile, da lontano, fa finta di non vedere."
    end
    return "Lo scuoti. Il distributore dondola, ronza, e non dà niente. Una signora ti guarda male."
  end
  return nil
end

return M
` },
  { id: 'obj.espresso', name: 'Macchina del caffè espresso', glyph: '♨', color: '#c0c4c8', model: 'macchina-espresso', aspetto: 'una macchina del caffè espresso da bar, cromata, con le leve, i manometri e le tazzine capovolte sopra',
    description: 'La macchina del caffè di un bar: cromata, bollente, sbuffa vapore. Con i chicchi giusti fa il caffè migliore della città.', context: 'banconi dei bar', tags: ['bar', 'metallo', 'caldo'],
    components: { caldaia: { pressione: 1 } },
    actions: [{ id: 'caffe', label: 'Fai il caffè', requires: 'item.chicchi-caffe' }, { id: 'vapore', label: 'Apri il vapore' }, { id: 'sospeso', label: 'Lascia un caffè sospeso', requires: 'item.cento-lire' }, { id: 'prendi-sospeso', label: 'Prendi un caffè sospeso' }],
    logic: `-- Macchina del caffè: con i chicchi fa due tazzine; il vapore scalda; il caffè sospeso si lascia e si prende.
-- I sospesi del bar vivono nel componente "sospesi" dell'entità.
local M = {}
${HEAD}
function M.on_spawn(id)
  ecs.set(id, "sospesi", { n = 1 + math.floor(hash(id, 2) * 3) })
end

local function sospesi(id)
  local s = ecs.get(id, "sospesi")
  return (s and s.n) or 0
end

function M.on_act(id, user, action)
  if action == "caffe" then
    inventory.remove(user, "item.chicchi-caffe", 1)
    dai(user, "Tazzina di caffè", 2)
    if addosso(user, "carico") then return "La macchina sbuffa come un treno e i manometri vanno al massimo: due caffè così forti che fanno tremare il piattino." end
    return "Macinato, pressato, agganciato: la macchina gorgoglia e riempie due tazzine di crema scura."
  end
  if action == "vapore" then
    local n = ecs.get(user, "needs")
    if n then n.energy = math.min(100, n.energy + 3) end
    return "Uno sbuffo di vapore caldo ti appanna la faccia. Ti senti un po’ più sveglio."
  end
  if action == "sospeso" then
    inventory.remove(user, "item.cento-lire", 1)
    ecs.set(id, "sospesi", { n = sospesi(id) + 1 })
    return "Lasci pagato un caffè per chi verrà dopo. Al bancone qualcuno annuisce, senza dire niente."
  end
  if action == "prendi-sospeso" then
    local n = sospesi(id)
    if n <= 0 then return "Oggi i sospesi sono finiti. Domani, forse, qualcuno ne lascia uno." end
    ecs.set(id, "sospesi", { n = n - 1 })
    dai(user, "Tazzina di caffè", 1)
    return "Un caffè sospeso, per te. Nessuno chiede chi l’ha pagato: si usa così."
  end
  return nil
end

return M
` },
  { id: 'obj.scrivania', name: 'Scrivania e archivio delle pratiche', glyph: '▤', color: '#8a7a6a', model: 'scrivania-ufficio', aspetto: 'una scrivania d’ufficio grigia con la macchina da scrivere, il telefono a disco e un archivio a cassetti pieno di cartelline',
    description: 'Una postazione d’ufficio con l’archivio delle pratiche: timbri, cartelline, cassetti che si aprono a fatica.', context: 'uffici del Centro Direzionale', tags: ['ufficio', 'metallo'],
    container: { size: 6, loot: 'ufficio' },
    actions: [{ id: 'fruga', label: 'Fruga nell’archivio' }, { id: 'timbra', label: 'Timbra una pratica', requires: 'item.pratica' }, { id: 'telefono', label: 'Alza il telefono' }],
    logic: `-- Postazione d'ufficio: l'archivio si apre un cassetto alla volta (componente "archivio"); nell'ultimo c'è la busta
-- gialla delle pratiche della Linea 2. Il telefono squilla a vuoto, o qualcuno risponde, secondo l'ora.
local M = {}
${HEAD}
local CASSETTI = {
  "Primo cassetto: pratiche di condono, timbri vecchi, una caramella attaccata al fondo.",
  "Secondo cassetto: contratti delle pulizie, una foto di una gita a Capri, una graffetta storta.",
  "Terzo cassetto: le pratiche della Linea 2. Due cartelline hanno la stessa firma e date diverse.",
}

function M.on_act(id, user, action)
  if action == "fruga" then
    if addosso(user, "nascosto") == false and fase() == "giorno" then
      local a0 = ecs.get(id, "archivio")
      if not a0 or a0.n == 0 then
        ecs.set(id, "archivio", { n = 1, busta = false })
        return "Apri il primo cassetto. Un collega alza la testa: «Cerca qualcosa?» Meglio tornare quando non c’è nessuno, o senza farsi vedere."
      end
    end
    local a = ecs.get(id, "archivio") or { n = 0, busta = false }
    local n = math.min(#CASSETTI + 1, a.n + 1)
    if n > #CASSETTI then
      if a.busta then return "L’archivio è vuoto di sorprese: hai già preso quello che c’era." end
      ecs.set(id, "archivio", { n = n, busta = true })
      dai(user, "Busta gialla", 1)
      return "In fondo all’ultimo cassetto, sotto un doppio fondo di cartone, una busta gialla chiusa con lo scotch. La prendi."
    end
    ecs.set(id, "archivio", { n = n, busta = a.busta })
    return CASSETTI[n]
  end
  if action == "timbra" then
    return "Tum, tum: il timbro lascia un cerchio viola. La pratica è più ufficiale di prima, e niente più."
  end
  if action == "telefono" then
    local f = fase()
    if f == "notte" then return "Il telefono è muto. Poi, dal quattordicesimo piano, uno squillo lontano: qualcuno lavora anche adesso." end
    if f == "mattina" then return "«Ufficio appalti, buongiorno.» È la tua voce che rimbalza: hai chiamato l’interno sbagliato." end
    return "Squilla a vuoto. Sul blocco accanto qualcuno ha scritto: «Molo — fine mese — non al telefono»."
  end
  return nil
end

return M
` },
  { id: 'obj.banco-officina', name: 'Banco da officina', glyph: '⚙', color: '#5a6a7a', model: 'banco-officina', aspetto: 'un banco da officina di ferro con la morsa, gli attrezzi appesi al pannello forato e una lampada a braccio',
    description: 'Un banco da meccanico con la morsa e gli attrezzi appesi: si ripara di tutto, se si sa come.', context: 'officine dei Granili e della stazione', tags: ['officina', 'metallo'],
    container: { size: 8, loot: 'officina' },
    actions: [{ id: 'ripara', label: 'Ripara un pezzo', requires: 'item.ricambio' }, { id: 'attrezzi', label: 'Prendi un attrezzo' }, { id: 'radio', label: 'Aggiusta una radiolina', requires: 'item.radiolina' }],
    logic: `-- Banco d'officina: un pezzo di ricambio diventa due candele del motore; dal pannello si prende un attrezzo,
-- uno per visita (componente "pannello"); una radiolina sistemata prende Radio Ciok Ciok.
local M = {}
${HEAD}
local ATTREZZI = { "Cacciavite", "Chiave inglese", "Nastro isolante" }

function M.on_act(id, user, action)
  if action == "ripara" then
    inventory.remove(user, "item.ricambio", 1)
    dai(user, "Candela del motore", 2)
    if addosso(user, "carico") then return "Appena tocchi la morsa scocca una scintilla: il pezzo si ripara quasi da solo. Due candele del motore, nuove." end
    return "Morsa, lima, un po’ d’olio: dal pezzo vecchio tiri fuori due candele del motore che sembrano nuove."
  end
  if action == "attrezzi" then
    local p = ecs.get(id, "pannello") or { presi = 0 }
    if p.presi >= #ATTREZZI then return "Il pannello è vuoto: restano solo le sagome degli attrezzi disegnate col pennarello." end
    local nome = ATTREZZI[p.presi + 1]
    ecs.set(id, "pannello", { presi = p.presi + 1 })
    dai(user, nome, 1)
    return "Stacchi dal pannello: " .. nome .. ". Il meccanico, se c’è, finge di non vedere."
  end
  if action == "radio" then
    local f = fase()
    if f == "sera" then return "Un colpo di cacciavite e la radiolina gracchia: è Radio Ciok Ciok, il quiz della sera. «La domanda di stasera: quante gru ha il porto?»" end
    return "Sistemi un filo e la radiolina prende Radio Ciok Ciok: canzoni, pubblicità del mobilificio, e la voce che dice che il porto vende le banchine."
  end
  return nil
end

return M
` },
  { id: 'obj.quadro-elettrico', name: 'Cabina elettrica di quartiere', glyph: 'ϟ', color: '#a8a49c', model: 'quadro-elettrico', aspetto: 'una cabina elettrica di cemento grigio con lo sportello di metallo, il cartello del fulmine e i contatori dietro il vetro',
    description: 'La cabina elettrica che dà la luce al rione: dentro, il quadro con le leve, i fusibili e i contatori.', context: 'angoli delle strade, cantieri, officine', tags: ['elettricita', 'metallo'],
    actions: [{ id: 'contatori', label: 'Leggi i contatori' }, { id: 'fusibile', label: 'Cambia il fusibile', requires: 'item.fusibile' }, { id: 'leva', label: 'Tira la leva generale', requires: 'item.cacciavite' }],
    logic: `-- Cabina elettrica: quando il quartiere è al buio (sys.quartiere), un fusibile nuovo o la leva generale ridanno la luce.
-- Chi porta la runa dei fili o ne è carico sente il quadro ronzare in un altro modo.
local M = {}
${HEAD}
function M.on_act(id, user, action)
  local q, s = quartiere()
  if action == "contatori" then
    if inventory.count(user, "rune:corrente") > 0 or addosso(user, "carico") then
      return "I contatori girano, tutti nello stesso verso. Tutti tranne quello del cantiere: gira al contrario, e ronza in un modo che senti nei denti."
    end
    if s and s.buio then return "I contatori sono fermi. Il quartiere è al buio: il fusibile generale è saltato." end
    return "I contatori girano tranquilli. Uno, con l’etichetta «cantiere L2», gira al contrario."
  end
  if action == "fusibile" then
    inventory.remove(user, "item.fusibile", 1)
    dai(user, "Fusibile bruciato", 1)
    if q and s and s.buio then
      ecs.set(q, "quartiere", { buio = false, fase = s.fase, giorno = s.giorno, riparato = (s.riparato or 0) + 1, ricontrolla = true })
      return "Togli il fusibile annerito e metti quello nuovo. Un colpo secco, e i lampioni del rione si riaccendono uno dopo l’altro."
    end
    return "Cambi il fusibile, per scrupolo. Quello vecchio era ancora buono, quasi."
  end
  if action == "leva" then
    if q and s and s.buio then
      ecs.set(q, "quartiere", { buio = false, fase = s.fase, giorno = s.giorno, riparato = (s.riparato or 0) + 1, ricontrolla = true })
      return "Fai leva col cacciavite sullo sportello e tiri giù la leva generale: la luce torna. Ma il quadro col lucchetto nuovo, quello del cantiere, resta acceso per conto suo."
    end
    return "La leva è già su. Meglio non giocarci: quella è corrente vera."
  end
  return nil
end

return M
` },
  { id: 'obj.edicola', name: 'Edicola', glyph: '▦', color: '#3a8a4a', model: 'edicola', aspetto: 'un chiosco verde di lamiera con le riviste appese alle mollette, i giornali impilati e la tettoia',
    description: 'Il chiosco verde dei giornali: quotidiani, fotoromanzi, figurine, biglietti del tram e cartoline del golfo.', context: 'piazze, ingressi dei mercati, fermate', tags: ['edicola', 'carta'],
    container: { size: 6, loot: 'edicola' },
    actions: [{ id: 'sfoglia', label: 'Sfoglia i titoli' }, { id: 'compra', label: 'Compra il giornale', requires: 'item.cento-lire' }, { id: 'cartolina', label: 'Compra una cartolina', requires: 'item.cento-lire' }],
    logic: `-- Edicola: i titoli cambiano ogni giorno (scelti dal giorno, uguali per tutti); si comprano il giornale e le cartoline.
local M = {}
${HEAD}
local TITOLI = {
  "«Linea 2, il cantiere chiude il Corso per la terza volta»",
  "«Il porto vuole il Molo Vecchio. I portuali: non lo avrete»",
  "«Torre C, la luce accesa al quattordicesimo piano. Il Comune: è vuota»",
  "«Blackout nel Rione delle Lavandaie: l’azienda accusa il cantiere»",
  "«Domenica il derby: a Radio Ciok Ciok i biglietti del quiz»",
  "«Il mercato del Pendino compie cent’anni: festa con le bancarelle»",
  "«Scavando la metropolitana, spunta un molo antico. Lavori fermi»",
}

function M.on_act(id, user, action)
  if action == "sfoglia" then
    local i = math.floor(hash(giorno(), 31) * #TITOLI) + 1
    local j = (i % #TITOLI) + 1
    return "In prima pagina: " .. TITOLI[i] .. ". Sotto, più piccolo: " .. TITOLI[j] .. "."
  end
  if action == "compra" then
    inventory.remove(user, "item.cento-lire", 1)
    dai(user, "Giornale del mattino", 1)
    return "Il giornale di oggi, ancora caldo di stampa. L’edicolante te lo piega in due, come si fa."
  end
  if action == "cartolina" then
    inventory.remove(user, "item.cento-lire", 1)
    dai(user, "Cartolina del golfo", 1)
    return "Una cartolina del golfo al tramonto. Dietro c’è spazio per scrivere: «Bonombo a domani»."
  end
  return nil
end

return M
` },
  { id: 'obj.transenna', name: 'Transenna del cantiere', glyph: '╪', color: '#f0a020', model: 'transenna', aspetto: 'una transenna da cantiere stradale a strisce bianche e rosse, con la lampada gialla lampeggiante e i sacchi di sabbia alla base',
    description: 'Una transenna a strisce del cantiere della Linea 2, con la lampada gialla: dietro, lo scavo.', context: 'cantieri stradali, strade chiuse', tags: ['cantiere', 'metallo'],
    components: { luce: { raggio: 1.5, accesa: true, colore: '#ffc040' } },
    actions: [{ id: 'guarda', label: 'Guarda oltre la transenna' }, { id: 'scava', label: 'Fruga tra la terra smossa' }, { id: 'segna', label: 'Segna col gessetto', requires: 'item.gessetto' }],
    logic: `-- Transenna del cantiere: di giorno si vedono gli operai, di notte il camion senza targa; nella terra smossa, una volta
-- per transenna, un coccio antico del molo (componente "scavato").
local M = {}
${HEAD}
function M.on_act(id, user, action)
  if action == "guarda" then
    local f = fase()
    if f == "notte" then
      if addosso(user, "nascosto") then return "Nascosto nella foschia, vedi tutto: un camion senza targa carica casse dal pozzo dello scavo, e due uomini in giacca contano. Uno ha una chiave con l’etichetta «Mag. 7»." end
      return "Di notte il cantiere dovrebbe essere vuoto. Invece c’è un camion senza targa col motore acceso. Qualcuno ti punta una torcia in faccia: meglio andarsene."
    end
    if f == "sera" then return "Gli operai smontano. Uno ti fa segno di passare oltre: «Qua non c’è niente da vedere»." end
    return "Uno scavo profondo, le pompe che tirano acqua, gli operai col caschetto. In fondo, tra la terra, pietre squadrate: sembra un molo antico."
  end
  if action == "scava" then
    local s = ecs.get(id, "scavato")
    if s then return "Terra, sassi e un tappo di bottiglia. Il resto l’hai già preso." end
    ecs.set(id, "scavato", { si = true })
    dai(user, "Coccio antico", 1)
    return "Tra la terra smossa trovi un coccio liscio, col bordo di un’anfora. Lo infili in tasca prima che ti vedano."
  end
  if action == "segna" then
    return "Disegni una freccia col gessetto sulla transenna. Domani qualcuno la seguirà, o la cancellerà."
  end
  return nil
end

return M
` },
  { id: 'obj.cucina-trattoria', name: 'Cucina della trattoria', glyph: '♣', color: '#c8643a', model: 'cucina-trattoria', aspetto: 'una cucina a gas di trattoria con quattro fuochi, il pentolone del ragù, le padelle appese e il forno di sotto',
    description: 'La cucina di una trattoria del rione: quattro fuochi, il pentolone del ragù che borbotta, il forno per le pizze.', context: 'trattorie e pizzerie dei rioni', tags: ['cucina', 'caldo'],
    container: { size: 6, loot: 'cucina' },
    actions: [{ id: 'cucina', label: 'Cucina con quello che hai' }, { id: 'assaggia', label: 'Assaggia il ragù' }, { id: 'forno', label: 'Accendi il forno' }],
    logic: `-- Cucina della trattoria: con gli ingredienti giusti fa ragù, pizza o cuoppo (il primo che si può); l'assaggio sfama un poco.
local M = {}
${HEAD}
local PIATTI = {
  { nome = "Ragù della domenica", n = 1, serve = { { "item.pomodori", 2 }, { "item.carne-macinata", 1 } }, testo = "Il ragù borbotta per un’ora piena. Il profumo arriva fino in piazza." },
  { nome = "Pizza a portafoglio", n = 2, serve = { { "item.farina", 1 }, { "item.pomodori", 1 }, { "item.mozzarella", 1 } }, testo = "Impasti, stendi, condisci, inforni: due pizze a portafoglio, piegate in quattro." },
  { nome = "Cuoppo di alici", n = 3, serve = { { "item.alici", 1 }, { "item.farina", 1 } }, testo = "Infarini le alici e le butti nell’olio bollente: tre cuoppi croccanti." },
}

local function basta(user, serve)
  for _, s in ipairs(serve) do
    if inventory.count(user, s[1]) < s[2] then return false end
  end
  return true
end

function M.on_act(id, user, action)
  if action == "cucina" then
    for _, p in ipairs(PIATTI) do
      if basta(user, p.serve) then
        for _, s in ipairs(p.serve) do inventory.remove(user, s[1], s[2]) end
        dai(user, p.nome, p.n)
        return p.testo
      end
    end
    return "Guardi la dispensa e le tue tasche: per un ragù servono pomodori e carne, per la pizza farina, pomodori e mozzarella, per il cuoppo alici e farina."
  end
  if action == "assaggia" then
    local n = ecs.get(user, "needs")
    if n then n.hunger = math.min(100, n.hunger + 6) end
    return "Un cucchiaio di ragù dal pentolone. La cuoca ti guarda: «Piano, che è per la domenica»."
  end
  if action == "forno" then
    if addosso(user, "carico") then return "Il forno si accende da solo con uno sbuffo: la runa che hai pronunciato non si è ancora calmata." end
    return "Giri la manopola e accendi il fiammifero: il forno prende con un tonfo. Ora è pronto per le pizze."
  end
  return nil
end

return M
` },
  { id: 'obj.lampione', name: 'Lampione', glyph: '¥', color: '#e0d080', model: 'lampione', aspetto: 'un lampione di ghisa verde scuro con il braccio ricurvo e la lanterna gialla',
    description: 'Un lampione di ghisa del rione: si accende al tramonto, se il quartiere ha la corrente.', context: 'strade, piazze, lungomare', tags: ['lampione', 'metallo'],
    components: { luce: { raggio: 4, accesa: false, colore: '#ffd88a' } },
    actions: [{ id: 'appoggiati', label: 'Appoggiati al lampione' }, { id: 'guarda', label: 'Guarda la lanterna' }],
    logic: `-- Lampione: lo accende e lo spegne sys.quartiere (componente "luce"). Appoggiarsi riposa un poco.
local M = {}
${HEAD}
function M.on_act(id, user, action)
  if action == "appoggiati" then
    local n = ecs.get(user, "needs")
    if n then n.energy = math.min(100, n.energy + 2) end
    if fase() == "sera" then return "Ti appoggi al lampione. Il rione si prepara alla sera: sedie in strada, radio accese, l’odore del sugo." end
    return "Ti appoggi alla ghisa fresca e riprendi fiato."
  end
  if action == "guarda" then
    local l = ecs.get(id, "luce")
    local _, s = quartiere()
    if s and s.buio then return "La lanterna è spenta, come tutte le altre: il quartiere è al buio. Qualcuno dovrebbe guardare la cabina elettrica." end
    if l and l.accesa then return "La lanterna è accesa e ci girano attorno tre falene." end
    return "La lanterna è spenta: si accenderà al tramonto."
  end
  return nil
end

return M
` },
  { id: 'obj.motorino', name: 'Motorino', glyph: 'ø', color: '#d83a3a', model: 'motorino', aspetto: 'un motorino rosso con lo scudo anteriore, la sella nera, lo specchietto e il bauletto dietro',
    description: 'Un motorino rosso parcheggiato in seconda fila: chi lo sa accendere ci va dappertutto.', context: 'strade, marciapiedi, davanti ai bar', tags: ['motorino', 'metallo'],
    components: { serbatoio: { miscela: 2 } },
    actions: [{ id: 'monta', label: 'Monta e accendi' }, { id: 'smonta', label: 'Scendi dal motorino' }, { id: 'rifornisci', label: 'Fai la miscela', requires: 'item.olio-motore' }],
    logic: `-- Motorino: montato dà lo stato «in motorino» (più veloce, per un minuto) finché c'è miscela (componente "serbatoio");
-- chi porta la runa del motorino lo accende al primo colpo anche a secco.
local M = {}
${HEAD}
local function metti_stato(user, nome, velocita, durata)
  local st = ecs.get(user, "stati") or {}
  st[nome] = { velocita = velocita, peso = 0, luce = 0, fino = time + durata }
  ecs.set(user, "stati", st)
end

function M.on_act(id, user, action)
  local s = ecs.get(id, "serbatoio") or { miscela = 0 }
  if action == "monta" then
    local runa = inventory.count(user, "rune:motore") > 0
    if s.miscela <= 0 and not runa then return "Pedali, pedali: il motore tossisce e muore. Il serbatoio è a secco: ci vuole la miscela." end
    if s.miscela > 0 then ecs.set(id, "serbatoio", { miscela = s.miscela - 1 }) end
    metti_stato(user, "in motorino", 1.7, 60)
    if runa then return "Al primo colpo di pedale il motore canta come nuovo. In tasca, la runa del motorino è tiepida." end
    return "Un colpo di pedale e il motorino parte con una nuvola blu. Il vento in faccia, il rione che scorre."
  end
  if action == "smonta" then
    local st = ecs.get(user, "stati")
    if st and st["in motorino"] then
      st["in motorino"] = false
      ecs.set(user, "stati", st)
      return "Scendi e lo rimetti sul cavalletto, in seconda fila. Come tutti."
    end
    return "Non ci sei sopra."
  end
  if action == "rifornisci" then
    inventory.remove(user, "item.olio-motore", 1)
    ecs.set(id, "serbatoio", { miscela = s.miscela + 3 })
    return "Benzina e un goccio d’olio, il tappo ben chiuso: la miscela basta per tre giri."
  end
  return nil
end

return M
` },
  { id: 'obj.cabina-telefonica', name: 'Cabina telefonica', glyph: '☎', color: '#c8c8d0', model: 'cabina-telefonica', aspetto: 'una cabina telefonica grigia e arancione con i vetri, il telefono a gettoni e l’elenco appeso alla catenella',
    description: 'Una cabina telefonica a gettoni: si chiama casa, si chiama la radio, a volte risponde qualcuno che non aspettavi.', context: 'piazze, stazioni, lungomare', tags: ['telefono', 'metallo'],
    actions: [{ id: 'telefona', label: 'Telefona alla radio', requires: 'item.gettone' }, { id: 'elenco', label: 'Sfoglia l’elenco' }, { id: 'squilla', label: 'Aspetta che squilli' }],
    logic: `-- Cabina telefonica: un gettone per il quiz di Radio Ciok Ciok (la risposta giusta cambia ogni giorno, uguale per tutti);
-- l'elenco ha un nome sottolineato; di sera, a volte, squilla.
local M = {}
${HEAD}
function M.on_act(id, user, action)
  if action == "telefona" then
    inventory.remove(user, "item.gettone", 1)
    local g = ecs.get(id, "quiz")
    if g and g.giorno == giorno() then return "«Radio Ciok Ciok, hai già giocato oggi! Richiama domani, bonombo a domani!»" end
    ecs.set(id, "quiz", { giorno = giorno() })
    if hash(giorno(), id, 13) < 0.5 then
      dai(user, "Biglietto dello stadio", 1)
      return "«Radio Ciok Ciok, sei in onda! Quante gru ha il porto?» Tiri a indovinare: giusto! Domani il biglietto dello stadio te lo porta un fattorino. Anzi, eccolo: era nella cabina."
    end
    return "«Radio Ciok Ciok, sei in onda! Quante gru ha il porto?» Sbagliato, per una gru. Il conduttore ride e ti saluta: «Bonombo bonombo!»"
  end
  if action == "elenco" then
    return "L’elenco è consumato alla lettera F. Qualcuno ha sottolineato a penna un nome: «Fusco D., via dei Gelsi» e, accanto, un numero di interno della Torre C."
  end
  if action == "squilla" then
    if fase() == "sera" and hash(giorno(), id, 5) < 0.6 then
      return "Il telefono squilla. Rispondi. Una voce bassa: «Il camion parte a mezzanotte dal cantiere. Magazzino sette.» Poi riattacca."
    end
    return "Aspetti. Il telefono non squilla. Un ragazzo bussa al vetro: deve chiamare la fidanzata."
  end
  return nil
end

return M
` },
  { id: 'obj.cassonetto', name: 'Cassonetto', glyph: '▬', color: '#3a6a3a', model: 'cassonetto', aspetto: 'un cassonetto della spazzatura verde con il coperchio rotondo, le ruote e un sacco che sporge',
    description: 'Un cassonetto verde all’angolo della strada: dentro, quello che la città butta via.', context: 'angoli delle strade, retro dei bar e dei mercati', tags: ['rifiuti', 'metallo'],
    actions: [{ id: 'rovista', label: 'Rovista nel cassonetto' }, { id: 'butta', label: 'Butta un fusibile bruciato', requires: 'item.fusibile-bruciato' }],
    logic: `-- Cassonetto: una volta al giorno ci si trova qualcosa (scelto dal giorno e dal cassonetto); dentro ci si butta.
local M = {}
${HEAD}
local DENTRO = { "Fusibile bruciato", "Pezzo di ricambio", "Giornale del mattino", "Moneta da cento lire", "Cavo elettrico", "Lampadina" }

function M.on_act(id, user, action)
  if action == "rovista" then
    local r = ecs.get(id, "rovistato")
    if r and r.giorno == giorno() then return "Sacchi, bucce e cartoni. Per oggi hai già trovato quello che c’era." end
    ecs.set(id, "rovistato", { giorno = giorno() })
    local nome = DENTRO[math.floor(hash(id, giorno(), 3) * #DENTRO) + 1]
    dai(user, nome, 1)
    return "Sollevi il coperchio, trattieni il fiato e frughi: trovi " .. nome .. ". Un gatto ti guarda dal muretto, offeso."
  end
  if action == "butta" then
    inventory.remove(user, "item.fusibile-bruciato", 1)
    return "Il fusibile cade in fondo con un tintinnio. La città è un po’ più pulita."
  end
  return nil
end

return M
` },
];

for (const c of COSE) {
  mkdirSync(`${DIR}/${c.id}`, { recursive: true });
  const man = {
    id: c.id, name: c.name, kind: 'entity', version: '0.1.0', description: c.description, context: c.context, logic: 'logic.lua',
    appearance: { model: c.model, glyph: c.glyph, color: c.color, aspetto: c.aspetto },
    physics: { solid: true, radius: 0.42 },
    ...(c.components ? { components: c.components } : {}),
    ...(c.container ? { container: c.container } : {}),
    actions: c.actions, tags: ['neapolis', ...c.tags],
  };
  writeFileSync(`${DIR}/${c.id}/manifest.json`, JSON.stringify(man, null, 2) + '\n');
  writeFileSync(`${DIR}/${c.id}/logic.lua`, c.logic);
}

// Il sistema del quartiere: le parti del giorno, i lampioni e le insegne, il buio quando il cantiere stacca la corrente.
mkdirSync(`${DIR}/sys.quartiere`, { recursive: true });
writeFileSync(`${DIR}/sys.quartiere/manifest.json`, JSON.stringify({
  id: 'sys.quartiere', name: 'Il quartiere', kind: 'system', version: '0.1.0', order: 55, logic: 'logic.lua',
  description: 'La vita della città giorno per giorno: al tramonto si accendono lampioni e insegne, all’alba si spengono; certe notti il cantiere della Linea 2 stacca la corrente e il quartiere resta al buio finché qualcuno non cambia il fusibile alla cabina o non torna il mattino. Il buio lo leggono individui e cose.',
}, null, 2) + '\n');
writeFileSync(`${DIR}/sys.quartiere/logic.lua`, `-- Il quartiere: un'entità sola con il componente "quartiere" { buio, fase, giorno, riparato }.
-- Cambia qualcosa solo quando cambia la parte del giorno: i lampioni (tag lampione) e le insegne (tag insegna)
-- si accendono la sera e la notte se c'è corrente; certe notti (scelte dal giorno, uguali per tutti) va via la luce.
local M = {}

local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function accendi(acceso)
  ecs.each("luce, module", function(id, l, m)
    if world.has_tag(id, "lampione") or world.has_tag(id, "insegna") then
      l.accesa = acceso
    end
  end)
end

function M.update(dt)
  local q = ecs.first("quartiere")
  if not q then
    q = ecs.spawn({ quartiere = { buio = false, fase = "", giorno = -1, riparato = 0 } })
    if not q then return end
  end
  local s = ecs.get(q, "quartiere")
  if not s then return end
  local f = fase()
  local g = math.floor((time or 0) / 600 + 0.12)
  if s.fase == f and s.giorno == g and not s.ricontrolla then return end
  local buio = s.buio
  -- La notte comincia: certe notti il cantiere attacca le pompe e salta tutto. Il mattino rimette la corrente.
  if f == "notte" and s.fase ~= "notte" then buio = hash(g, 77) < 0.4 end
  if f == "mattina" then buio = false end
  ecs.set(q, "quartiere", { buio = buio, fase = f, giorno = g, riparato = s.riparato or 0 })
  accendi((f == "sera" or f == "notte") and not buio)
end

return M
`);
console.log(`${COSE.length} cose + sys.quartiere`);
