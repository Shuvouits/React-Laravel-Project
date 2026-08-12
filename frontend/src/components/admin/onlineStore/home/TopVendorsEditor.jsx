const TopVendorsEditor = ({ value, onChange }) => {
  return (
    <div className="rounded-[14px] border border-[#e0e1e4] bg-[#fbfbfc] p-[14px]">
      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[2px] text-[#676b72]">
            Section Title
          </label>

          <input
            type="text"
            value={value?.title || ""}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="Top Vendors"
            className="h-[40px] w-full rounded-[10px] border border-[#dedfe3] bg-white px-[13px] text-[13px] outline-none focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
          />
        </div>

        <div>
          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[2px] text-[#676b72]">
            Max Vendors
          </label>

          <input
            type="number"
            min="1"
            max="24"
            value={value?.max_vendors || 8}
            onChange={(e) => onChange("max_vendors", e.target.value)}
            className="h-[40px] w-full rounded-[10px] border border-[#dedfe3] bg-white px-[13px] text-[13px] outline-none focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
          />
        </div>
      </div>
    </div>
  );
};

export default TopVendorsEditor;