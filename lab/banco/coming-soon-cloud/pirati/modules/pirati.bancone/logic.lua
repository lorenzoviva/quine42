-- Bancone della taverna: si paga in dobloni o si fa segnare; il conto resta sul bancone e l'oste non lo dimentica.
local M = {}
local VOCI = {
  "«La Gabbiana è affondata con le stive piene, e nessuno ha mai trovato una sola botte.»",
  "«Il comandante del forte conta le botti due volte. Dice che il mare non fa figli.»",
  "«Alle grotte, con la bassa marea, si arriva a piedi. Con l'alta, solo in scialuppa.»",
  "«Un pappagallo del villaggio dei coralli sa dire il nome di una nave che nessuno ricorda.»",
  "«Ezechiele vende mappe vere e mappe false: le vere costano il doppio.»",
}

local function conto(id) return ecs.get(id, "conto") or { debito = 0 } end

function M.on_act(id, user, action)
  local c = conto(id)
  if action == "ordina" then
    inventory.remove(user, "item.doblone", 1)
    inventory.add(user, "item.rum", 1)
    return "L'oste ti versa un rum scuro e spinge la moneta nel cassetto."
  elseif action == "ascolta" then
    return VOCI[math.floor(hash(id, math.floor(time / 30)) * #VOCI) + 1]
  elseif action == "segna" then
    if c.debito >= 3 then return "«Tre rum segnati bastano, viandante. Prima si salda.»" end
    c.debito = c.debito + 1
    inventory.add(user, "item.rum", 1)
    ecs.set(id, "conto", c)
    return "L'oste incide una tacca sul bancone: ora sono " .. c.debito .. "."
  elseif action == "salda" then
    if c.debito <= 0 then return "«Non mi devi niente. Torna quando vuoi.»" end
    inventory.remove(user, "item.doblone", 1)
    c.debito = c.debito - 1
    ecs.set(id, "conto", c)
    return "L'oste raschia via una tacca con il coltello."
  end
  return nil
end

return M
