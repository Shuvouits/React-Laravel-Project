import {
  useState,
} from "react";

import {
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import BrandAITexterPopup
  from "../../brands/BrandAITexterPopup";

import RichTextEditor
  from "./RichTextEditor";


const ProductDetails = ({
  form,
  updateField,

  generateAI,
  aiLoading,

  errors,
}) => {

  const [
    summaryAI,
    setSummaryAI,
  ] = useState(false);

  const [
    descriptionAI,
    setDescriptionAI,
  ] = useState(false);

  const [
    specificationAI,
    setSpecificationAI,
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

  const [
    activeTab,
    setActiveTab,
  ] = useState("description");


  const runAI = async (
    target,
    close
  ) => {
    const success =
      await generateAI({
        target,
        prompt,
        tone,
      });

    if (success) {
      setPrompt("");
      close(false);
    }
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
          text-[15px]
          font-bold
        "
      >
        Details
      </h2>


      {/* TITLE */}

      <label
        className="
          block
          mt-[16px]
          mb-[7px]

          text-[12px]
          font-medium
        "
      >
        Title *
      </label>


      <input
        value={form.title}

        onChange={(event) =>
          updateField(
            "title",
            event.target.value
          )
        }

        className={`
          w-full
          h-[39px]

          rounded-[11px]

          border
          ${
            errors.title
              ? "border-red-400"
              : "border-[#dedfe2]"
          }

          px-[12px]

          text-[13px]

          outline-none

          focus:border-[#2065D1]
        `}
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
          h-[39px]

          rounded-[11px]

          border
          border-[#dedfe2]

          flex
          overflow-hidden
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
          products/
        </span>


        <input
          value={form.slug}

          onChange={(event) =>
            updateField(
              "slug",
              event.target.value,
              true
            )
          }

          className="
            min-w-0
            flex-1

            px-[12px]

            text-[13px]

            outline-none
          "
        />

      </div>


      {/* SUMMARY */}

      <div
        className="
          relative
          mt-[17px]
        "
      >

        <div
          className="
            mb-[7px]

            flex
            items-center
            justify-between
          "
        >

          <label
            className="
              text-[12px]
              font-medium
            "
          >
            Summary
          </label>


          <AIButton
            loading={
              aiLoading === "summary"
            }

            onClick={() =>
              setSummaryAI(
                !summaryAI
              )
            }
          />

        </div>


        <textarea
          value={form.summary}

          onChange={(event) =>
            updateField(
              "summary",
              event.target.value
            )
          }

          placeholder="Short product summary..."

          className="
            w-full
            h-[88px]

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


        {summaryAI && (
          <BrandAITexterPopup
            prompt={prompt}
            setPrompt={setPrompt}

            tone={tone}
            setTone={setTone}

            toneOpen={toneOpen}
            setToneOpen={
              setToneOpen
            }

            placeholder="Describe the summary you want..."

            loading={
              aiLoading ===
              "summary"
            }

            onGenerate={() =>
              runAI(
                "summary",
                setSummaryAI
              )
            }

            onAutoGenerate={() =>
              runAI(
                "summary",
                setSummaryAI
              )
            }

            className="
              top-[34px]
              right-[8px]
              z-50
            "
          />
        )}

      </div>


      {/* DESCRIPTION / SPECIFICATIONS */}

      <div
        className="
          mt-[17px]
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <div
            className="
              inline-flex

              rounded-full

              bg-[#f2f3f5]

              p-[3px]
            "
          >

            <TabButton
              active={
                activeTab ===
                "description"
              }

              onClick={() =>
                setActiveTab(
                  "description"
                )
              }
            >
              Description
            </TabButton>


            <TabButton
              active={
                activeTab ===
                "specifications"
              }

              onClick={() =>
                setActiveTab(
                  "specifications"
                )
              }
            >
              Specifications
            </TabButton>

          </div>


          <div
            className="relative"
          >

            <AIButton
              loading={
                aiLoading ===
                activeTab
              }

              onClick={() => {
                if (
                  activeTab ===
                  "description"
                ) {
                  setDescriptionAI(
                    !descriptionAI
                  );
                } else {
                  setSpecificationAI(
                    !specificationAI
                  );
                }
              }}
            />


            {activeTab ===
              "description" &&
              descriptionAI && (

              <BrandAITexterPopup
                prompt={prompt}
                setPrompt={
                  setPrompt
                }

                tone={tone}
                setTone={setTone}

                toneOpen={
                  toneOpen
                }

                setToneOpen={
                  setToneOpen
                }

                placeholder="Describe the product description you want..."

                loading={
                  aiLoading ===
                  "description"
                }

                onGenerate={() =>
                  runAI(
                    "description",
                    setDescriptionAI
                  )
                }

                onAutoGenerate={() =>
                  runAI(
                    "description",
                    setDescriptionAI
                  )
                }

                className="
                  top-[34px]
                  right-0
                  z-50
                "
              />

            )}


            {activeTab ===
              "specifications" &&
              specificationAI && (

              <BrandAITexterPopup
                prompt={prompt}
                setPrompt={
                  setPrompt
                }

                tone={tone}
                setTone={setTone}

                toneOpen={
                  toneOpen
                }

                setToneOpen={
                  setToneOpen
                }

                placeholder="Describe the specifications you want..."

                loading={
                  aiLoading ===
                  "specifications"
                }

                onGenerate={() =>
                  runAI(
                    "specifications",
                    setSpecificationAI
                  )
                }

                onAutoGenerate={() =>
                  runAI(
                    "specifications",
                    setSpecificationAI
                  )
                }

                className="
                  top-[34px]
                  right-0
                  z-50
                "
              />

            )}

          </div>

        </div>


        <div
          className="
            mt-[12px]
          "
        >

          {activeTab ===
          "description" ? (

            <RichTextEditor
              value={
                form.description
              }

              onChange={(value) =>
                updateField(
                  "description",
                  value
                )
              }
            />

          ) : (

            <RichTextEditor
              value={
                form.specifications
              }

              onChange={(value) =>
                updateField(
                  "specifications",
                  value
                )
              }
            />

          )}

        </div>

      </div>

    </div>
  );
};


const AIButton = ({
  loading,
  onClick,
}) => (
  <button
    type="button"

    onClick={onClick}

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
    {loading ? (
      <LoaderCircle
        size={13}
        className="animate-spin"
      />
    ) : (
      <Sparkles size={14} />
    )}
  </button>
);


const TabButton = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      h-[29px]

      rounded-full

      px-[11px]

      text-[12px]

      ${
        active
          ? "bg-white font-semibold shadow-sm"
          : "text-[#555]"
      }
    `}
  >
    {children}
  </button>
);


export default ProductDetails;