-- Bancone del saloon: si paga in dollari o si fa segnare; il conto resta sul bancone e il barista non lo dimentica.
local M = {}
local VOCI = {
  "«La diligenza di primavera è tornata senza cassa. I cavalli, però, avevano le selle in ordine.»",
  "«Il treno è in ritardo. Come sempre. Il capotreno dice che è colpa del vento.»",
  "«Al Canyon delle Aquile, di notte, si sente un fischio lungo. È il vento, dicono.»",
  "«La Mele vende un elisir per i baffi. Guardate quelli dello sceriffo, prima di ridere.»",
  "«Alla miniera hanno riaperto una galleria vecchia. La figlia di Abele ci passa le giornate.»",
}

function M.on_act(id, user, action)
  local c = ecs.get(id, "conto") or { debito = 0 }
  if action == "ordina" then
    inventory.remove(user, "item.dollaro", 1)
    inventory.add(user, "item.sarsaparilla", 1)
    return "Il barista fa scivolare la bottiglia lungo il bancone, dritta nella tua mano."
  elseif action == "fagioli" then
    inventory.remove(user, "item.dollaro", 1)
    inventory.add(user, "item.fagioli", 1)
    return "Dalla cucina arriva un piatto fumante di fagioli con un pezzo di pane di mais."
  elseif action == "ascolta" then
    return VOCI[math.floor(hash(id, math.floor(time / 30)) * #VOCI) + 1]
  elseif action == "segna" then
    if c.debito >= 3 then return "«Tre bottiglie segnate bastano, forestiero. Prima si salda.»" end
    c.debito = c.debito + 1
    ecs.set(id, "conto", c)
    inventory.add(user, "item.sarsaparilla", 1)
    return "Il barista incide una tacca sotto il bancone: ora sono " .. c.debito .. "."
  end
  return nil
end

return M
