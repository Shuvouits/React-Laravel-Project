import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Columns2,
  Download,
  Eraser,
  Expand,
  EyeOff,
  ImagePlus,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Scaling,
  Trash2,
  WandSparkles,
} from "lucide-react";


const DEFAULT_EFFECTS = {
  brightness: 0,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  vignette: 0,
  saturation: 0,
  warmth: 0,
};


const QUICK_PRESETS = [
  {
    id: "clean-white",
    label: "Clean white",
    preview: "bg-[#eeeeef]",
  },
  {
    id: "lifestyle-room",
    label: "Lifestyle room",
    preview:
      "bg-gradient-to-br from-[#f7eee4] to-[#d9c2a7]",
  },
  {
    id: "desk-setup",
    label: "Desk setup",
    preview:
      "bg-gradient-to-b from-[#eeeeef] to-[#ba8552]",
  },
  {
    id: "gradient-studio",
    label: "Gradient studio",
    preview:
      "bg-gradient-to-br from-purple-200 via-cyan-100 to-orange-100",
  },
  {
    id: "neon-accent",
    label: "Neon accent",
    preview:
      "bg-gradient-to-br from-[#00d9ff] via-[#10131d] to-[#ff00b7]",
  },
];


const BrandImageStudio = ({
  brandName,
  initialPreview,
  onClose,
  onSave,
}) => {

  const fileInputRef =
    useRef(null);

  const canvasRef =
    useRef(null);

  const sourceCanvasRef =
    useRef(null);

  const imageRectRef =
    useRef(null);

  const erasingRef =
    useRef(false);


  /*
  |--------------------------------------------------------------------------
  | MEDIA
  |--------------------------------------------------------------------------
  */

  const [media, setMedia] =
    useState(() => {

      if (!initialPreview) {
        return [];
      }


      return [
        {
          id: "initial-media",
          url: initialPreview,
          file: null,
          local: false,
          name: "Current logo",
        },
      ];

    });


  const [
    selectedMediaId,
    setSelectedMediaId,
  ] = useState(
    initialPreview
      ? "initial-media"
      : null
  );


  /*
  |--------------------------------------------------------------------------
  | CANVAS
  |--------------------------------------------------------------------------
  */

  const [zoom, setZoom] =
    useState(25);

  const [artboard, setArtboard] =
    useState({
      width: 1000,
      height: 1000,
    });

  const [
    sourceVersion,
    setSourceVersion,
  ] = useState(0);

  const [
    compareOriginal,
    setCompareOriginal,
  ] = useState(false);

  const [
    imageHidden,
    setImageHidden,
  ] = useState(false);

  const [
    eraseMode,
    setEraseMode,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | PANEL
  |--------------------------------------------------------------------------
  */

  const [activeTab, setActiveTab] =
    useState("prompt");

  const [
    quickPreset,
    setQuickPreset,
  ] = useState(
    "clean-white"
  );

  const [category, setCategory] =
    useState("Electronics");

  const [effects, setEffects] =
    useState({
      ...DEFAULT_EFFECTS,
    });

  const [notice, setNotice] =
    useState("");


  /*
  |--------------------------------------------------------------------------
  | SELECTED MEDIA
  |--------------------------------------------------------------------------
  */

  const selectedMedia =
    media.find(
      (item) =>
        item.id ===
        selectedMediaId
    ) || null;


  const selectedMediaUrl =
    selectedMedia?.url || null;


  /*
  |--------------------------------------------------------------------------
  | LOAD IMAGE INTO SOURCE CANVAS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!selectedMediaUrl) {

      sourceCanvasRef.current =
        null;

      setSourceVersion(
        (prev) => prev + 1
      );

      return;

    }


    const image =
      new Image();


    image.crossOrigin =
      "anonymous";


    image.onload = () => {

      const sourceCanvas =
        document.createElement(
          "canvas"
        );


      sourceCanvas.width =
        image.naturalWidth ||
        image.width;

      sourceCanvas.height =
        image.naturalHeight ||
        image.height;


      const ctx =
        sourceCanvas.getContext(
          "2d",
          {
            willReadFrequently: true,
          }
        );


      ctx.drawImage(
        image,
        0,
        0
      );


      sourceCanvasRef.current =
        sourceCanvas;


      setSourceVersion(
        (prev) => prev + 1
      );

    };


    image.onerror = () => {

      setNotice(
        "Unable to load this image."
      );

    };


    image.src =
      selectedMediaUrl;

  }, [
    selectedMediaId,
    selectedMediaUrl,
  ]);


  /*
  |--------------------------------------------------------------------------
  | PRESET BACKGROUND
  |--------------------------------------------------------------------------
  */

  const drawPresetBackground = (
    ctx,
    width,
    height
  ) => {

    if (
      quickPreset ===
      "clean-white"
    ) {

      ctx.fillStyle =
        "#ffffff";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      return;

    }


    if (
      quickPreset ===
      "lifestyle-room"
    ) {

      const gradient =
        ctx.createLinearGradient(
          0,
          0,
          width,
          height
        );


      gradient.addColorStop(
        0,
        "#f5eee5"
      );

      gradient.addColorStop(
        1,
        "#e7dbcc"
      );


      ctx.fillStyle =
        gradient;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );


      ctx.fillStyle =
        "#d8c4aa";

      ctx.fillRect(
        0,
        height * 0.72,
        width,
        height * 0.28
      );

      return;

    }


    if (
      quickPreset ===
      "desk-setup"
    ) {

      ctx.fillStyle =
        "#eceeef";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );


      const desk =
        ctx.createLinearGradient(
          0,
          height * 0.7,
          0,
          height
        );


      desk.addColorStop(
        0,
        "#c99662"
      );

      desk.addColorStop(
        1,
        "#9c6b40"
      );


      ctx.fillStyle =
        desk;

      ctx.fillRect(
        0,
        height * 0.73,
        width,
        height * 0.27
      );

      return;

    }


    if (
      quickPreset ===
      "gradient-studio"
    ) {

      const gradient =
        ctx.createLinearGradient(
          0,
          0,
          width,
          height
        );


      gradient.addColorStop(
        0,
        "#f1e7ff"
      );

      gradient.addColorStop(
        0.45,
        "#e8f8ff"
      );

      gradient.addColorStop(
        1,
        "#fff1ea"
      );


      ctx.fillStyle =
        gradient;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      return;

    }


    if (
      quickPreset ===
      "neon-accent"
    ) {

      ctx.fillStyle =
        "#0b0c13";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );


      const glow1 =
        ctx.createRadialGradient(
          width * 0.2,
          height * 0.35,
          0,
          width * 0.2,
          height * 0.35,
          width * 0.55
        );


      glow1.addColorStop(
        0,
        "rgba(0,228,255,0.5)"
      );

      glow1.addColorStop(
        1,
        "rgba(0,228,255,0)"
      );


      ctx.fillStyle =
        glow1;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );


      const glow2 =
        ctx.createRadialGradient(
          width * 0.8,
          height * 0.65,
          0,
          width * 0.8,
          height * 0.65,
          width * 0.6
        );


      glow2.addColorStop(
        0,
        "rgba(255,0,181,0.45)"
      );

      glow2.addColorStop(
        1,
        "rgba(255,0,181,0)"
      );


      ctx.fillStyle =
        glow2;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      return;

    }


    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

  };


  /*
  |--------------------------------------------------------------------------
  | EFFECTS
  |--------------------------------------------------------------------------
  */

  const applyImageEffects = (
    ctx,
    width,
    height
  ) => {

    if (compareOriginal) {
      return;
    }


    const imageData =
      ctx.getImageData(
        0,
        0,
        width,
        height
      );


    const data =
      imageData.data;


    const brightness =
      Number(
        effects.brightness
      ) * 2.55;


    const exposure =
      Math.pow(
        2,
        Number(
          effects.exposure
        ) / 100
      );


    const contrast =
      Number(
        effects.contrast
      ) * 2.55;


    const factor =
      (
        259 *
        (
          contrast +
          255
        )
      ) /
      (
        255 *
        (
          259 -
          contrast
        )
      );


    const saturation =
      1 +
      Number(
        effects.saturation
      ) /
      100;


    const warmth =
      Number(
        effects.warmth
      ) *
      0.8;


    for (
      let i = 0;
      i < data.length;
      i += 4
    ) {

      let r =
        data[i];

      let g =
        data[i + 1];

      let b =
        data[i + 2];


      r *= exposure;
      g *= exposure;
      b *= exposure;


      r += brightness;
      g += brightness;
      b += brightness;


      r =
        factor *
        (
          r - 128
        ) +
        128;

      g =
        factor *
        (
          g - 128
        ) +
        128;

      b =
        factor *
        (
          b - 128
        ) +
        128;


      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;


      r =
        gray +
        (
          r - gray
        ) *
        saturation;

      g =
        gray +
        (
          g - gray
        ) *
        saturation;

      b =
        gray +
        (
          b - gray
        ) *
        saturation;


      r += warmth;

      b -= warmth;


      data[i] =
        clamp(r);

      data[i + 1] =
        clamp(g);

      data[i + 2] =
        clamp(b);

    }


    ctx.putImageData(
      imageData,
      0,
      0
    );


    if (
      Number(
        effects.vignette
      ) > 0
    ) {

      const amount =
        Number(
          effects.vignette
        ) /
        100;


      const radius =
        Math.max(
          width,
          height
        ) *
        0.72;


      const gradient =
        ctx.createRadialGradient(
          width / 2,
          height / 2,
          radius * 0.2,
          width / 2,
          height / 2,
          radius
        );


      gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
      );


      gradient.addColorStop(
        1,
        `rgba(0,0,0,${
          amount * 0.7
        })`
      );


      ctx.fillStyle =
        gradient;


      ctx.fillRect(
        0,
        0,
        width,
        height
      );

    }

  };


  /*
  |--------------------------------------------------------------------------
  | DRAW
  |--------------------------------------------------------------------------
  */

  const drawCanvas = () => {

    const canvas =
      canvasRef.current;


    if (!canvas) {
      return;
    }


    canvas.width =
      artboard.width;

    canvas.height =
      artboard.height;


    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently: true,
        }
      );


    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    drawPresetBackground(
      ctx,
      canvas.width,
      canvas.height
    );


    const sourceCanvas =
      sourceCanvasRef.current;


    if (
      sourceCanvas &&
      !imageHidden
    ) {

      const availableWidth =
        canvas.width *
        0.86;

      const availableHeight =
        canvas.height *
        0.86;


      const scale =
        Math.min(
          availableWidth /
            sourceCanvas.width,

          availableHeight /
            sourceCanvas.height
        );


      const drawWidth =
        sourceCanvas.width *
        scale;

      const drawHeight =
        sourceCanvas.height *
        scale;


      const x =
        (
          canvas.width -
          drawWidth
        ) /
        2;

      const y =
        (
          canvas.height -
          drawHeight
        ) /
        2;


      imageRectRef.current = {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      };


      ctx.drawImage(
        sourceCanvas,
        x,
        y,
        drawWidth,
        drawHeight
      );

    }


    applyImageEffects(
      ctx,
      canvas.width,
      canvas.height
    );

  };


  useEffect(() => {

    drawCanvas();

  }, [
    sourceVersion,
    effects,
    quickPreset,
    compareOriginal,
    imageHidden,
    artboard.width,
    artboard.height,
  ]);


  /*
  |--------------------------------------------------------------------------
  | UPLOAD MEDIA
  |--------------------------------------------------------------------------
  */

  const addMedia = (
    file
  ) => {

    if (!file) {
      return;
    }


    const accepted = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


    if (
      !accepted.includes(
        file.type
      )
    ) {

      setNotice(
        "Please upload JPG, PNG or WebP."
      );

      return;

    }


    const id =
      `brand-media-${Date.now()}-${Math.random()}`;


    const url =
      URL.createObjectURL(
        file
      );


    setMedia(
      (prev) => [
        ...prev,
        {
          id,
          url,
          file,
          local: true,
          name: file.name,
        },
      ]
    );


    setSelectedMediaId(id);

    setEffects({
      ...DEFAULT_EFFECTS,
    });

  };


  /*
  |--------------------------------------------------------------------------
  | DELETE MEDIA
  |--------------------------------------------------------------------------
  */

  const deleteSelectedMedia = () => {

    if (!selectedMedia) {
      return;
    }


    if (
      selectedMedia.local &&
      selectedMedia.url
    ) {

      URL.revokeObjectURL(
        selectedMedia.url
      );

    }


    const remaining =
      media.filter(
        (item) =>
          item.id !==
          selectedMediaId
      );


    setMedia(
      remaining
    );


    setSelectedMediaId(
      remaining[0]?.id ||
      null
    );

  };


  /*
  |--------------------------------------------------------------------------
  | REMOVE WHITE BACKGROUND
  |--------------------------------------------------------------------------
  */

  const removeBackground =
    () => {

      const source =
        sourceCanvasRef.current;


      if (!source) {
        return;
      }


      const ctx =
        source.getContext(
          "2d",
          {
            willReadFrequently: true,
          }
        );


      const imageData =
        ctx.getImageData(
          0,
          0,
          source.width,
          source.height
        );


      const data =
        imageData.data;


      for (
        let i = 0;
        i < data.length;
        i += 4
      ) {

        const r =
          data[i];

        const g =
          data[i + 1];

        const b =
          data[i + 2];


        const difference =
          Math.max(r, g, b) -
          Math.min(r, g, b);


        if (
          r > 238 &&
          g > 238 &&
          b > 238 &&
          difference < 20
        ) {

          data[i + 3] = 0;

        }

      }


      ctx.putImageData(
        imageData,
        0,
        0
      );


      setSourceVersion(
        (prev) => prev + 1
      );


      setNotice(
        "Light background removed."
      );

  };


  /*
  |--------------------------------------------------------------------------
  | ENHANCE
  |--------------------------------------------------------------------------
  */

  const enhanceImage = () => {

    setEffects({
      brightness: 3,
      exposure: 2,
      contrast: 10,
      highlights: 0,
      shadows: 0,
      vignette: 0,
      saturation: 10,
      warmth: 2,
    });


    setActiveTab(
      "effects"
    );

  };


  /*
  |--------------------------------------------------------------------------
  | ERASE
  |--------------------------------------------------------------------------
  */

  const eraseAtPointer = (
    event
  ) => {

    if (
      !eraseMode ||
      !sourceCanvasRef.current ||
      !imageRectRef.current
    ) {
      return;
    }


    const canvas =
      canvasRef.current;

    const source =
      sourceCanvasRef.current;

    const imageRect =
      imageRectRef.current;


    const bounds =
      canvas.getBoundingClientRect();


    const canvasX =
      (
        event.clientX -
        bounds.left
      ) *
      (
        canvas.width /
        bounds.width
      );


    const canvasY =
      (
        event.clientY -
        bounds.top
      ) *
      (
        canvas.height /
        bounds.height
      );


    if (
      canvasX < imageRect.x ||
      canvasX >
        imageRect.x +
        imageRect.width ||
      canvasY < imageRect.y ||
      canvasY >
        imageRect.y +
        imageRect.height
    ) {
      return;
    }


    const sourceX =
      (
        (
          canvasX -
          imageRect.x
        ) /
        imageRect.width
      ) *
      source.width;


    const sourceY =
      (
        (
          canvasY -
          imageRect.y
        ) /
        imageRect.height
      ) *
      source.height;


    const radius =
      Math.max(
        12,
        source.width *
        0.025
      );


    const ctx =
      source.getContext(
        "2d"
      );


    ctx.save();

    ctx.globalCompositeOperation =
      "destination-out";

    ctx.beginPath();

    ctx.arc(
      sourceX,
      sourceY,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    setSourceVersion(
      (prev) => prev + 1
    );

  };


  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const saveImage = () => {

    const canvas =
      canvasRef.current;


    if (!canvas) {
      return;
    }


    canvas.toBlob(
      (blob) => {

        if (!blob) {
          return;
        }


        const file =
          new File(
            [blob],
            `${
              fileSlug(
                brandName
              ) ||
              "brand-logo"
            }.png`,
            {
              type:
                "image/png",
            }
          );


        onSave(file);

      },
      "image/png",
      1
    );

  };


  /*
  |--------------------------------------------------------------------------
  | EXPORT
  |--------------------------------------------------------------------------
  */

  const exportImage = () => {

    const canvas =
      canvasRef.current;


    if (!canvas) {
      return;
    }


    canvas.toBlob(
      (blob) => {

        if (!blob) {
          return;
        }


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;

        link.download =
          `${
            fileSlug(
              brandName
            ) ||
            "brand-logo"
          }.png`;


        link.click();


        URL.revokeObjectURL(
          url
        );

      },
      "image/png"
    );

  };


  /*
  |--------------------------------------------------------------------------
  | EFFECT CHANGE
  |--------------------------------------------------------------------------
  */

  const changeEffect = (
    field,
    value
  ) => {

    setEffects(
      (prev) => ({
        ...prev,
        [field]:
          Number(value),
      })
    );

  };


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]

        bg-[#f5f6f8]

        font-['Inter']

        flex
        flex-col
      "
    >

      {/* HEADER */}

      <div
        className="
          h-[58px]
          shrink-0

          bg-white

          border-b
          border-[#e1e3e6]

          px-[26px]

          flex
          items-center
          justify-between
        "
      >

        <div
          className="
            flex
            items-center
            gap-[9px]
          "
        >

          <button
            type="button"
            onClick={onClose}
          >
            <ArrowLeft
              size={16}
            />
          </button>

          <span className="text-[12px] text-[#777]">
            Edit brand
          </span>

          <span className="text-[#aaa]">
            /
          </span>

          <span className="text-[12px] text-[#777]">
            Logo
          </span>

          <span className="text-[#aaa]">
            /
          </span>

          <span
            className="
              text-[12px]
              font-semibold
            "
          >
            AI Image Studio
          </span>

        </div>

      </div>


      {/* STUDIO */}

      <div
        className="
          flex-1
          min-h-0

          grid
          grid-cols-[240px_minmax(0,1fr)_310px]

          gap-[9px]

          p-[10px]
        "
      >

        {/* MEDIA */}

        <div
          className="
            bg-white

            border
            border-[#dedfe2]

            rounded-[12px]

            p-[14px]

            overflow-y-auto
          "
        >

          <h3
            className="
              text-[14px]
              font-semibold
            "
          >
            Media
          </h3>


          <div
            className="
              mt-[15px]

              grid
              grid-cols-2

              gap-[10px]
            "
          >

            <button
              type="button"

              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }

              className="
                aspect-square

                rounded-[8px]

                border
                border-[#dedfe2]

                flex
                flex-col
                items-center
                justify-center

                gap-[8px]

                hover:border-[#2065D1]
              "
            >

              <ImagePlus
                size={20}
                className="
                  text-[#2065D1]
                "
              />

              <span className="text-[10px]">
                Upload Image
              </span>

            </button>


            {media.map(
              (item) => (

                <button
                  type="button"

                  key={item.id}

                  onClick={() => {

                    setSelectedMediaId(
                      item.id
                    );

                    setEffects({
                      ...DEFAULT_EFFECTS,
                    });

                  }}

                  className={`
                    aspect-square

                    rounded-[8px]

                    border-2

                    overflow-hidden

                    ${
                      selectedMediaId ===
                      item.id
                        ? "border-[#2065D1]"
                        : "border-[#dedfe2]"
                    }
                  `}
                >

                  <img
                    src={item.url}
                    alt=""
                    className="
                      w-full
                      h-full
                      object-contain
                    "
                  />

                </button>

              )
            )}

          </div>


          <input
            ref={fileInputRef}

            type="file"

            multiple

            accept="
              image/jpeg,
              image/png,
              image/webp
            "

            className="hidden"

            onChange={(e) => {

              Array.from(
                e.target.files ||
                []
              ).forEach(
                addMedia
              );


              e.target.value =
                "";

            }}
          />

        </div>


        {/* CENTER */}

        <div
          className="
            min-w-0

            flex
            flex-col

            gap-[9px]
          "
        >

          {/* CANVAS */}

          <div
            className="
              flex-1
              min-h-0

              bg-white

              border
              border-[#dedfe2]

              rounded-[12px]

              overflow-hidden

              flex
              flex-col
            "
          >

            {/* TOOLBAR */}

            <div
              className="
                h-[42px]
                shrink-0

                border-b
                border-[#e6e7e9]

                px-[10px]

                flex
                items-center
                justify-between
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-[4px]
                "
              >

                <ToolButton
                  onClick={() =>
                    setZoom(
                      (prev) =>
                        Math.max(
                          10,
                          prev - 5
                        )
                    )
                  }
                >
                  <Minus size={14} />
                </ToolButton>


                <span
                  className="
                    min-w-[40px]

                    text-center

                    text-[11px]
                    font-semibold
                  "
                >
                  {zoom}%
                </span>


                <ToolButton
                  onClick={() =>
                    setZoom(
                      (prev) =>
                        Math.min(
                          100,
                          prev + 5
                        )
                    )
                  }
                >
                  <Plus size={14} />
                </ToolButton>


                <TextTool
                  onClick={() =>
                    setZoom(25)
                  }
                >
                  <Maximize2 size={13} />
                  Fit
                </TextTool>


                <TextTool
                  active={
                    compareOriginal
                  }

                  onClick={() =>
                    setCompareOriginal(
                      (prev) =>
                        !prev
                    )
                  }
                >
                  <Columns2 size={13} />
                  Compare
                </TextTool>


                <ToolButton
                  active={imageHidden}

                  onClick={() =>
                    setImageHidden(
                      (prev) =>
                        !prev
                    )
                  }
                >
                  <EyeOff size={14} />
                </ToolButton>


                <ToolButton
                  disabled={
                    !selectedMedia
                  }

                  onClick={
                    deleteSelectedMedia
                  }
                >
                  <Trash2 size={14} />
                </ToolButton>

              </div>


              <div
                className="
                  flex
                  gap-[7px]
                "
              >

                <button
                  type="button"

                  onClick={onClose}

                  className="
                    h-[32px]
                    px-[14px]

                    rounded-[8px]

                    border
                    border-[#dedfe2]

                    text-[11px]
                  "
                >
                  Cancel
                </button>


                <button
                  type="button"

                  disabled={
                    !selectedMedia
                  }

                  onClick={
                    saveImage
                  }

                  className="
                    h-[32px]
                    px-[17px]

                    rounded-[8px]

                    bg-[#7fa8e5]
                    text-white

                    text-[11px]
                    font-semibold

                    disabled:opacity-40
                  "
                >
                  Save
                </button>

              </div>

            </div>


            {/* WORKSPACE */}

            <div
              className="
                flex-1
                min-h-0

                overflow-auto

                bg-[#f6f6f6]

                flex
                items-center
                justify-center

                p-[40px]
              "
            >

              {!selectedMedia ? (

                <div className="text-center">

                  <ImagePlus
                    size={30}
                    className="
                      mx-auto
                      text-[#888]
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-[12px]
                    "
                  >
                    No image selected
                  </p>

                </div>

              ) : (

                <canvas
                  ref={canvasRef}

                  onPointerDown={(
                    event
                  ) => {

                    if (!eraseMode) {
                      return;
                    }

                    erasingRef.current =
                      true;

                    eraseAtPointer(
                      event
                    );

                  }}

                  onPointerMove={(
                    event
                  ) => {

                    if (
                      erasingRef.current
                    ) {

                      eraseAtPointer(
                        event
                      );

                    }

                  }}

                  onPointerUp={() => {

                    erasingRef.current =
                      false;

                  }}

                  style={{
                    width:
                      `${
                        Math.max(
                          120,
                          artboard.width *
                          zoom /
                          100
                        )
                      }px`,

                    height:
                      `${
                        Math.max(
                          120,
                          artboard.height *
                          zoom /
                          100
                        )
                      }px`,

                    cursor:
                      eraseMode
                        ? "crosshair"
                        : "default",
                  }}

                  className="
                    bg-white

                    shadow-[0_3px_9px_rgba(0,0,0,0.15)]

                    shrink-0
                  "
                />

              )}

            </div>

          </div>


          {/* ACTION BAR */}

          <div
            className="
              h-[168px]
              shrink-0

              rounded-[12px]

              bg-gradient-to-r
              from-[#ec36dc]
              via-[#ffbe3b]
              to-[#ccd879]

              p-[2px]
            "
          >

            <div
              className="
                h-full

                rounded-[10px]

                bg-white
              "
            >

              <div
                className="
                  h-[44px]

                  px-[12px]

                  flex
                  items-center

                  gap-[15px]
                "
              >

                <Action
                  icon={
                    <ImagePlus size={13} />
                  }

                  label="Remove Background"

                  onClick={
                    removeBackground
                  }
                />


                <Action
                  icon={
                    <WandSparkles size={13} />
                  }

                  label="Enhance"

                  onClick={
                    enhanceImage
                  }
                />


                <Action
                  icon={
                    <Scaling size={13} />
                  }

                  label="Upscale"

                  onClick={() => {

                    setNotice(
                      "Browser upscale uses canvas scaling. Original quality cannot be recreated."
                    );

                  }}
                />


                <Action
                  icon={
                    <Eraser size={13} />
                  }

                  label={
                    eraseMode
                      ? "Erasing..."
                      : "Erase Object"
                  }

                  active={
                    eraseMode
                  }

                  onClick={() =>
                    setEraseMode(
                      (prev) =>
                        !prev
                    )
                  }
                />


                <Action
                  icon={
                    <Scaling size={13} />
                  }

                  label="Resize"

                  onClick={() =>
                    setArtboard({
                      width: 1000,
                      height: 1000,
                    })
                  }
                />


                <Action
                  icon={
                    <Expand size={13} />
                  }

                  label="Expand"

                  onClick={() =>
                    setArtboard(
                      (prev) => ({
                        width:
                          Math.round(
                            prev.width *
                            1.25
                          ),

                        height:
                          Math.round(
                            prev.height *
                            1.25
                          ),
                      })
                    )
                  }
                />


                <Action
                  icon={
                    <Download size={13} />
                  }

                  label="Export"

                  onClick={
                    exportImage
                  }
                />

              </div>


              <div
                className="
                  px-[14px]
                  py-[12px]
                "
              >

                <p
                  className="
                    text-[12px]
                    text-[#666]
                  "
                >
                  {eraseMode
                    ? "Drag over the image to erase unwanted areas."
                    : "Edit uploaded media using browser-based image tools."}
                </p>


                {notice && (

                  <p
                    className="
                      mt-2

                      text-[11px]
                      text-[#2065D1]
                    "
                  >
                    {notice}
                  </p>

                )}

              </div>

            </div>

          </div>

        </div>


        {/* RIGHT PANEL */}

        <div
          className="
            min-h-0

            bg-white

            border
            border-[#dedfe2]

            rounded-[12px]

            overflow-hidden

            flex
            flex-col
          "
        >

          <div
            className="
              h-[42px]

              grid
              grid-cols-2

              border-b
              border-[#e5e6e8]
            "
          >

            <Tab
              active={
                activeTab ===
                "prompt"
              }

              onClick={() =>
                setActiveTab(
                  "prompt"
                )
              }
            >
              Quick Prompt
            </Tab>


            <Tab
              active={
                activeTab ===
                "effects"
              }

              onClick={() =>
                setActiveTab(
                  "effects"
                )
              }
            >
              Effects
            </Tab>

          </div>


          {activeTab ===
          "prompt" ? (

            <div
              className="
                p-[12px]

                overflow-y-auto
              "
            >

              <select
                value={category}

                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }

                className="
                  w-full
                  h-[36px]

                  rounded-[9px]

                  border
                  border-[#dedfe2]

                  px-[10px]

                  text-[11px]
                "
              >

                <option>
                  Electronics
                </option>

                <option>
                  Fashion
                </option>

                <option>
                  Beauty
                </option>

                <option>
                  Furniture
                </option>

                <option>
                  Sports
                </option>

              </select>


              <div
                className="
                  mt-[10px]

                  space-y-[8px]
                "
              >

                {QUICK_PRESETS.map(
                  (item) => (

                    <button
                      key={item.id}

                      type="button"

                      onClick={() =>
                        setQuickPreset(
                          item.id
                        )
                      }

                      className={`
                        w-full
                        min-h-[46px]

                        rounded-[8px]

                        border

                        px-[8px]

                        flex
                        items-center
                        gap-[10px]

                        ${
                          quickPreset ===
                          item.id
                            ? "border-[#2065D1] bg-[#f7faff]"
                            : "border-[#dedfe2]"
                        }
                      `}
                    >

                      <div
                        className={`
                          w-[33px]
                          h-[33px]

                          rounded-[6px]

                          ${item.preview}
                        `}
                      />

                      <span
                        className="
                          text-[11px]
                        "
                      >
                        {item.label}
                      </span>

                    </button>

                  )
                )}

              </div>

            </div>

          ) : (

            <div
              className="
                flex-1

                overflow-y-auto

                p-[14px]
              "
            >

              <h4
                className="
                  mb-[12px]

                  text-[12px]
                  font-semibold
                "
              >
                Light
              </h4>


              <Effect
                label="Brightness"
                value={
                  effects.brightness
                }
                onChange={(value) =>
                  changeEffect(
                    "brightness",
                    value
                  )
                }
              />


              <Effect
                label="Exposure"
                value={
                  effects.exposure
                }
                onChange={(value) =>
                  changeEffect(
                    "exposure",
                    value
                  )
                }
              />


              <Effect
                label="Contrast"
                value={
                  effects.contrast
                }
                onChange={(value) =>
                  changeEffect(
                    "contrast",
                    value
                  )
                }
              />


              <Effect
                label="Vignette"
                min={0}
                value={
                  effects.vignette
                }
                onChange={(value) =>
                  changeEffect(
                    "vignette",
                    value
                  )
                }
              />


              <h4
                className="
                  mt-[22px]
                  mb-[12px]

                  text-[12px]
                  font-semibold
                "
              >
                Color
              </h4>


              <Effect
                label="Saturation"
                value={
                  effects.saturation
                }
                onChange={(value) =>
                  changeEffect(
                    "saturation",
                    value
                  )
                }
              />


              <Effect
                label="Warmth"
                value={
                  effects.warmth
                }
                onChange={(value) =>
                  changeEffect(
                    "warmth",
                    value
                  )
                }
              />


              <button
                type="button"

                onClick={() =>
                  setEffects({
                    ...DEFAULT_EFFECTS,
                  })
                }

                className="
                  mt-2

                  flex
                  items-center
                  gap-[5px]

                  text-[11px]
                  text-[#777]
                "
              >

                <RefreshCw
                  size={13}
                />

                Reset

              </button>

            </div>

          )}

        </div>

      </div>

    </div>
  );
};


/* ==========================================================================
   HELPERS
============================================================================ */

const clamp = (value) =>
  Math.max(
    0,
    Math.min(
      255,
      value
    )
  );


const fileSlug = (value) =>
  String(
    value || ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );


const Action = ({
  icon,
  label,
  onClick,
  active = false,
}) => (
  <button
    type="button"

    onClick={onClick}

    className={`
      flex
      items-center
      gap-[4px]

      text-[10px]

      whitespace-nowrap

      ${
        active
          ? "text-[#2065D1] font-semibold"
          : "text-[#666]"
      }
    `}
  >
    {icon}
    {label}
  </button>
);


const ToolButton = ({
  children,
  onClick,
  active = false,
  disabled = false,
}) => (
  <button
    type="button"

    onClick={onClick}

    disabled={disabled}

    className={`
      w-[29px]
      h-[29px]

      rounded-[7px]

      flex
      items-center
      justify-center

      ${
        active
          ? "bg-[#eaf1ff] text-[#2065D1]"
          : "text-[#777] hover:bg-[#f5f5f6]"
      }

      disabled:opacity-40
    `}
  >
    {children}
  </button>
);


const TextTool = ({
  children,
  onClick,
  active = false,
}) => (
  <button
    type="button"

    onClick={onClick}

    className={`
      h-[29px]
      px-[8px]

      rounded-[7px]

      flex
      items-center
      gap-[5px]

      text-[10px]

      ${
        active
          ? "bg-[#eaf1ff] text-[#2065D1]"
          : "text-[#777]"
      }
    `}
  >
    {children}
  </button>
);


const Tab = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"

    onClick={onClick}

    className={`
      relative

      text-[11px]

      ${
        active
          ? "text-[#2065D1]"
          : "text-[#666]"
      }
    `}
  >
    {children}

    {active && (
      <span
        className="
          absolute
          bottom-0
          left-0
          right-0

          h-[2px]

          bg-[#2065D1]
        "
      />
    )}
  </button>
);


const Effect = ({
  label,
  value,
  onChange,
  min = -100,
  max = 100,
}) => (
  <div
    className="
      mb-[18px]
    "
  >

    <div
      className="
        mb-[7px]

        flex
        justify-between
      "
    >
      <span className="text-[11px]">
        {label}
      </span>

      <span
        className="
          text-[10px]
          text-[#888]
        "
      >
        {value}
      </span>
    </div>


    <input
      type="range"

      min={min}
      max={max}

      value={value}

      onChange={(e) =>
        onChange(
          e.target.value
        )
      }

      className="
        w-full

        accent-[#2065D1]
      "
    />

  </div>
);


export default BrandImageStudio;