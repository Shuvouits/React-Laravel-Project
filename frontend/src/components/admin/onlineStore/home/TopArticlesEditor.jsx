const TopArticlesEditor = ({
    value,
    onChange,
}) => {
    return (
        <div className="overflow-hidden rounded-[14px] border border-[#e1e3e6] bg-[#fafafa]">
            <div className="grid gap-5 p-[18px]">
                <div>
                    <label
                        htmlFor="top-articles-title"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f737a]"
                    >
                        Title
                    </label>

                    <input
                        id="top-articles-title"
                        type="text"
                        value={
                            value.title
                        }
                        onChange={(
                            event
                        ) =>
                            onChange(
                                "title",
                                event.target.value
                            )
                        }
                        maxLength={255}
                        placeholder="Top Articles"
                        className="h-[43px] w-full rounded-[12px] border border-[#dfe1e5] bg-white px-4 text-[14px] text-[#17181b] outline-none transition focus:border-[#79a8ff] focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label
                        htmlFor="top-articles-limit"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f737a]"
                    >
                        Limit
                    </label>

                    <input
                        id="top-articles-limit"
                        type="number"
                        value={
                            value.limit
                        }
                        onChange={(
                            event
                        ) =>
                            onChange(
                                "limit",
                                event.target.value
                            )
                        }
                        min={1}
                        max={24}
                        className="h-[43px] w-full rounded-[12px] border border-[#dfe1e5] bg-white px-4 text-[14px] text-[#17181b] outline-none transition focus:border-[#79a8ff] focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-1.5 text-[11px] text-[#8a8d94]">
                        Choose between 1 and
                        24 published articles.
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="top-articles-columns"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f737a]"
                    >
                        Desktop columns
                    </label>

                    <select
                        id="top-articles-columns"
                        value={
                            value.desktop_columns
                        }
                        onChange={(
                            event
                        ) =>
                            onChange(
                                "desktop_columns",
                                event.target.value
                            )
                        }
                        className="h-[43px] w-full rounded-[12px] border border-[#dfe1e5] bg-white px-4 text-[14px] text-[#17181b] outline-none transition focus:border-[#79a8ff] focus:ring-2 focus:ring-blue-100"
                    >
                        <option value={2}>
                            2 columns
                        </option>

                        <option value={3}>
                            3 columns
                        </option>

                        <option value={4}>
                            4 columns
                        </option>
                    </select>

                    <p className="mt-1.5 text-[11px] text-[#8a8d94]">
                        Controls how many article
                        cards appear in each
                        desktop row.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TopArticlesEditor;