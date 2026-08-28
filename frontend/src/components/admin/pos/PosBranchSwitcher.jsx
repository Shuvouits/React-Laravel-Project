import { ChevronDown, MapPin } from "lucide-react";

const PosBranchSwitcher = ({
    locations,
    selectedLocationId,
    onChange,
}) => {
    return (
        <div className="mb-6">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#777982]">
                Branch / Location
            </p>

            <div className="relative w-full max-w-[290px]">
                <MapPin
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#01b8af]"
                />

                <select
                    value={selectedLocationId}
                    onChange={onChange}
                    className="h-11 w-full appearance-none rounded-[12px] border border-[#dedfe4] bg-white pl-10 pr-10 text-[14px] font-medium text-[#252832] outline-none focus:border-[#01b8af]"
                >
                    {locations.map((location) => (
                        <option
                            key={location.id}
                            value={location.id}
                        >
                            {location.name}
                            {location.code
                                ? ` (${location.code})`
                                : ""}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8f98]"
                />
            </div>
        </div>
    );
};

export default PosBranchSwitcher;