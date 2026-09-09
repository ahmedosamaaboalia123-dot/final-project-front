import apiClient from "@/services/apiClient";

const CATALOG = { products: [], categories: [], materials: [] };
let catalogPromise = null;
let materialsPromise = null;
let recipeCatalogLoaded = false;

/**
 * Fetch the admin product catalog (products, categories, raw materials) once.
 * Used by the sales page and the preparation pages.
 */
export async function getProductCatalog({ force = false, includeMaterials = false } = {}) {
  const loadCatalog = async () => {
    if (!force && CATALOG.products.length) return;
    if (!force && catalogPromise) return catalogPromise;
    catalogPromise = apiClient.get("/products/pos-catalog").then((catalogRes) => {
    const catalog = catalogRes.data || catalogRes;
    CATALOG.products = catalog.products || [];
    CATALOG.categories = catalog.categories || [];
    }).finally(() => { catalogPromise = null; });
    return catalogPromise;
  };
  await loadCatalog();
  if (includeMaterials && (force || !recipeCatalogLoaded)) {
    if (!materialsPromise) materialsPromise = Promise.all([
      apiClient.get("/products", { params: { page: 1, pageSize: 100 } }),
      apiClient.get("/raw-materials/options"),
    ]).then(([productsResponse, materialsResponse]) => {
      CATALOG.products = Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data?.data || [];
      CATALOG.materials = Array.isArray(materialsResponse.data) ? materialsResponse.data : materialsResponse.data?.data || [];
      recipeCatalogLoaded = true;
    }).finally(() => { materialsPromise = null; });
    await materialsPromise;
  }
  return CATALOG;
}

/**
 * List of product sections (categories).
 */
export async function getProductSections() {
  const catalog = await getProductCatalog();
  return catalog.categories;
}

/**
 * Products belonging to the given section (by categoryId).
 * Falls back to the category name string when ids are unavailable.
 */
export function getProductsForSection(products, section) {
  if (!section) return [];
  const byId = Number(section.id || section);
  return products.filter((p) => {
    const catId = Number(p.categoryId || p.categoryRef?.id || p.category?.id);
    const catName = p.categoryRef?.name || p.category?.name || p.category;
    return (byId && catId === byId) || (section.name && catName === section.name);
  });
}

/**
 * Build a lookup map productSizeId -> [{ name, unit, quantity }].
 * Raw material names are resolved from the raw-materials list.
 */
export function buildMaterialsLookup(products, materials) {
  const materialName = new Map(materials.map((m) => [Number(m.id), m]));
  const lookup = new Map();
  products.forEach((product) => {
    (product.sizes || []).forEach((size) => {
      const key = Number(size.id || size.productSizeId || size._id);
      if (!key) return;
      const rows = (size.ingredients || []).map((ing) => {
        const material = materialName.get(Number(ing.rawMaterialId));
        return {
          name: material?.name || ing.name || `مادة #${ing.rawMaterialId}`,
          unit: ing.unit || material?.unit || "",
          quantity: Number(ing.quantity) || 0,
        };
      });
      if (rows.length) lookup.set(key, rows);
    });
  });
  return lookup;
}

/**
 * Attach material rows to each order item.
 * Item -> item.materials = [{ name, unit, quantity }]
 */
export function enrichOrderItemMaterials(order, lookup) {
  if (!order || !Array.isArray(order.items)) return order;
  return {
    ...order,
    items: order.items.map((item) => {
      const key = Number(item.productSizeId || item.productSize?.id || item.sizeId);
      return { ...item, materials: lookup.get(key) || [] };
    }),
  };
}

export function getAllMaterialsMapped(products, materials) {
  const catalog = { products, materials };
  return {
    lookup: buildMaterialsLookup(products, materials),
    sections: catalog.categories || [],
  };
}
