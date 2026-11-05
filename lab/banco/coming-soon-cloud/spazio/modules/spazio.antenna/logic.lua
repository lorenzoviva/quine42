-- Antenna di trasmissione: ciò che si ascolta dipende da dove è girato il piatto.
local M = {}
local DIREZIONI = { "la Stazione Àncora", "l'Anello del Mercato", "le Gallerie di Talassa", "la Cometa dei Ghiacci" }
local VOCI = {
  "«Qui Àncora: il molo tre è libero, il molo cinque ha un portello inceppato.»",
  "«Qui Anello: oggi celle a buon prezzo, venite prima che finiscano.»",
  "«Qui Talassa: carrello fermo nella galleria nove, mandate una chiave inglese.»",
  "Dalla cometa arriva solo un fruscio, e ogni tanto un tintinnio come di ghiaccio che si spacca.",
}

function M.on_act(id, user, action)
  local a = ecs.get(id, "antenna") or { verso = 1 }
  if action == "punta" then
    a.verso = a.verso % #DIREZIONI + 1
    ecs.set(id, "antenna", a)
    return "Il piatto gira con un cigolio. Ora guarda verso " .. DIREZIONI[a.verso] .. "."
  elseif action == "ascolta" then
    return VOCI[a.verso]
  elseif action == "chiama" then
    if a.verso == 4 then return "Chiami la cometa. Nessuno risponde, naturalmente." end
    return "Chiami " .. DIREZIONI[a.verso] .. ". Una voce stanca risponde: «Ricevuto, viandante. Bonombo.»"
  end
  return nil
end

return M
