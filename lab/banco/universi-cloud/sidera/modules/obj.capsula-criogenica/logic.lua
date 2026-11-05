-- Capsula criogenica: il freddo cala col tempo e si rabbocca col siero; chi riposa in una capsula vuota si ristora.
local M = {}

local NOMI = { "Novak", "Serra", "Lindqvist", "Okafor", "Baldi", "Moreau" }

local function c(id)
  local v = ecs.get(id, "capsula")
  if not v then v = { freddo = 80, visite = 0 }; ecs.set(id, "capsula", v) end
  return v
end

local function piena(id) return hash(id, 21) < 0.7 end

function M.on_act(id, user, action)
  local v = c(id)
  if action == "registro" then
    if not piena(id) then return "Il registro è vuoto: la capsula aspetta qualcuno. Freddo " .. math.floor(v.freddo) .. "." end
    local nome = NOMI[math.floor(hash(id, 22) * #NOMI) + 1]
    local anni = 3 + math.floor(hash(id, 23) * 70)
    return "Sotto la brina si legge un cognome, " .. nome .. ", e una data di ingresso di " .. anni .. " anni fa. Freddo " .. math.floor(v.freddo) .. "."
  end
  if action == "rabbocca" then
    inventory.remove(user, items.find("Siero criogenico"), 1)
    v.freddo = math.min(100, v.freddo + 30)
    return "Il siero azzurro scende nel circuito; la brina sul vetro si fa più spessa e bianca."
  end
  if action == "riposa" then
    if piena(id) then return "La capsula è occupata: dentro qualcuno dorme da molto tempo. Non la si apre." end
    local n = ecs.get(user, "needs")
    if n then
      n.energy = 100
      n.health = math.min(100, n.health + 20)
    end
    v.visite = v.visite + 1
    return "Ti stendi nel guscio freddo. Un sonno senza sogni, lento come la brina: ti svegli riposato e intirizzito."
  end
  if action == "parla" then
    if not piena(id) then return "Parli a una capsula vuota. La tua voce torna indietro dal vetro." end
    v.visite = v.visite + 1
    if v.visite > 3 then return "Il dormiente non risponde, ma sul vetro la brina disegna un alone dove hai appoggiato la mano." end
    return "Racconti al dormiente che fuori piove ancora. Il respiro dietro il vetro, lentissimo, non cambia."
  end
end

function M.on_spawn(id)
  local v = c(id)
  v.freddo = 50 + math.floor(hash(id, 5) * 50)
end

return M
