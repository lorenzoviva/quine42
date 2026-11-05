-- Trivella: ogni perforazione scalda il radiatore; a tre si ferma finché non si raffredda.
local M = {}

function M.on_act(id, user, action)
  local t = ecs.get(id, "trivella") or { calore = 0, fori = 0 }
  if action == "perfora" then
    if t.calore >= 3 then return "Il radiatore è rovente: la trivella si rifiuta di partire." end
    inventory.remove(user, "item.cella-energia", 1)
    t.calore = t.calore + 1
    t.fori = t.fori + 1
    local n = 1 + math.floor(hash(id, t.fori) * 2)
    inventory.add(user, "item.minerale-ferro", n)
    ecs.set(id, "trivella", t)
    if n == 1 then return "La punta morde la roccia con un urlo. Esce un pezzo di minerale rossastro." end
    return "La punta morde la roccia con un urlo. Escono " .. n .. " pezzi di minerale rossastro."
  elseif action == "raffredda" then
    if t.calore <= 0 then return "Il radiatore è freddo." end
    t.calore = 0
    ecs.set(id, "trivella", t)
    return "Aspetti, seduto su un sasso. Il radiatore smette di ticchettare."
  elseif action == "controlla" then
    return "La punta ha fatto " .. t.fori .. " fori. Il radiatore è " .. (t.calore >= 3 and "rovente" or t.calore > 0 and "tiepido" or "freddo") .. "."
  end
  return nil
end

return M
