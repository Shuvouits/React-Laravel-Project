import {
  useState,
} from "react";

import {
  Plus,
  X,
} from "lucide-react";


const ProductOrganization = ({
  form,
  updateField,

  categories = [],
  brands = [],
  collections = [],
}) => {

  const [
    tagInput,
    setTagInput,
  ] = useState("");


  const addTag = () => {
    const value =
      tagInput.trim();

    if (!value) {
      return;
    }

    if (
      form.tags.some(
        (tag) =>
          tag.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      setTagInput("");
      return;
    }

    updateField(
      "tags",
      [
        ...form.tags,
        value,
      ]
    );

    setTagInput("");
  };


  const toggleCollection = (
    collectionId
  ) => {
    const id =
      Number(collectionId);

    const exists =
      form.collection_ids
        .map(Number)
        .includes(id);

    updateField(
      "collection_ids",
      exists
        ? form.collection_ids.filter(
            (item) =>
              Number(item) !== id
          )
        : [
            ...form.collection_ids,
            id,
          ]
    );
  };


  return (
    <div
      className="
        rounded-[15px]

        border
        border-[#dedfe2]

        bg-white

        p-[20px]

        shadow-[0_2px_7px_rgba(0,0,0,0.035)]
      "
    >

      <h2
        className="
          mb-[17px]

          text-[15px]
          font-bold
        "
      >
        Organization
      </h2>


      {/* CATEGORY */}

      <FieldLabel required>
        Category
      </FieldLabel>

      <select
        value={
          form.category_id
        }

        onChange={(event) =>
          updateField(
            "category_id",
            event.target.value
          )
        }

        className="
          w-full
          h-[39px]

          rounded-[11px]

          border
          border-[#dedfe2]

          bg-white

          px-[12px]

          text-[13px]

          outline-none
        "
      >

        <option value="">
          Select category
        </option>

        {categories.map(
          (category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          )
        )}

      </select>


      {/* BRAND */}

      <FieldLabel>
        Brand
      </FieldLabel>

      <select
        value={
          form.brand_id
        }

        onChange={(event) =>
          updateField(
            "brand_id",
            event.target.value
          )
        }

        className="
          w-full
          h-[39px]

          rounded-[11px]

          border
          border-[#dedfe2]

          bg-white

          px-[12px]

          text-[13px]

          outline-none
        "
      >

        <option value="">
          No brand
        </option>

        {brands.map(
          (brand) => (
            <option
              key={brand.id}
              value={brand.id}
            >
              {brand.name}
            </option>
          )
        )}

      </select>


      {/* TYPE */}

      <FieldLabel>
        Type
      </FieldLabel>

      <input
        value={form.type}

        onChange={(event) =>
          updateField(
            "type",
            event.target.value
          )
        }

        placeholder="Type"

        className="
          w-full
          h-[39px]

          rounded-[11px]

          border
          border-[#dedfe2]

          px-[12px]

          text-[13px]

          outline-none
        "
      />


      {/* COLLECTIONS */}

      <FieldLabel>
        Collections
      </FieldLabel>

      <div
        className="
          rounded-[11px]

          border
          border-[#dedfe2]

          p-[8px]

          max-h-[180px]
          overflow-y-auto
        "
      >

        {collections.length ===
        0 ? (

          <p
            className="
              p-2

              text-[11px]
              text-[#888]
            "
          >
            No collections available.
          </p>

        ) : (

          collections.map(
            (collection) => {

              const selected =
                form.collection_ids
                  .map(Number)
                  .includes(
                    Number(
                      collection.id
                    )
                  );


              return (
                <button
                  key={
                    collection.id
                  }

                  type="button"

                  onClick={() =>
                    toggleCollection(
                      collection.id
                    )
                  }

                  className={`
                    w-full

                    rounded-[8px]

                    px-[9px]
                    py-[8px]

                    flex
                    items-center
                    justify-between

                    text-left
                    text-[12px]

                    ${
                      selected
                        ? "bg-[#edf4ff] text-[#2065D1]"
                        : "hover:bg-[#f6f7f8]"
                    }
                  `}
                >

                  <span>
                    {
                      collection.title
                    }
                  </span>

                  {selected && (
                    <span
                      className="
                        text-[10px]
                        font-semibold
                      "
                    >
                      Selected
                    </span>
                  )}

                </button>
              );

            }
          )

        )}

      </div>


      {/* TAGS */}

      <div
        className="
          mt-[19px]

          pt-[17px]

          border-t
          border-[#e6e7e9]
        "
      >

        <FieldLabel
          noMargin
        >
          Tags
        </FieldLabel>


        <div
          className="
            mt-[8px]

            flex
            gap-[7px]
          "
        >

          <input
            value={tagInput}

            onChange={(event) =>
              setTagInput(
                event.target.value
              )
            }

            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();
                addTag();
              }
            }}

            placeholder="Add tag"

            className="
              min-w-0
              flex-1

              h-[38px]

              rounded-[11px]

              border
              border-[#dedfe2]

              px-[12px]

              text-[12px]

              outline-none
            "
          />


          <button
            type="button"

            onClick={addTag}

            className="
              w-[38px]
              h-[38px]

              rounded-full

              border
              border-[#dedfe2]

              flex
              items-center
              justify-center
            "
          >
            <Plus size={15} />
          </button>

        </div>


        {form.tags.length > 0 && (

          <div
            className="
              mt-[10px]

              flex
              flex-wrap
              gap-[6px]
            "
          >

            {form.tags.map(
              (tag) => (
                <span
                  key={tag}
                  className="
                    rounded-full

                    bg-[#f1f2f4]

                    px-[9px]
                    py-[5px]

                    flex
                    items-center
                    gap-[5px]

                    text-[10px]
                  "
                >

                  {tag}

                  <button
                    type="button"

                    onClick={() =>
                      updateField(
                        "tags",
                        form.tags.filter(
                          (item) =>
                            item !== tag
                        )
                      )
                    }
                  >
                    <X size={11} />
                  </button>

                </span>
              )
            )}

          </div>

        )}

      </div>

    </div>
  );
};


const FieldLabel = ({
  children,
  required = false,
  noMargin = false,
}) => (
  <label
    className={`
      block

      ${
        noMargin
          ? ""
          : "mt-[15px]"
      }

      mb-[7px]

      text-[12px]
      font-medium
    `}
  >
    {children}
    {required ? " *" : ""}
  </label>
);


export default ProductOrganization;