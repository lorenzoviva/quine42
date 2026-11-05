-- Carro dell'elisir: dieci bottiglie per carro; a ogni domanda la venditrice dà una ragione diversa per comprarlo.
local M = {}
local VIRTU = {
  "«Fa crescere i baffi. Chiedetelo allo sceriffo.»",
  "«Toglie il mal di schiena a chi ha spinto i carrelli tutto il giorno.»",
  "«Calma i cavalli nervosi. Basta una goccia nell'abbeveratoio.»",
  "«Fa passare la tosse della polvere, e anche un po' la malinconia.»",
}

function M.on_act(id, user, action)
  local c = ecs.get(id, "carro") or { bottiglie = 10, domande = 0 }
  if action == "compra" then
    if c.bottiglie <= 0 then return "«Finite, tesoro. Torno con la luna nuova.»" end
    inventory.remove(user, "item.dollaro", 1)
    inventory.add(user, "item.elisir", 1)
    c.bottiglie = c.bottiglie - 1
    ecs.set(id, "carro", c)
    return "La venditrice ti dà una bottiglietta verde e ti fa l'occhiolino."
  elseif action == "annusa" then
    return "Liquirizia, menta e qualcosa che brucia il naso. Non è male."
  elseif action == "chiedi" then
    c.domande = c.domande + 1
    ecs.set(id, "carro", c)
    return VIRTU[(c.domande - 1) % #VIRTU + 1]
  end
  return nil
end

return M
