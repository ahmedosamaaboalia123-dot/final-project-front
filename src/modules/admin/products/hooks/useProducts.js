import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProductCategory,
  createProductConfiguration,
  deleteProduct,
  getProductCategories,
  getProductMaterials,
  getProducts,
  updateProductConfiguration,
} from "../services/productsService";

const queryKey = ["admin-products-configuration"];

export default function useProducts() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const [products, materials, categories] = await Promise.all([
        getProducts(), getProductMaterials(), getProductCategories(),
      ]);
      return {
        products: products.data || [],
        materials: materials.data || [],
        categories: categories.data || [],
      };
    },
  });
  const refresh = () => client.invalidateQueries({ queryKey });
  const categoryMutation = useMutation({ mutationFn: createProductCategory, onSuccess: refresh });
  const saveMutation = useMutation({
    mutationFn: (form) => form.id
      ? updateProductConfiguration(form.id, form)
      : createProductConfiguration(form),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({ mutationFn: deleteProduct, onSuccess: refresh });
  return {
    products: query.data?.products || [],
    materials: query.data?.materials || [],
    categories: query.data?.categories || [],
    query, categoryMutation, saveMutation, deleteMutation,
  };
}
