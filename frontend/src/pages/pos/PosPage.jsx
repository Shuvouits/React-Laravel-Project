import { useEffect, useState } from "react";

const PosPage = ({ role }) => {
    const [location, setLocation] = useState(null);

    useEffect(() => {
        console.log("POS role:", role);
    }, [role]);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#f6f7fb] p-6">
            <div className="mx-auto max-w-[1800px]">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-[#111827]">
                        Point of Sale
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage your sales and checkout.
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-gray-500">
                        POS is loading...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosPage;