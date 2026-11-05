-- Postazione d'ufficio: l'archivio si apre un cassetto alla volta (componente "archivio"); nell'ultimo c'è la busta
-- gialla delle pratiche della Linea 2. Il telefono squilla a vuoto, o qualcuno risponde, secondo l'ora.
local M = {}
-- La parte del giorno, come la conta il kernel (un giorno dura 600 secondi).
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
