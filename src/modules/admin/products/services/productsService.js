import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export const getProducts = ({ page = 1, pageSize = 100 } = {}) =>
  apiClient.get(endpoints.products.list, { params: { page, pageSize } });
export const getProductMaterials = () => apiClient.get(endpoints.inventory.options);
export const getProductCategories = () => apiClient.get(endpoints.products.categories);
export const createProductCategory = (name) => apiClient.post(endpoints.products.categories, { name });
const toProductFormData = (data) => {
  const { imageFile, imagePreview, ...source } = data;
  const configuration = {
    ...source,
    categoryId: Number(source.categoryId),
    sizes: (source.sizes || []).map(({ costPrice, profit, profitMargin, finalPrice, ...size }) => ({
      ...size,
      sellingPrice: Number(size.sellingPrice),
      ingredients: (size.ingredients || []).map((row) => ({
        ...row,
        rawMaterialId: Number(row.rawMaterialId),
        quantity: Number(row.quantity),
      })),
    })),
    addons: (source.addons || []).map((addon) => ({ ...addon, price: Number(addon.price) })),
  };
  const formData = new FormData();
  formData.append("configuration", JSON.stringify(configuration));
  if (imageFile) formData.append("image", imageFile);
  return formData;
};

const multipartOptions = { headers: { "Content-Type": "multipart/form-data" } };

export const createProductConfiguration = (data) =>
  apiClient.post(endpoints.products.configuration, toProductFormData(data), multipartOptions);
export const updateProductConfiguration = (id, data) =>
  apiClient.put(endpoints.products.configurationById(id), toProductFormData(data), multipartOptions);
export const deleteProduct = (id) => apiClient.delete(endpoints.products.byId(id));
