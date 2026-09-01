import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ChevronDown,
    GripVertical,
    LoaderCircle,
    Plus,
    Square,
    Trash2,
} from "lucide-react";

import {
    DEFAULT_COLOR_CODE,
    EMPTY_VARIANT,
    VISUAL_OPTIONS,
    getColorPickerValue,
    isColorVariant,
    normalizeColorCode,
    normalizeVariant,
} from "./globalVariantConfig";

const GlobalVariantForm = ({
    mode = "create",
    variant = null,
    saving = false,
    onSave,
    onDelete,
    onCancel,
}) => {
    const [form, setForm] = useState({
        ...EMPTY_VARIANT,
    });

    const [newValue, setNewValue] = useState("");
    const [newColor, setNewColor] = useState(DEFAULT_COLOR_CODE);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (mode === "edit" && variant) {
            setForm(normalizeVariant(variant));
        } else {
            setForm({
                ...EMPTY_VARIANT,
            });
        }

        setNewValue("");
        setNewColor(DEFAULT_COLOR_CODE);
        setErrors({});
        setMessage("");
    }, [mode, variant]);

    const isColor = useMemo(() => {
        return isColorVariant(form);
    }, [
        form.name,
        form.is_color,
    ]);

    const handleChange = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [field]: null,
        }));
    };

    const updateValueField = (
        index,
        field,
        value
    ) => {
        setForm((previous) => {
            const values = previous.values.map(
                (item, valueIndex) => {
                    if (valueIndex !== index) {
                        return item;
                    }

                    return {
                        ...item,
                        [field]: value,
                    };
                }
            );

            return {
                ...previous,
                values,
            };
        });

        setErrors((previous) => ({
            ...previous,
            values: null,
        }));

        setMessage("");
    };

    const updateColorFromPicker = (
        index,
        colorCode
    ) => {
        updateValueField(
            index,
            "color_code",
            colorCode.toUpperCase()
        );
    };

    const handleHexBlur = (index, colorCode) => {
        const normalized =
            normalizeColorCode(colorCode);

        updateValueField(
            index,
            "color_code",
            normalized || DEFAULT_COLOR_CODE
        );
    };

    const removeValue = (index) => {
        setForm((previous) => ({
            ...previous,

            values: previous.values.filter(
                (_, valueIndex) =>
                    valueIndex !== index
            ),
        }));

        setMessage("");
    };

    const addValue = () => {
        const value = newValue.trim();

        if (!value) {
            return;
        }

        const exists = form.values.some((item) => {
            return String(item.value || "")
                .trim()
                .toLowerCase() === value.toLowerCase();
        });

        if (exists) {
            setMessage(
                `"${value}" already exists.`
            );

            return;
        }

        setForm((previous) => ({
            ...previous,

            values: [
                ...previous.values,
                {
                    value,

                    color_code: isColor
                        ? getColorPickerValue(newColor)
                        : null,

                    sort_order:
                        previous.values.length,
                },
            ],
        }));

        setNewValue("");
        setNewColor(DEFAULT_COLOR_CODE);
        setMessage("");
    };

    const handleNewValueKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addValue();
        }
    };

    const buildPayload = () => {
        const values = form.values
            .map((item, index) => {
                const data = {
                    value: String(
                        item.value || ""
                    ).trim(),

                    color_code: isColor
                        ? (
                            normalizeColorCode(
                                item.color_code
                            ) ||
                            DEFAULT_COLOR_CODE
                        )
                        : null,

                    sort_order: index,
                };

                if (item.id) {
                    data.id = item.id;
                }

                return data;
            })
            .filter((item) => item.value);

        const pendingValue = newValue.trim();

        if (pendingValue) {
            const exists = values.some((item) => {
                return item.value.toLowerCase() ===
                    pendingValue.toLowerCase();
            });

            if (!exists) {
                values.push({
                    value: pendingValue,

                    color_code: isColor
                        ? (
                            normalizeColorCode(newColor) ||
                            DEFAULT_COLOR_CODE
                        )
                        : null,

                    sort_order: values.length,
                });
            }
        }

        return {
            name: form.name.trim(),

            visual_type:
                form.visual_type ||
                "rectangle",

            sort_order:
                Number(form.sort_order) || 0,

            values,
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) {
            return;
        }

        setErrors({});
        setMessage("");

        const payload = buildPayload();
        const validationErrors = {};

        if (!payload.name) {
            validationErrors.name =
                "Variant name is required.";
        }

        if (payload.values.length === 0) {
            validationErrors.values =
                "Add at least one option value.";
        }

        const normalizedValues = payload.values.map(
            (item) =>
                item.value.toLowerCase()
        );

        const uniqueValues = new Set(
            normalizedValues
        );

        if (
            normalizedValues.length !==
            uniqueValues.size
        ) {
            validationErrors.values =
                "Duplicate option values are not allowed.";
        }

        if (
            Object.keys(validationErrors).length
        ) {
            setErrors(validationErrors);
            return;
        }

        const result = await onSave(payload);

        if (result?.success === false) {
            setErrors(result.errors || {});

            setMessage(
                result.message ||
                "Unable to save variant."
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[20px] border border-[#dedfe3] bg-white px-[24px] py-[22px] shadow-[0_2px_7px_rgba(0,0,0,0.04)]"
        >
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2">
                <div>
                    <label className="mb-[7px] block text-[13px] font-semibold text-[#111827]">
                        Variant Name
                    </label>

                    <input
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                            handleChange(
                                "name",
                                event.target.value
                            )
                        }
                        placeholder="e.g. Color, Size, Storage"
                        className={`h-[43px] w-full rounded-[22px] border bg-white px-[14px] text-[13px] outline-none transition-all placeholder:text-[#91959d] focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10 ${
                            errors.name
                                ? "border-red-400"
                                : "border-[#dfe1e5]"
                        }`}
                    />

                    {errors.name && (
                        <p className="mt-[5px] text-[11px] text-red-500">
                            {Array.isArray(errors.name)
                                ? errors.name[0]
                                : errors.name}
                        </p>
                    )}

                    <p className="mt-[7px] max-w-[350px] text-[11px] leading-[1.4] text-[#747982]">
                        Name it “Color” or “Colour” to enable color pickers.
                    </p>
                </div>

                <div>
                    <label className="mb-[7px] block text-[13px] font-semibold text-[#111827]">
                        Visual
                    </label>

                    <div className="relative">
                        <Square
                            size={14}
                            className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#666b73]"
                        />

                        <select
                            value={form.visual_type}
                            onChange={(event) =>
                                handleChange(
                                    "visual_type",
                                    event.target.value
                                )
                            }
                            className="h-[43px] w-full cursor-pointer appearance-none rounded-[22px] border border-[#dfe1e5] bg-white pl-[38px] pr-[40px] text-[13px] outline-none focus:border-[#2065D1]"
                        >
                            {VISUAL_OPTIONS.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[#8b8f96]"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-[20px]">
                <div className="mb-[10px] flex items-center justify-between gap-4">
                    <label className="block text-[13px] font-semibold text-[#111827]">
                        Option Values
                    </label>

                    {isColor && (
                        <span className="rounded-full bg-[#eef5ff] px-[10px] py-[4px] text-[10px] font-medium text-[#2065D1]">
                            Color picker enabled
                        </span>
                    )}
                </div>

                <div className="space-y-[8px]">
                    {form.values.map((item, index) => {
                        const pickerColor =
                            getColorPickerValue(
                                item.color_code
                            );

                        return (
                            <div
                                key={
                                    item.id ||
                                    `new-value-${index}`
                                }
                                className="flex items-center gap-[8px]"
                            >
                                <div className="flex w-[18px] shrink-0 cursor-grab items-center justify-center text-[#a1a4aa]">
                                    <GripVertical size={15} />
                                </div>

                                <div className="relative flex-1">
                                    {isColor && (
                                        <span
                                            className="pointer-events-none absolute left-[14px] top-1/2 h-[12px] w-[12px] -translate-y-1/2 rounded-full border border-black/10 shadow-sm"
                                            style={{
                                                backgroundColor:
                                                    pickerColor,
                                            }}
                                        />
                                    )}

                                    <input
                                        type="text"
                                        value={item.value}
                                        onChange={(event) =>
                                            updateValueField(
                                                index,
                                                "value",
                                                event.target.value
                                            )
                                        }
                                        className={`h-[43px] w-full rounded-[22px] border border-[#dfe1e5] pr-[14px] text-[13px] outline-none focus:border-[#2065D1] ${
                                            isColor
                                                ? "pl-[38px]"
                                                : "pl-[14px]"
                                        }`}
                                    />
                                </div>

                                {isColor && (
                                    <div className="flex h-[43px] shrink-0 items-center gap-[7px] rounded-[22px] border border-[#dfe1e5] bg-white px-[7px]">
                                        <label
                                            className="relative h-[29px] w-[29px] shrink-0 cursor-pointer overflow-hidden rounded-full border border-black/10 shadow-sm"
                                            title="Choose color"
                                            style={{
                                                backgroundColor:
                                                    pickerColor,
                                            }}
                                        >
                                            <input
                                                type="color"
                                                value={pickerColor}
                                                onChange={(event) =>
                                                    updateColorFromPicker(
                                                        index,
                                                        event.target.value
                                                    )
                                                }
                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            />
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                item.color_code ||
                                                pickerColor
                                            }
                                            onChange={(event) =>
                                                updateValueField(
                                                    index,
                                                    "color_code",
                                                    event.target.value.toUpperCase()
                                                )
                                            }
                                            onBlur={(event) =>
                                                handleHexBlur(
                                                    index,
                                                    event.target.value
                                                )
                                            }
                                            maxLength={7}
                                            placeholder="#D1D5DB"
                                            className="h-[29px] w-[78px] bg-transparent text-[11px] font-medium uppercase text-[#454951] outline-none"
                                        />
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeValue(index)
                                    }
                                    title="Delete option value"
                                    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] text-[#73777e] transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-[10px] flex items-center gap-[8px]">
                    {form.values.length > 0 && (
                        <div className="w-[18px] shrink-0" />
                    )}

                    <input
                        type="text"
                        value={newValue}
                        onChange={(event) => {
                            setNewValue(
                                event.target.value
                            );

                            setMessage("");
                        }}
                        onKeyDown={handleNewValueKeyDown}
                        placeholder="Add another value"
                        className="h-[43px] flex-1 rounded-[22px] border border-[#dfe1e5] px-[14px] text-[13px] outline-none placeholder:text-[#858a92] focus:border-[#2065D1]"
                    />

                    {isColor && (
                        <div className="flex h-[43px] shrink-0 items-center gap-[7px] rounded-[22px] border border-[#dfe1e5] bg-white px-[7px]">
                            <label
                                className="relative h-[29px] w-[29px] shrink-0 cursor-pointer overflow-hidden rounded-full border border-black/10 shadow-sm"
                                title="Choose new value color"
                                style={{
                                    backgroundColor:
                                        getColorPickerValue(
                                            newColor
                                        ),
                                }}
                            >
                                <input
                                    type="color"
                                    value={getColorPickerValue(
                                        newColor
                                    )}
                                    onChange={(event) =>
                                        setNewColor(
                                            event.target.value.toUpperCase()
                                        )
                                    }
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                            </label>

                            <input
                                type="text"
                                value={newColor}
                                onChange={(event) =>
                                    setNewColor(
                                        event.target.value.toUpperCase()
                                    )
                                }
                                onBlur={() =>
                                    setNewColor(
                                        normalizeColorCode(
                                            newColor
                                        ) ||
                                        DEFAULT_COLOR_CODE
                                    )
                                }
                                maxLength={7}
                                placeholder="#D1D5DB"
                                className="h-[29px] w-[78px] bg-transparent text-[11px] font-medium uppercase text-[#454951] outline-none"
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={addValue}
                        title="Add option value"
                        className="flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-full border border-[#dfe1e5] bg-white text-[#6f747c] transition-colors hover:border-[#2065D1] hover:text-[#2065D1]"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {errors.values && (
                    <p className="mt-[7px] text-[11px] text-red-500">
                        {Array.isArray(errors.values)
                            ? errors.values[0]
                            : errors.values}
                    </p>
                )}

                {message && (
                    <p className="mt-[7px] text-[11px] text-red-500">
                        {message}
                    </p>
                )}
            </div>

            <div className="mt-[25px] flex items-center justify-between gap-4">
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                        if (mode === "edit") {
                            onDelete?.(variant);
                        } else {
                            onCancel?.();
                        }
                    }}
                    className="h-[37px] min-w-[90px] rounded-[19px] border border-red-300 bg-white px-[18px] text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                    {mode === "edit"
                        ? "Delete"
                        : "Cancel"}
                </button>

                <button
                    type="submit"
                    disabled={saving}
                    className="flex h-[37px] min-w-[92px] items-center justify-center gap-[7px] rounded-[19px] bg-[#2065D1] px-[20px] text-[12px] font-semibold text-white transition-colors hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving && (
                        <LoaderCircle
                            size={14}
                            className="animate-spin"
                        />
                    )}

                    {saving
                        ? "Saving..."
                        : "Save"}
                </button>
            </div>
        </form>
    );
};

export default GlobalVariantForm;