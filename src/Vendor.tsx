// src/VendorProfile.tsx
import { useEffect, useState } from 'react';
import './Vendor.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Base } from 'airtable';

interface ProductProps {
    name: string,
    price: number,
    stock: number,
    category: string,
}

export function ProductProfile({ name, price, stock, category }: ProductProps) {
    const categoryImage = `../${category}.png`
    console.log(categoryImage);
    return (
        <div className="productContainer">
            <div style={{display: "flex", flexDirection: "row"}}>
                <img src={categoryImage} 
                style={{height: "5vw", paddingRight: "10px"}}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "../shoppingCart.png";
                }}></img>
                <div style={{display: "flex", flexDirection: "column"}}>
                    <p className="productText">{`Name: ${name}`}</p>
                    <p className="productText">{`Price: ${price}`}</p>
                    <p className="productText">{`Stock: ${stock}`}</p>
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

    const timeRange = `${formatTime(startDate)} - ${formatTime(endDate)}`;

    return { dateFormatted, timeRange };
};

interface MarketProps {
    organizer: string,
    date: Date,
    address: string,
    duration: number,
}

export function MarketProfile({ organizer, date, address, duration }: MarketProps) {
    const { dateFormatted, timeRange } = formatMarketInfo(date, duration);
    return (
        <div className="marketContainer">
            <div style={{display: "flex", flexDirection: "row"}}>
                <img src="../market.png" style={{height: "8vw", paddingRight: "10px"}}></img>
                <div style={{display: "flex", flexDirection: "column"}}>
                    <p className="productText">{`Organizer: ${organizer}`}</p>
                    <p className="productText">{`Date: ${dateFormatted}`}</p>
                    <p className="productText">{`Time: ${timeRange}`}</p>
                    <p className="productText">
                        Address: <span style={{ textDecoration: "underline" }}>{address}</span>
                        </p>
                </div>
            </div>
        </div>
    )
}

interface VendorRecord {
  id: string,
  fields: {
    vendor_id: number,
    name: string,
    email: string,
  }
}

interface ProductRecord {
    id: string,
    fields: {
        product_id: number,
        category_id: number,
        name: string,
        price: number,
        stock: number,
        deals: string,
        description: string,
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

interface CategoryRecord {
    id: string,
    fields: {
        category_id: number,
        name: string,
    }
}

interface VendorProfileProps {
  base: Base,
  categories: CategoryRecord[],
}

export default function VendorProfile({ base, categories }: VendorProfileProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");

    const [vendor, setVendor] = useState<VendorRecord | null>(null);
    const [products, setProducts] = useState<ProductRecord[] | null>(null);
    const [markets, setMarkets] = useState<MarketRecord[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const vendorId = searchParams.get("VendorID");

    useEffect(() => {
        const fetchProducts = async () => {
            if (!vendorId) return;
            try {
                const products = await base('Products').select({
                filterByFormula: `{vendor_id} = ${vendorId}`
                }).firstPage();

                if (products.length > 0) {
                    setProducts(products as unknown as ProductRecord[]);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoadingProducts(false);
            }
        };
        const fetchMarkets = async () => {
            if (!vendorId) return;
            try {
                const attendanceRecords = await base('VendorAttendance').select({
                    filterByFormula: `{vendor_id} = ${vendorId}`
                }).all();

                const marketIds = attendanceRecords.map(rec => rec.fields.market_id);

                if (marketIds.length === 0) {
                    setMarkets([]);
                    return;
                }

                const marketQuery = `OR(${marketIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
                const marketData = await base('Markets').select({
                    filterByFormula: marketQuery
                }).all();

                setMarkets(marketData as unknown as MarketRecord[]);
            } catch (error) {
                console.error("Error fetching market data:", error);
            } finally {
            }
        };
        const fetchVendor = async () => {
            if (!vendorId) return;
            try {

                const records = await base('Vendors').select({
                filterByFormula: `{vendor_id} = ${vendorId}`,
                maxRecords: 1
                }).firstPage();

                if (records.length > 0) {
                    setVendor(records[0] as unknown as VendorRecord);
                }
                fetchProducts();
                fetchMarkets();
            } catch (error) {
                console.error("Error fetching vendor:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVendor();
    }, [base, vendorId]);

    if (loading) return <p>Loading...</p>;
    if (!vendor) return <p>Vendor not found.</p>;

    const nameParts = vendor.fields.name.trim().split(/\s+/);
    const fname = nameParts[0].toLocaleLowerCase();
    const lname = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLocaleLowerCase() : "";
    const profileImage = `../${fname}${lname}.png`;

    return (
        <div className="profileFrame">
            <div className="profileHeader">
                <button 
                    className="backButton" 
                    onClick={() => navigate('/')}
                >
                    ← Back
                </button>
                <img src={profileImage} 
                style={{height: "100%"}} 
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "../userProfile.png";
                }}></img>
                <div className="description">
                    <h1 style={{margin: "0", padding: "0", paddingTop: "10px"}}>{vendor.fields.name}</h1>
                    <h2 style={{margin: "0", padding: "0", paddingTop: "10px"}}>Market Vendor</h2>
                    <h3>{vendor.fields.email}</h3>
                </div>
            </div>
            <div className="tabs">

                <div className={`tabButton ${activeTab == 0 ? 'active' : ''}`}
                onClick={() => {setActiveTab(0);}}
                >
                    Products
                </div>

                <div className={`tabButton ${activeTab == 1 ? 'active' : ''}`}
                onClick={() => {setActiveTab(1);}}
                >
                    Markets
                </div>
                
            </div>
            {loadingProducts ? <h1 style={{marginLeft: "0.5vw"}}>Loading...</h1> : (<>
            <h1 style={{margin: "0.25vw 0 0 1vw"}}>Products</h1>
            <div className="vendorContent">
                {activeTab == 0 && products?.map((product) => {
                    let associatedCategory = categories.find(
                        (c) => String(c.id) == String(product.fields.category_id)
                    );

                    return (
                        <ProductProfile 
                            key={product.id}
                            name={product.fields.name}
                            price={product.fields.price}
                            stock={product.fields.stock}
                            category={associatedCategory ? associatedCategory.fields.name : "Uncategorized"}
                        />
                    );
                })}
                {activeTab==1 && markets?.map((market) => (
                    <MarketProfile 
                        key={market.id}
                        organizer={market.fields.organizer}
                        date={market.fields.date}
                        address={market.fields.address}
                        duration={market.fields.duration}
                    />
                ))}
            </div>
            </>)}
        </div>
    );
}