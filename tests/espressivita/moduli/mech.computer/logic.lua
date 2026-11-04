-- Un terminale degli anni 90 con quello che un pannello offre: quattro righe di testo e quattro tasti.
-- Niente tastiera: i file si scelgono, non si scrivono.
local M = {}
local FILE = {
  { nome = "LEGGIMI.TXT", righe = { "Benvenuto in QDOS 2.1", "640K bastano a tutti", "", "ESC per uscire" } },
  { nome = "BILANCIO.DAT", righe = { "Grano: 1200", "Sale: 88", "Debiti: troppi", "" } },
  { nome = "SCACCHI.EXE", gioco = true },
}

local function disegna(s)
  if s.aperto then
    local f = FILE[s.aperto]
    if f.gioco then
      s.r1, s.r2, s.r3, s.r4 = "Tiri un dado col computer:", "Tu " .. s.tu .. "  lui " .. s.lui, s.tu > s.lui and "HAI VINTO" or "HA VINTO LUI", "INVIO per rigiocare"
    else
      s.r1, s.r2, s.r3, s.r4 = f.righe[1], f.righe[2], f.righe[3], f.righe[4]
    end
    return
  end
  local righe = { "C:\\>DIR", "", "", "" }
  for i, f in ipairs(FILE) do righe[i + 1] = (i == s.cursore and "> " or "  ") .. f.nome end
  s.r1, s.r2, s.r3, s.r4 = righe[1], righe[2], righe[3], righe[4]
end

function M.on_ui(user, azione)
  if not ecs.get(user, "schermo") then ecs.set(user, "schermo", { cursore = 1, tu = 0, lui = 0 }) end
  local s = ecs.get(user, "schermo")
  if azione == "su" then s.cursore = math.max(1, s.cursore - 1)
  elseif azione == "giu" then s.cursore = math.min(#FILE, s.cursore + 1)
  elseif azione == "esc" then s.aperto = nil
  elseif azione == "invio" then
    s.aperto = s.cursore
    s.tu, s.lui = math.random(1, 6), math.random(1, 6)
  end
  disegna(s)
  return nil
end

function M.update(dt) end

return M
