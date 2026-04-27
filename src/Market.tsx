import { useEffect, useState } from 'react';
import './Vendor.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Base } from 'airtable';

interface AttendingVendorProps {
    name: string,
    email: string,
    onClick: () => void;
}

export function AttendingVendor({ name, email, onClick }: AttendingVendorProps) {
    const nameParts = name.trim().split(/\s+/);
    const fname = nameParts[0].toLocaleLowerCase();
    const lname = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLocaleLowerCase() : "";
    const profileImage = `${fname}${lname}.png`;

    return (
        <div className="productContainer" onClick={onClick} style={{ cursor: 'pointer' }}>
            <div style={{ display: "flex", flexDirection: "row" }}>
                <img 
                    src={profileImage} 
                    style={{ height: "5vw", width: "5vw", objectFit: "cover", borderRadius: "50%", paddingRight: "10px" }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "userProfile.png";
                    }}
                />
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <p className="productText" style={{ fontWeight: 'bold' }}>{name}</p>
                    <p className="productText">{email}</p>
                </div>
            </div>
        </div>
    )
}

const formatMarketInfo = (dateString: string | Date, durationSeconds: number) => {
    const startDate = new Date(dateString);
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
    const month = startDate.toLocaleString('default', { month: 'long' });
    const day = startDate.getDate();
    const year = startDate.getFullYear();

    const getSuffix = (d: number) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };

    const dateFormatted = `${month} ${day}${getSuffix(day)}, ${year}`;
    const formatTime = (date: Date) => {
        const hours = date.getHours();
        const ampm = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        const minutes = date.getMinutes();
        const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
        return `${displayHours}${displayMinutes}${ampm}`;
    };

    return { dateFormatted, timeRange: `${formatTime(startDate)} - ${formatTime(endDate)}` };
};

interface VendorRecord {
    id: string,
    fields: {
        vendor_id: number,
        name: string,
        email: string,
    }
}

interface MarketRecord {
    id: string,
    fields: {
        market_id: number;
        organizer: string,
        date: Date,
        duration: number,
        address: string,
    }
}

interface MarketProfileProps {
    base: Base,
}

export default function MarketProfile({ base }: MarketProfileProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [market, setMarket] = useState<MarketRecord | null>(null);
    const [vendors, setVendors] = useState<VendorRecord[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingVendors, setLoadingVendors] = useState(true);

    const marketId = searchParams.get("MarketID"); // Assuming you pass MarketID in URL

    useEffect(() => {
        const fetchMarketAndVendors = async () => {
            if (!marketId) return;
            setLoading(true);
            setLoadingVendors(true);

            try {
                const marketRecords = await base('Markets').select({
                    filterByFormula: `{market_id} = ${marketId}`,
                    maxRecords: 1
                }).firstPage();

                if (marketRecords.length === 0) {
                    setMarket(null);
                    setLoading(false);
                    return;
                }

                const currentMarket = marketRecords[0] as unknown as MarketRecord;
                setMarket(currentMarket);

                const attendanceRecords = await base('VendorAttendance').select({
                    filterByFormula: `{market_id} = ${marketId}`
                }).all();

                console.log("Attendance Records found:", attendanceRecords.length);

                const vendorIds = attendanceRecords.map(rec => {
                    const v = rec.fields.vendor_id;
                    return Array.isArray(v) ? v[0] : v;
                }).filter(Boolean);

                if (vendorIds.length === 0) {
                    setVendors([]);
                } else {
                    const vendorQuery = `OR(${vendorIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
                    const vendorData = await base('Vendors').select({
                        filterByFormula: vendorQuery
                    }).all();
                    setVendors(vendorData as unknown as VendorRecord[]);
                }

            } catch (error) {
                console.error("Error in Market data chain:", error);
            } finally {
                setLoading(false);
                setLoadingVendors(false);
            }
        };

        fetchMarketAndVendors();
    }, [base, marketId]);

    if (loading) return <p>Loading...</p>;
    if (!market) return <p>Market not found.</p>;

    const { dateFormatted, timeRange } = formatMarketInfo(market.fields.date, market.fields.duration);

    return (
        <div className="profileFrame">
            <div className="profileHeader">
                <button className="backButton" onClick={() => navigate('/')}>← Back</button>
                <img src="market.png" style={{ height: "100%" }} />
                <div className="description">
                    <h1 style={{ margin: "0", padding: "0", paddingTop: "10px" }}>{market.fields.organizer}</h1>
                    <h2 style={{ margin: "0", padding: "0", paddingTop: "10px" }}>{dateFormatted}</h2>
                    <h3>{timeRange}</h3>
                    <p style={{ textDecoration: 'underline' }}>{market.fields.address}</p>
                </div>
            </div>

            <h1 style={{ margin: "1vw 0 0 1vw" }}>Attending Vendors</h1>
            
            <div className="vendorContent">
                {loadingVendors ? (
                    <h1 style={{ marginLeft: "0.5vw" }}>Loading Vendors...</h1>
                ) : (
                    vendors?.map((v) => (
                        <AttendingVendor 
                            key={v.id}
                            name={v.fields.name}
                            email={v.fields.email}
                            onClick={() => navigate(`/Vendor?VendorID=${v.fields.vendor_id}`)}
                        />
                    ))
                )}
                {vendors?.length === 0 && !loadingVendors && <p style={{ marginLeft: "1vw" }}>No vendors registered for this market yet.</p>}
            </div>
        </div>
    );
}