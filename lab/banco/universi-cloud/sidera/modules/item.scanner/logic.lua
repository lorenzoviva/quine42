-- Scanner portatile: legge ciò che ha davanti. Niente stato: tutto viene da ciò che si guarda e dal suolo.
local M = {}

local TERRE = {
  r = "Cristallo violetto: vibra appena, come una corda tesa. Freddo sotto lo zero.",
  k = "Basalto: duro, vecchio, bagnato fino al cuore.",
  s = "Sabbia vitrea: vetro macinato dal vento, migliaia di anni di vento.",
  w = "Acqua di canale: pioggia, ruggine, un filo d'olio dei motori.",
  o = "Acqua di mare: salata e fredda. Sotto, tetti e strade di prima della Mareggiata.",
  a = "Lamiera di relitto: una lega che le fonderie di Sidera non sanno rifare. Età: più di quanto lo scanner sappia contare.",
  v = "Plasma: lo scanner fischia e mostra un numero troppo alto per essere letto.",
  n = "Brina: freddo secco, l'aria qui pesa un poco di meno.",
}

local function davanti(user)
  local p = ecs.get(user, "pos")
  local pl = ecs.get(user, "player")
  if not p then return nil end
  local dx, dy = 0, 1
  if pl then
    if pl.facing == "up" then dx, dy = 0, -1 elseif pl.facing == "left" then dx, dy = -1, 0 elseif pl.facing == "right" then dx, dy = 1, 0 end
  end
  return p.x + dx, p.y + dy
end

function M.on_action(user, target, item)
  if target then
    if world.has_tag(target, "relitto") then
      return "Lo scanner ronza a lungo: «lega sconosciuta, età oltre la scala». Sullo schermo resta una riga verde che non si spegne."
    end
    if world.has_tag(target, "reattore") then
      return "Lo scanner segna caldo, molto caldo, e un battito regolare come un cuore. La Nonna sta bene."
    end
    if world.has_tag(target, "cristallo") or world.has_tag(target, "serra") then
      return "Lo scanner legge vita: cellule che si dividono piano, al ritmo della pioggia."
    end
    local m = ecs.get(target, "identity")
    if m then return "Lo scanner legge un corpo caldo, un cuore che batte un po' più svelto quando lo punti. Meglio abbassarlo." end
    return "Lo scanner legge lega comune, età di pochi anni, temperatura dell'aria."
  end
  local x, y = davanti(user)
  if not x then return "Lo scanner non trova niente da leggere." end
  local t = world.tile(x, y)
  return TERRE[t] or "Lo scanner legge asfalto bagnato, pioggia, e il ronzio lontano dei reattori."
end

function M.on_use(user, item)
  local p = ecs.get(user, "pos")
  if not p then return "Lo scanner resta muto." end
  local freddo, cristalli = 0, 0
  for dy = -2, 2 do
    for dx = -2, 2 do
      local t = world.tile(p.x + dx, p.y + dy)
      if t == "n" then freddo = freddo + 1 end
      if t == "r" then cristalli = cristalli + 1 end
    end
  end
  local st = ecs.get(user, "stati")
  if st and st["zavorrato"] then return "Lo scanner segna un peso in più addosso a te: Gravis tiene ancora." end
  if st and st["alleggerito"] then return "Lo scanner segna un peso in meno addosso a te: Levis tiene ancora." end
  if cristalli > 3 then return "Lo scanner segna una vibrazione nell'aria: i cristalli qui attorno risuonano, la forza interiore torna più in fretta." end
  if freddo > 3 then return "Lo scanner segna un freddo secco e l'aria più leggera: qui la brina si posa spesso." end
  return "Lo scanner segna pioggia, umidità alta, nessuna sorpresa."
end

return M
