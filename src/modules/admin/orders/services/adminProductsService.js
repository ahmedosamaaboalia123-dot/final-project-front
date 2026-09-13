import { productsApi } from "@/modules/admin/products/api/products.api";
let cache = null; let inFlight = null; const TTL = 30_000;
const normalize = (data) => ({ categories: data.categories || [], materials: [], products: (data.products || []).map((p) => ({ ...p, categoryId: p.category?.id, variants: (p.types || []).map((t) => ({ id: t.id, type: t.name, sizes: (t.sizes || []).map((s) => ({ ...s, sellingPrice: s.price })) })) })) });
export async function getProductCatalog({ force = false } = {}) { if (!force && cache && Date.now() - cache.at < TTL) return cache.value; if (inFlight) return inFlight; inFlight = productsApi.catalog({ page: 1, limit: 10 }).then(normalize).then((value) => { cache = { value, at: Date.now() }; return value; }).finally(() => { inFlight = null; }); return inFlight; }
export const getProductSections = async () => (await getProductCatalog()).categories;
export function getProductsForSection(products, section) { const id = String(section?.id ?? section ?? ""); return (products || []).filter((p) => String(p.categoryId ?? p.category?.id) === id); }
export const buildMaterialsLookup = () => new Map();
export const enrichOrderItemMaterials = (order) => order;
export const getAllMaterialsMapped = (products, materials) => ({ lookup: buildMaterialsLookup(products, materials), sections: [] });
