import {
  useRef,
  useState,
} from "react";

import {
  EyeOff,
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";

import BrandAITexterPopup
  from "../../brands/BrandAITexterPopup";

import {
  slugify,
} from "./collectionConfig";


const CollectionSEO = ({
  form,
  setForm,

  generateAI,
  aiLoading,

  slugEdited,
  setSlugEdited,

  seoTitleEdited,
  setSeoTitleEdited,

  metaEdited,
  setMetaEdited,
}) => {

  const [
    visible,
    setVisible,
  ] = useState(true);

  const [
    aiOpen,
    setAiOpen,
  ] = useState(false);

  const [
    prompt,
    setPrompt,
  ] = useState("");

  const [
    tone,
    setTone,
  ] = useState("default");

  const [
    toneOpen,
    setToneOpen,
  ] = useState(false);

  const wrapperRef =
    useRef(null);


  const previewTitle =
    form.seo_title ||
    form.title ||
    "Untitled Collection";


  const previewDescription =
    form.seo_description ||
    form.description ||
    "No description available.";


  const runAI =
    async (
      customPrompt = ""
    ) => {

      const success =
        await generateAI({
          target: "seo",
          prompt:
            customPrompt,
          tone,
        });


      if (success) {

        setSeoTitleEdited(true);
        setMetaEdited(true);
        setSlugEdited(true);

        setAiOpen(false);

      }

    };


  return (
    <div
      ref={wrapperRef}

      className="
        relative

        rounded-[15px]

        border
        border-[#dedfe2]

        bg-white

        shadow-[0_2px_7px_rgba(0,0,0,0.035)]

        overflow-visible
      "
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        className="
          px-[18px]
          py-[15px]

          border-b
          border-[#e4e5e8]

          flex
          items-start
          justify-between
        "
      >

        <div>

          <h2
            className="
              text-[15px]
              font-bold
            "
          >
            Search Engine Listing
          </h2>


          <p
            className="
              mt-[2px]

              text-[12px]
              text-[#777]
            "
          >
            Auto-filled from title & excerpt. Customize to override.
          </p>

        </div>


        <div
          className="
            flex
            items-center
            gap-[8px]
          "
        >

          <button
            type="button"

            onClick={() =>
              setAiOpen(
                (prev) =>
                  !prev
              )
            }

            className="
              w-[29px]
              h-[29px]

              rounded-[7px]

              bg-gradient-to-br
              from-[#ff53c7]
              via-[#ae65ff]
              to-[#39d9e6]

              text-white

              flex
              items-center
              justify-center
            "
          >

            {aiLoading ===
            "seo" ? (

              <LoaderCircle
                size={13}
                className="
                  animate-spin
                "
              />

            ) : (

              <Sparkles
                size={14}
              />

            )}

          </button>


          <button
            type="button"

            onClick={() =>
              setVisible(
                (prev) =>
                  !prev
              )
            }

            className="
              h-[32px]
              px-[11px]

              rounded-[7px]

              border
              border-[#dedfe2]

              bg-white

              flex
              items-center
              gap-[6px]

              text-[11px]
              text-[#666]
            "
          >

            <EyeOff size={13} />

            {visible
              ? "Hide SEO"
              : "Show SEO"}

          </button>

        </div>

      </div>


      {/* =====================================================
          AI POPUP
      ====================================================== */}

      {aiOpen && (

        <BrandAITexterPopup
          prompt={prompt}
          setPrompt={setPrompt}

          tone={tone}
          setTone={setTone}

          toneOpen={toneOpen}
          setToneOpen={
            setToneOpen
          }

          placeholder="Describe the SEO you want - keywords to target, tone, focus..."

          loading={
            aiLoading === "seo"
          }

          onGenerate={() =>
            runAI(prompt)
          }

          onAutoGenerate={() =>
            runAI("")
          }

          className="
            top-[68px]
            right-[18px]
          "
        />

      )}


      {/* =====================================================
          SEO BODY
      ====================================================== */}

      {visible && (

        <div
          className="
            p-[18px]
          "
        >

          {/* GOOGLE PREVIEW */}

          <div
            className="
              rounded-[12px]

              border
              border-[#dedfe2]

              bg-[#f7f7f8]

              p-[16px]
            "
          >

            <p
              className="
                text-[12px]
                font-semibold
              "
            >
              Storify
            </p>


            <p
              className="
                mt-[2px]

                text-[11px]
                text-[#6f7379]
              "
            >
              {window.location.host}
              {" › collections › "}
              {form.slug ||
                "collection-handle"}
            </p>


            <p
              className="
                mt-[4px]

                text-[16px]
                text-[#1a0dab]
              "
            >
              {previewTitle}
            </p>


            <p
              className="
                mt-[4px]

                text-[12px]
                leading-[1.5]

                text-[#666]
              "
            >
              {previewDescription}
            </p>

          </div>


          {/* PAGE TITLE */}

          <label
            className="
              block

              mt-[18px]
              mb-[7px]

              text-[12px]
              font-medium
            "
          >
            Page title
          </label>


          <input
            value={
              form.seo_title
            }

            maxLength={70}

            onChange={(e) => {

              setSeoTitleEdited(
                true
              );


              setForm(
                (prev) => ({
                  ...prev,

                  seo_title:
                    e.target.value,
                })
              );

            }}

            className="
              w-full
              h-[38px]

              rounded-[11px]

              border
              border-[#dedfe2]

              px-[12px]

              text-[13px]

              outline-none

              focus:border-[#2065D1]
            "
          />


          <Counter
            current={
              form.seo_title.length
            }
            max={70}
          />


          {/* META */}

          <label
            className="
              block

              mt-[16px]
              mb-[7px]

              text-[12px]
              font-medium
            "
          >
            Meta description
          </label>


          <textarea
            value={
              form.seo_description
            }

            maxLength={160}

            onChange={(e) => {

              setMetaEdited(
                true
              );


              setForm(
                (prev) => ({
                  ...prev,

                  seo_description:
                    e.target.value,
                })
              );

            }}

            className="
              w-full
              h-[78px]

              rounded-[11px]

              border
              border-[#dedfe2]

              p-[12px]

              text-[13px]

              resize-none
              outline-none

              focus:border-[#2065D1]
            "
          />


          <Counter
            current={
              form
                .seo_description
                .length
            }

            max={160}
          />


          {/* SLUG */}

          <label
            className="
              block

              mt-[16px]
              mb-[7px]

              text-[12px]
              font-medium
            "
          >
            URL handle
          </label>


          <div
            className="
              h-[38px]

              rounded-[11px]

              border
              border-[#dedfe2]

              overflow-hidden

              flex
            "
          >

            <span
              className="
                px-[12px]

                bg-[#fafafa]

                flex
                items-center

                text-[12px]
                text-[#666]
              "
            >
              collections/
            </span>


            <input
              value={
                form.slug
              }

              onChange={(e) => {

                setSlugEdited(
                  true
                );


                setForm(
                  (prev) => ({
                    ...prev,

                    slug:
                      slugify(
                        e.target.value
                      ),
                  })
                );

              }}

              className="
                min-w-0
                flex-1

                px-[12px]

                text-[13px]

                outline-none
              "
            />

          </div>


          <p
            className="
              mt-[7px]

              text-[10px]
              text-[#777]
            "
          >
            {`${window.location.origin}/collections/${form.slug || "collection-handle"}`}
          </p>


          {/* SEO CHECKLIST */}

          <div
            className="
              mt-[18px]

              h-[42px]

              rounded-[11px]

              border
              border-[#dedfe2]

              px-[13px]

              flex
              items-center
              gap-[8px]
            "
          >

            <span
              className={`
                w-[7px]
                h-[7px]

                rounded-full

                ${
                  form.seo_title &&
                  form.seo_description &&
                  form.slug

                    ? "bg-green-500"
                    : "bg-orange-400"
                }
              `}
            />


            <Search size={13} />


            <span
              className="
                text-[11px]
                font-semibold
              "
            >
              SEO checklist
            </span>


            <span
              className="
                text-[10px]
                text-[#777]
              "
            >
              Score: {
                getSeoScore(
                  form
                )
              }/100
            </span>

          </div>

        </div>

      )}

    </div>
  );

};


const Counter = ({
  current,
  max,
}) => (

  <p
    className="
      mt-[5px]

      text-[10px]
      text-[#777]
    "
  >
    {current}/{max}
  </p>

);


const getSeoScore = (
  form
) => {

  let score = 0;


  if (form.title)
    score += 20;

  if (form.description)
    score += 20;

  if (form.slug)
    score += 20;

  if (form.seo_title)
    score += 20;

  if (form.seo_description)
    score += 20;


  return score;
};


export default CollectionSEO;