import {
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../../api/axios";

import ProductForm
  from "../../../components/admin/products/allProducts/ProductForm";


const VendorEditProduct = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [
    product,
    setProduct,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    loadProduct();
  }, [id]);


  const loadProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/vendor/products/${id}`
        );

      const productData =
        response.data?.product ||
        null;

      if (!productData) {
        throw new Error(
          "Product data not found."
        );
      }

      setProduct(
        productData
      );

    } catch (error) {
      console.error(
        "Vendor product load error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load product."
      );

    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div
        className="
          min-h-[calc(100vh-74px)]

          bg-[#f6f7f8]

          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-3
          "
        >
          <LoaderCircle
            size={30}
            className="
              animate-spin
              text-[#2065D1]
            "
          />

          <p
            className="
              text-[12px]
              text-[#777]
            "
          >
            Loading product...
          </p>
        </div>
      </div>
    );
  }


  if (
    error ||
    !product
  ) {
    return (
      <div
        className="
          min-h-[calc(100vh-74px)]

          bg-[#f6f7f8]

          px-5

          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            w-full
            max-w-[420px]

            rounded-[14px]

            border
            border-[#dedfe2]

            bg-white

            p-6

            text-center
          "
        >
          <h2
            className="
              text-[17px]
              font-semibold
              text-[#222]
            "
          >
            Unable to load product
          </h2>

          <p
            className="
              mt-2

              text-[12px]
              leading-5

              text-[#777]
            "
          >
            {error ||
              "Product not found."}
          </p>

          <button
            type="button"

            onClick={() =>
              navigate(
                "/vendor/products"
              )
            }

            className="
              mt-5

              h-[38px]

              rounded-[9px]

              bg-[#2065D1]

              px-5

              text-[12px]
              font-semibold
              text-white
            "
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }


  return (
    <ProductForm
      mode="edit"
      context="vendor"
      initialData={product}
    />
  );
};


export default VendorEditProduct;