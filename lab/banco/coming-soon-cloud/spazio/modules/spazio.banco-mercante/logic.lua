-- Banco del mercante: il prezzo del minerale cambia a ogni turno (il tempo diviso per turni, non l'orologio).
local M = {}
local UMORI = { "Il minerale va forte: chi arriva dalle gallerie oggi è ricco.", "Il minerale è sceso: ne è arrivato un carico intero stamattina.", "Celle d'energia introvabili: il mercante le tiene sotto il banco.", "Razioni a buon prezzo: le serre hanno fatto un raccolto grande." }

local function prezzo(id) return 1 + math.floor(hash(id, math.floor(time / 60)) * 3) end

function M.on_act(id, user, action)
  if action == "compra" then
    inventory.remove(user, "item.gettone", 1)
    inventory.add(user, "item.cella-energia", 1)
    return "Il mercante soffia sulla cella, la pulisce col gomito e te la mette in mano."
  elseif action == "vendi" then
    local n = prezzo(id)
    inventory.remove(user, "item.minerale-ferro", 1)
    inventory.add(user, "item.gettone", n)
    return "Il mercante soppesa il minerale e ti conta " .. n .. " gettoni sul banco."
  elseif action == "listino" then
    return UMORI[math.floor(hash(id, math.floor(time / 60), 3) * #UMORI) + 1] .. " Oggi il minerale vale " .. prezzo(id) .. " gettoni."
  end
  return nil
end

return M
