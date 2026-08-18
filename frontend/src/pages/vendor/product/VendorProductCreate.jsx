import ProductForm
  from "../../../components/admin/products/allProducts/ProductForm";


const VendorProductCreate = () => {
  return (
    <ProductForm
      mode="create"
      context="vendor"
    />
  );
};


export default VendorProductCreate;