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

import api from "../../../../api/axios";

import CollectionForm
  from "../../../../components/admin/products/collections/CollectionForm";

import {
  COLLECTION_API,
  COLLECTION_ROUTES,
} from "../../../../components/admin/products/collections/collectionConfig";


const AdminCollectionEdit = () => {

  const { id } =
    useParams();


  const navigate =
    useNavigate();


  const [
    collection,
    setCollection,
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

    const loadCollection =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await api.get(
              COLLECTION_API.show(
                id
              )
            );


          setCollection(
            response.data
              ?.collection ||
            null
          );

        } catch (error) {

          setError(
            error.response?.data
              ?.message ||
            "Unable to load collection."
          );

        } finally {

          setLoading(false);

        }

      };


    loadCollection();

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
    !collection
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

            border
            border-red-200

            bg-white

            p-6

            text-center
          "
        >

          <p
            className="
              text-[12px]
              text-red-600
            "
          >
            {error ||
              "Collection not found."}
          </p>


          <button
            type="button"

            onClick={() =>
              navigate(
                COLLECTION_ROUTES.index
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
            Back to Collections
          </button>

        </div>

      </div>
    );

  }


  return (
    <CollectionForm
      mode="edit"

      initialData={
        collection
      }
    />
  );

};


export default AdminCollectionEdit;