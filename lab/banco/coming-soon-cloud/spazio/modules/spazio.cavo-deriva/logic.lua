-- Cavo di deriva: agganciato, il passo si fa lungo e leggero (uno stato del viandante); sganciato, torna il peso.
local M = {}

function M.on_act(id, user, action)
  local c = ecs.get(id, "cavo") or { agganciati = 0, tirate = 0 }
  local st = ecs.get(user, "stati") or {}
  if action == "aggancia" then
    if st.deriva then return "Sei già agganciato: il moschettone è chiuso." end
    st.deriva = { velocita = 1.4, peso = 0, luce = 0, fino = 0 }
    ecs.set(user, "stati", st)
    c.agganciati = c.agganciati + 1
    ecs.set(id, "cavo", c)
    return "Chiudi il moschettone sulla cintura. Il corpo si fa lieve, ogni passo diventa un balzo lungo."
  elseif action == "sgancia" then
    if not st.deriva then return "Non sei agganciato a niente." end
    st.deriva = nil
    ecs.set(user, "stati", st)
    return "Apri il moschettone: il peso torna tutto in una volta, nelle ginocchia."
  elseif action == "tira" then
    c.tirate = c.tirate + 1
    ecs.set(id, "cavo", c)
    if c.tirate % 3 == 0 then return "Il cavo vibra tre volte: dall'altro capo qualcuno risponde al saluto." end
    return "Il cavo si tende e torna morbido. Regge."
  end
  return nil
end

return M
