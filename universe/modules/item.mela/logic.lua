-- Mela: si mangia. Lo stato (quante ne hai) è nell'inventario, non qui.
local M = {}

function M.on_use(user, item)
  inventory.remove(user, item, 1)
  return "Croccante. Per un attimo il sapore si ripete, identico, come un'eco."
end

return M
