import {
  useState,
} from "react";

import {
  EyeOff,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import BrandAITexterPopup
  from "../../brands/BrandAITexterPopup";


const ProductSEO = ({
  form,
  updateField,

  generateAI,
  aiLoading,
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


  const runAI =
    async () => {

      const success =
        await generateAI({
          target: "seo",
          prompt,
          tone,
        });


      if (success) {
        setPrompt("");
        setAiOpen(false);
      }

    };


  const previewTitle =
    form.seo_title ||
    form.title ||
    "Untitled Product";


  const previewDescription =
    form.seo_description ||
    stripHtml(
      form.summary ||
      form.description
    ) ||
    "No description available.";


  return (
    <div
      className="
        relative

        rounded-[15px]

        border
        border-[#dedfe2]

        bg-white

        shadow-[0_2px_7px_rgba(0,0,0,0.035)]
      "
    >

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
                !aiOpen
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

            {aiLoading === "seo" ? (
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
                !visible
              )
            }

            className="
              h-[32px]
              px-[11px]

              rounded-[7px]

              border
              border-[#dedfe2]

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

          placeholder="Describe the SEO you want, keywords, focus and tone..."

          loading={
            aiLoading === "seo"
          }

          onGenerate={
            runAI
          }

          onAutoGenerate={
            runAI
          }

          className="
            top-[68px]
            right-[18px]
            z-50
          "
        />

      )}


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
              {" › products › "}
              {form.slug ||
                "product-handle"}
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
            maxLength={70}

            value={
              form.seo_title
            }

            onChange={(event) =>
              updateField(
                "seo_title",
                event.target.value,
                true
              )
            }

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


          <Counter
            current={
              form.seo_title.length
            }
            max={70}
          />


          <label
            className="
              block
              mt-[15px]
              mb-[7px]

              text-[12px]
              font-medium
            "
          >
            Meta description
          </label>


          <textarea
            maxLength={160}

            value={
              form.seo_description
            }

            onChange={(event) =>
              updateField(
                "seo_description",
                event.target.value,
                true
              )
            }

            className="
              w-full
              h-[76px]

              rounded-[11px]

              border
              border-[#dedfe2]

              p-[12px]

              text-[13px]

              resize-none
              outline-none
            "
          />


          <Counter
            current={
              form.seo_description
                .length
            }
            max={160}
          />


          <label
            className="
              block
              mt-[15px]
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
                px-[11px]

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

                px-[10px]

                text-[12px]

                outline-none
              "
            />

          </div>


          <div
            className="
              mt-[17px]

              h-[40px]

              rounded-[11px]

              border
              border-[#dedfe2]

              px-[12px]

              flex
              items-center
              gap-[7px]
            "
          >

            <span
              className={`
                w-[7px]
                h-[7px]

                rounded-full

                ${
                  seoScore(form) >= 80
                    ? "bg-green-500"
                    : seoScore(form) >= 50
                    ? "bg-orange-400"
                    : "bg-red-500"
                }
              `}
            />


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
              Score: {seoScore(form)}/100
            </span>

          </div>

        </div>

      )}

    </div>
  );
};


const stripHtml = (
  html = ""
) =>
  String(html)
    .replace(
      /<[^>]*>/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);


const seoScore = (
  form
) => {
  let score = 0;

  if (form.title)
    score += 20;

  if (
    form.summary ||
    form.description
  )
    score += 20;

  if (form.slug)
    score += 20;

  if (form.seo_title)
    score += 20;

  if (
    form.seo_description
  )
    score += 20;

  return score;
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


export default ProductSEO;