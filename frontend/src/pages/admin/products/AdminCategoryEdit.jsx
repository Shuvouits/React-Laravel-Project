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

import api from "../../../api/axios";

import CategoryForm
  from "../../../components/admin/categories/CategoryForm";


const AdminCategoryEdit = () => {

  const { id } =
    useParams();


  const navigate =
    useNavigate();


  const [
    category,
    setCategory,
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
  | FETCH CATEGORY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const fetchCategory =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await api.get(
              `/admin/categories/${id}`
            );


          setCategory(
            response.data
              ?.category ||
            null
          );

        } catch (error) {

          console.error(
            "Category load error:",
            error
          );


          setError(
            error.response?.data
              ?.message ||
            "Unable to load category."
          );

        } finally {

          setLoading(false);

        }

      };


    fetchCategory();

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
          Loading category...
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
    !category
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

            bg-white

            border
            border-red-200

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
              "Category not found."}
          </p>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/products/categories"
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

            Back to Categories

          </button>

        </div>

      </div>
    );

  }


  return (
    <CategoryForm
      mode="edit"

      initialData={
        category
      }
    />
  );

};


export default AdminCategoryEdit;