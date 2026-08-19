import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Shapes,
  Star,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

const DEFAULT_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  featured: 0,
  your_branded_products: 0,
};

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
  total: 0,
};

const VendorBrands = () => {
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [stats, setStats] = useState({ ...DEFAULT_STATS });
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ ...DEFAULT_PAGINATION });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vendor/brands", {
        params: {
          tab: activeTab,
          search: search || undefined,
          page,
          per_page: 10,
        },
      });

      const responseData = response.data || {};
      const brandData = responseData.brands || {};

      setBrands(Array.isArray(brandData.data) ? brandData.data : []);
      setStats({ ...DEFAULT_STATS, ...(responseData.stats || {}) });
      setPagination({
        current_page: Number(brandData.current_page) || 1,
        last_page: Number(brandData.last_page) || 1,
        from: Number(brandData.from) || 0,
        to: Number(brandData.to) || 0,
        total: Number(brandData.total) || 0,
      });
    } catch (error) {
      console.error("Vendor brands load error:", error);
      setError(error.response?.data?.message || "Unable to load brands.");
      setBrands([]);
      setStats({ ...DEFAULT_STATS });
      setPagination({ ...DEFAULT_PAGINATION });
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="min-h-[calc(100vh-74px)] bg-[#f6f7f8] px-5 py-5 font-['Inter']">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-[18px] flex flex-col gap-[14px] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#202124]">Brands</h1>
            <p className="mt-[4px] text-[12px] text-[#777]">
              Use approved catalog brands or submit your own brand for approval.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/vendor/products/brands/new")}
            className="inline-flex h-[39px] items-center justify-center gap-[7px] rounded-[9px] bg-[#2065D1] px-[15px] text-[12px] font-semibold text-white transition hover:bg-[#1858bd]"
          >
            <Plus size={15} strokeWidth={2.2} />
            Add Brand
          </button>
        </div>

        <div className="mb-[18px] grid grid-cols-1 gap-[11px] sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<Shapes size={17} />} label="Total brands" value={stats.total} />
          <StatCard icon={<BadgeCheck size={17} />} label="Active brands" value={stats.active} />
          <StatCard icon={<CircleOff size={17} />} label="Inactive brands" value={stats.inactive} />
          <StatCard icon={<Star size={17} />} label="Featured brands" value={stats.featured} />
          <StatCard icon={<Package size={17} />} label="Your branded products" value={stats.your_branded_products} />
        </div>

        <div className="overflow-hidden rounded-[15px] border border-[#dedfe2] bg-white shadow-[0_2px_7px_rgba(0,0,0,0.035)]">
          <div className="flex flex-col gap-[13px] border-b border-[#e6e7e9] px-[17px] py-[15px] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-[9px]">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#f1f5ff] text-[#2065D1]">
                <Boxes size={17} />
              </div>

              <div>
                <h2 className="text-[14px] font-bold text-[#222]">Brands</h2>
                <p className="mt-[1px] text-[10px] text-[#888]">Catalog and vendor brands available to your store.</p>
              </div>
            </div>

            <form onSubmit={submitSearch} className="flex w-full gap-[8px] lg:w-auto">
              <div className="relative flex-1 lg:w-[280px]">
                <Search
                  size={14}
                  className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#888]"
                />

                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search brands"
                  className="h-[36px] w-full rounded-[9px] border border-[#dedfe2] bg-white pl-[33px] pr-[32px] text-[11px] outline-none focus:border-[#9eb8e2] focus:ring-2 focus:ring-[#eef4ff]"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-[9px] top-1/2 -translate-y-1/2 text-[#888]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="h-[36px] rounded-[9px] bg-[#202124] px-[13px] text-[11px] font-semibold text-white"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto border-b border-[#e6e7e9] px-[17px]">
            <div className="flex min-w-max items-center gap-[20px]">
              <TabButton active={activeTab === "all"} label="All" onClick={() => changeTab("all")} />
              <TabButton active={activeTab === "active"} label="Active" onClick={() => changeTab("active")} />
              <TabButton active={activeTab === "pending"} label="Pending" onClick={() => changeTab("pending")} />
              <TabButton active={activeTab === "inactive"} label="Inactive" onClick={() => changeTab("inactive")} />
              <TabButton active={activeTab === "rejected"} label="Rejected" onClick={() => changeTab("rejected")} />
            </div>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-[17px] py-[11px] text-[11px] text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-[#e6e7e9] bg-[#fafafa]">
                  <TableHead className="w-[34%]">Brand</TableHead>
                  <TableHead className="w-[17%]">Your products</TableHead>
                  <TableHead className="w-[18%]">Approval</TableHead>
                  <TableHead className="w-[18%]">Status</TableHead>
                  <TableHead align="right" className="w-[13%]">Actions</TableHead>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <LoadingRows />
                ) : brands.length === 0 ? (
                  <EmptyRow
                    activeTab={activeTab}
                    search={search}
                    onAdd={() => navigate("/vendor/brands/new")}
                  />
                ) : (
                  brands.map((brand) => (
                    <BrandRow
                      key={brand.id}
                      brand={brand}
                      onEdit={() => navigate(`/vendor/products/brands/${brand.id}/edit`)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.total > 0 && (
            <div className="flex flex-col gap-[10px] border-t border-[#e6e7e9] px-[17px] py-[13px] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-[#777]">
                Showing {pagination.from} to {pagination.to} of {pagination.total} brands
              </p>

              <div className="flex items-center gap-[7px]">
                <PaginationButton
                  disabled={pagination.current_page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={14} />
                </PaginationButton>

                <span className="min-w-[58px] text-center text-[10px] font-medium text-[#666]">
                  {pagination.current_page} / {pagination.last_page}
                </span>

                <PaginationButton
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))}
                >
                  <ChevronRight size={14} />
                </PaginationButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BrandRow = ({ brand, onEdit }) => {
  const isVendorBrand = brand.source === "vendor";
  const canEdit = Boolean(brand.can_edit);

  return (
    <tr className="border-b border-[#ececef] last:border-b-0 hover:bg-[#fcfcfd]">
      <td className="px-[17px] py-[13px]">
        <div className="flex items-center gap-[11px]">
          <BrandLogo brand={brand} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[6px]">
              <p className="max-w-[250px] truncate text-[12px] font-semibold text-[#242424]">
                {brand.name}
              </p>
              <SourceBadge vendor={isVendorBrand} />
            </div>

            {brand.website && (
              <p className="mt-[3px] max-w-[270px] truncate text-[9px] text-[#999]">
                {brand.website}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-[17px] py-[13px]">
        <div className="inline-flex items-center gap-[6px] text-[11px] font-medium text-[#444]">
          <Package size={13} className="text-[#8a8a8a]" />
          {Number(brand.products_count || 0)}
        </div>
      </td>

      <td className="px-[17px] py-[13px]">
        <ApprovalBadge status={brand.approval_status} />
      </td>

      <td className="px-[17px] py-[13px]">
        <StatusBadge status={brand.status} />
      </td>

      <td className="px-[17px] py-[13px] text-right">
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            title="Edit brand"
            className="inline-flex h-[31px] w-[31px] items-center justify-center rounded-[8px] border border-[#dedfe2] bg-white text-[#555] transition hover:border-[#b9c9e3] hover:bg-[#f6f9ff] hover:text-[#2065D1]"
          >
            <Pencil size={13} />
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="Catalog brand"
            className="inline-flex h-[31px] w-[31px] cursor-default items-center justify-center rounded-[8px] border border-[#e4e5e7] bg-[#fafafa] text-[#9a9a9a]"
          >
            <Eye size={13} />
          </button>
        )}
      </td>
    </tr>
  );
};

const BrandLogo = ({ brand }) => {
  if (brand.logo_url) {
    return (
      <div className="flex h-[39px] w-[39px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-[#e2e3e5] bg-white">
        <img
          src={brand.logo_url}
          alt={brand.name || "Brand"}
          className="h-full w-full object-contain p-[4px]"
        />
      </div>
    );
  }

  const initial = String(brand.name || "B").charAt(0).toUpperCase();

  return (
    <div className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-[9px] bg-[#f0f2f5] text-[14px] font-bold text-[#666]">
      {initial}
    </div>
  );
};

const SourceBadge = ({ vendor }) => (
  <span
    className={`inline-flex items-center rounded-full px-[7px] py-[2px] text-[8px] font-semibold ${
      vendor ? "bg-[#f0ebff] text-[#7250c7]" : "bg-[#edf3ff] text-[#376bc2]"
    }`}
  >
    {vendor ? "Your brand" : "Official"}
  </span>
);

const ApprovalBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved") {
    return (
      <Badge className="bg-[#eaf7ee] text-[#248447]">
        <BadgeCheck size={11} />
        Approved
      </Badge>
    );
  }

  if (normalized === "pending") {
    return (
      <Badge className="bg-[#fff5dd] text-[#9a7000]">
        <Clock3 size={11} />
        Pending
      </Badge>
    );
  }

  if (normalized === "rejected") {
    return (
      <Badge className="bg-[#fdecec] text-[#c34949]">
        <CircleOff size={11} />
        Rejected
      </Badge>
    );
  }

  return <Badge className="bg-[#f0f1f3] text-[#777]">{status || "Unknown"}</Badge>;
};

const StatusBadge = ({ status }) => {
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-full px-[8px] py-[4px] text-[9px] font-semibold ${
        active ? "bg-[#edf3ff] text-[#2864cc]" : "bg-[#f0f1f3] text-[#777]"
      }`}
    >
      <span className={`h-[5px] w-[5px] rounded-full ${active ? "bg-[#3674db]" : "bg-[#999]"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="min-h-[82px] rounded-[13px] border border-[#dedfe2] bg-white px-[14px] py-[13px] shadow-[0_2px_7px_rgba(0,0,0,0.025)]">
    <div className="flex items-start justify-between gap-[10px]">
      <div>
        <p className="text-[10px] font-medium text-[#777]">{label}</p>
        <p className="mt-[7px] text-[19px] font-bold tracking-[-0.02em] text-[#202124]">
          {Number(value || 0)}
        </p>
      </div>

      <div className="flex h-[31px] w-[31px] items-center justify-center rounded-[8px] bg-[#f2f5fb] text-[#5f6f86]">
        {icon}
      </div>
    </div>
  </div>
);

const TabButton = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative h-[42px] text-[11px] font-medium ${active ? "text-[#202124]" : "text-[#777]"}`}
  >
    {label}
    {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#2065D1]" />}
  </button>
);

const TableHead = ({ children, align = "left", className = "" }) => (
  <th
    className={`px-[17px] py-[11px] text-[9px] font-semibold uppercase tracking-[0.03em] text-[#777] ${
      align === "right" ? "text-right" : "text-left"
    } ${className}`}
  >
    {children}
  </th>
);

const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center gap-[5px] rounded-full px-[8px] py-[4px] text-[9px] font-semibold ${className}`}>
    {children}
  </span>
);

const LoadingRows = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="border-b border-[#ececef]">
      <td className="px-[17px] py-[14px]">
        <div className="flex animate-pulse items-center gap-[11px]">
          <div className="h-[39px] w-[39px] rounded-[9px] bg-[#eceef1]" />

          <div>
            <div className="h-[9px] w-[100px] rounded bg-[#eceef1]" />
            <div className="mt-[7px] h-[7px] w-[70px] rounded bg-[#f0f1f3]" />
          </div>
        </div>
      </td>

      <LoadingCell />
      <LoadingCell />
      <LoadingCell />

      <td className="px-[17px] py-[14px]">
        <div className="ml-auto h-[30px] w-[30px] animate-pulse rounded-[8px] bg-[#eceef1]" />
      </td>
    </tr>
  ));
};

const LoadingCell = () => (
  <td className="px-[17px] py-[14px]">
    <div className="h-[23px] w-[70px] animate-pulse rounded-full bg-[#eceef1]" />
  </td>
);

const EmptyRow = ({ activeTab, search, onAdd }) => (
  <tr>
    <td colSpan="5" className="px-5 py-[54px] text-center">
      <div className="mx-auto flex h-[45px] w-[45px] items-center justify-center rounded-full bg-[#f1f3f5] text-[#777]">
        <Shapes size={19} />
      </div>

      <h3 className="mt-[12px] text-[13px] font-semibold text-[#333]">No brands found</h3>

      <p className="mx-auto mt-[4px] max-w-[320px] text-[10px] leading-[1.5] text-[#888]">
        {search
          ? `No brands matched "${search}".`
          : activeTab === "pending"
            ? "You do not have any brands waiting for approval."
            : activeTab === "rejected"
              ? "You do not have any rejected brands."
              : "No brands are available in this section yet."}
      </p>

      {activeTab === "all" && !search && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-[14px] inline-flex h-[35px] items-center gap-[6px] rounded-[8px] bg-[#2065D1] px-[13px] text-[10px] font-semibold text-white"
        >
          <Plus size={13} />
          Add Brand
        </button>
      )}
    </td>
  </tr>
);

const PaginationButton = ({ children, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] border border-[#dedfe2] bg-white text-[#555] transition hover:bg-[#f6f7f8] disabled:cursor-not-allowed disabled:opacity-35"
  >
    {children}
  </button>
);

export default VendorBrands;
