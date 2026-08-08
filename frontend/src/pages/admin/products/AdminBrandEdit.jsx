import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";

import api
  from "../../../api/axios";

import BrandForm
  from "../../../components/admin/brands/BrandForm";


const AdminBrandEdit = () => {

  const { id } =
    useParams();

  const navigate =
    useNavigate();


  const [
    brand,
    setBrand,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD BRAND
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const fetchBrand =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await api.get(
              `/admin/brands/${id}`
            );


          setBrand(
            response.data.brand
          );

        } catch (error) {

          console.error(
            "Brand load error:",
            error
          );


          setError(
            error.response?.data
              ?.message ||
            "Unable to load brand."
          );

        } finally {

          setLoading(false);

        }

      };


    fetchBrand();

  }, [id]);


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (
      <div
        className="
          min-h-[calc(100vh-74px)]

          bg-[#f6f7f8]

          flex
          flex-col
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


        <p
          className="
            mt-3

            text-[13px]
            text-[#777]
          "
        >
          Loading brand...
        </p>

      </div>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !brand
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
            w-full
            max-w-[420px]

            rounded-[14px]

            border
            border-red-200

            bg-white

            p-6

            text-center
          "
        >

          <p
            className="
              text-[13px]
              text-red-600
            "
          >
            {error ||
              "Brand not found."}
          </p>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/products/brands"
              )
            }

            className="
              mt-4

              h-[36px]
              px-[14px]

              rounded-[8px]

              bg-[#2065D1]
              text-white

              inline-flex
              items-center
              gap-[6px]

              text-[12px]
            "
          >

            <ArrowLeft
              size={14}
            />

            Back to Brands

          </button>

        </div>

      </div>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  return (
    <BrandForm
      mode="edit"
      initialData={brand}
    />
  );

};


export default AdminBrandEdit;