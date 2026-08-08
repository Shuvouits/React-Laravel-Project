import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  LoaderCircle,
} from "lucide-react";

import api
  from "../../../../api/axios";

import ProductForm
  from "../../../../components/admin/products/allProducts/ProductForm";

import {
  PRODUCT_API,
  PRODUCT_ROUTES,
} from "../../../../components/admin/products/allProducts/productConfig";


const AdminProductEdit = () => {

  const { id } =
    useParams();

  const navigate =
    useNavigate();


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

    const load =
      async () => {

        try {

          setLoading(true);
          setError("");


          const response =
            await api.get(
              PRODUCT_API.show(id)
            );


          setProduct(
            response.data
              ?.product ||
            null
          );

        } catch (error) {

          setError(
            error.response?.data
              ?.message ||
            "Unable to load product."
          );

        } finally {

          setLoading(false);

        }

      };


    load();

  }, [id]);


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
        <LoaderCircle
          size={30}
          className="
            animate-spin
            text-[#2065D1]
          "
        />
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

          flex
          items-center
          justify-center
        "
      >

        <div
          className="
            rounded-[14px]

            bg-white

            border
            border-[#ddd]

            p-6

            text-center
          "
        >

          <p
            className="
              text-[12px]
              text-red-500
            "
          >
            {error ||
              "Product not found."}
          </p>


          <button
            type="button"

            onClick={() =>
              navigate(
                PRODUCT_ROUTES.index
              )
            }

            className="
              mt-4

              rounded-[8px]

              bg-[#2065D1]
              text-white

              px-4
              py-2

              text-[11px]
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

      initialData={
        product
      }
    />
  );
};


export default AdminProductEdit;