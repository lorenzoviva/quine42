-- Xenobotanico: il dialogo segue la fiducia; chi porta soluzione nutritiva riceve semi, chi porta la runa Levis o Perielio una storia.
local M = {}

local function d(id)
  local v = ecs.get(id, "dialogo")
  if not v then v = { fase = 0, fiducia = 0 }; ecs.set(id, "dialogo", v) end
  return v
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "cupole" then
    v.fase = v.fase + 1
    if v.fase == 1 then return "«Le cupole tengono la pioggia fuori e l'umidità dentro. Ogni vasca è un campo, ogni campo è una famiglia di Sidera che mangia.»" end
    if v.fase == 2 then return "«L'acqua la vendono le compagnie, e ogni mese costa di più. Se non troviamo soluzione nutritiva a buon mercato, la cupola est chiude.»" end
    if inventory.count(user, "rune:orbita") > 0 then return "«Porti Perielio? Pronunciala sotto una cupola, una volta: la polvere che gira attorno a te sembra un piccolo cielo. Ai germogli piace.»" end
    return "«Torna quando vuoi: c'è sempre una vasca da pulire, e un frutto di vetro per chi la pulisce.»"
  end
  if action == "dona" then
    inventory.remove(user, items.find("Soluzione nutritiva"), 1)
    v.fiducia = v.fiducia + 2
    inventory.add(user, items.find("Semi di Serralta"), 3)
    return "Ti prende la tanica come fosse un tesoro. «Questa vale una settimana di vasche. Tieni: semi di Serralta, i migliori. Sanno crescere anche nella brina.»"
  end
  if action == "semi" then
    if v.fiducia < 2 then return "«I semi di Serralta non si regalano a chi passa. Portami qualcosa per le vasche, e ne parliamo.»" end
    local st = ecs.get(user, "stati")
    if st and st["alleggerito"] then return "Ride. «Sei leggero come un seme anche tu, oggi. Va' agli Orti Pensili: là la terra è buona e il vento porta i semi dove servono.»" end
    return "«Si seminano nella spugna delle vasche, uno per foro. Poi si aspetta, e si parla loro. Sì, parlare aiuta.»"
  end
end

return M
