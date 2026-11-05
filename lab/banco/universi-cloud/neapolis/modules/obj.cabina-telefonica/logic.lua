-- Cabina telefonica: un gettone per il quiz di Radio Ciok Ciok (la risposta giusta cambia ogni giorno, uguale per tutti);
-- l'elenco ha un nome sottolineato; di sera, a volte, squilla.
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
