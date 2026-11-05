-- Pennone: una bandiera alla volta; la nera fa venire i doganieri a chiedere, la bianca chiede una tregua.
local M = {}

function M.on_act(id, user, action)
  local b = ecs.get(id, "bandiera") or { issata = "nessuna" }
  local testo
  if action == "issa_nera" then
    if b.issata == "nera" then return "La nera sventola già." end
    b.issata = "nera"
    testo = "La bandiera nera sale sul pennone. Al forte qualcuno punta un cannocchiale da questa parte."
  elseif action == "issa_bianca" then
    if b.issata == "bianca" then return "La bianca sventola già." end
    b.issata = "bianca"
    testo = "La bandiera bianca sale sul pennone: chi la vede sa che qui si tratta, non si spara."
  elseif action == "ammaina" then
    if b.issata == "nessuna" then return "Sul pennone non c'è niente da ammainare." end
    b.issata = "nessuna"
    testo = "Ammaini la bandiera e la ripieghi in quattro, come si fa."
  else
    return nil
  end
  ecs.set(id, "bandiera", b)
  return testo
end

return M
