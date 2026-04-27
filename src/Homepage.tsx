//src/Homepage.tsx

import './App.css'
import { useState, useEffect } from 'react';
import { Base } from 'airtable';
import { useNavigate, type NavigateFunction } from 'react-router-dom';

interface ProductProps {
  navigate: NavigateFunction
  name: string,
  price: number,
  stock: number,
  category: string,
  vendor: string,
  vendor_id: number,
}
export function ProductProfile({ navigate, name, price, stock, category, vendor, vendor_id }: ProductProps) {
  const categoryImage = `${category}.png`
  return (
    <div className="productContainer home" onClick={(e) =>{
      e.preventDefault();
      navigate(`/Vendor?VendorID=${vendor_id}`);
    }}>
      <div style={{display: "flex", flexDirection: "row"}}>
        <img src={categoryImage} 
        style={{height: "3vw", paddingRight: "7px"}}
        onError={(e) => {
            (e.target as HTMLImageElement).src = "shoppingCart.png";
      }}></img>
        <div style={{display: "flex", flexDirection: "column"}}>
          <p style={{margin: "0.25vw"}}>{`Name: ${name}`}</p>
          <p style={{margin: "0.25vw"}}>{`Price: ${price}`}</p>
          <p style={{margin: "0.25vw"}}>{`Stock: ${stock}`}</p>
          <p style={{margin: "0.25vw"}}>{`Vendor: ${vendor}`}</p>
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
        vendor_id: number,
    }
}

interface CategoryRecord {
    id: string,
    fields: {
        category_id: number,
        name: string,
    }
}

interface HomepageProps {
  base: Base,
  categories: CategoryRecord[],
}

export default function Homepage({ base, categories }: HomepageProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const vendorData = await base('Vendors').select().all();
        setVendors(vendorData as unknown as VendorRecord[]);
        const marketData = await base('Markets').select().all();
        setMarkets(marketData as unknown as MarketRecord[]);
        const products = await base('Products').select({}).firstPage();
        if (products.length > 0) {
          setProducts(products as unknown as ProductRecord[]);
        }
      } catch (error) {
        console.error("Error fetching Airtable data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);


  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();

    // Find the vendor for THIS product to check their name
    const associatedVendor = vendors.find(
      (v) => String(v.id) === String(product.fields.vendor_id)
    );
    
    const associatedCategory = categories.find(
      (c) => String(c.id) === String(product.fields.category_id)
    );

    const vendorName = associatedVendor?.fields.name || "";
    const categoryName = associatedCategory?.fields.name || "";
    const productName = product.fields.name || "";

    return (
      productName.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower) ||
      vendorName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
    <div className="mainFrame">
      <div className="header">
        <img src="longMarketHeader.png" style={{width: "100%", height: "10vw"}}></img>
        <p style={{position: "absolute", top: "0%", left: "50%", transform: "translate(-50%, -70%)", fontSize: "max(40px, 6vw)",
          WebkitTextStroke: "2px #786064", fontWeight: "bold", color: "#ffffff", whiteSpace: "nowrap",
        }}>Market Manager</p>
      </div>
      <div style={{display: "flex", flexDirection: "row", height: "100%"}}>
        <div className="vendorList">
          <h1>Vendor Info</h1>
          
          {loading ? (
            <p>Loading vendors...</p>
          ) : (
            <ul>
              {vendors.map((vendor) => (
                <li key={vendor.id}>
                  <strong>{vendor.fields.name}</strong> <a href="#"
                  onClick={(e) =>{
                    e.preventDefault();
                    navigate(`/Vendor?VendorID=${vendor.fields.vendor_id}`);
                  }}>{vendor.fields.email}</a>
                </li>
              ))}
            </ul>
          )}
          {vendors.length === 0 && !loading && <p>No vendors found.</p>}
          </div>

          <div className="mainBody">
            <input className="searchBar" placeholder='Search...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}>
            </input>
            <div className="searchResults">
            {filteredProducts.map((product) => {
              if (!product.fields.name) return null;

              const associatedVendor = vendors.find(
                (v) => String(v.id) === String(product.fields.vendor_id)
              );

              const associatedCategory = categories.find(
                (c) => String(c.id) === String(product.fields.category_id)
              );

              return (
                <ProductProfile
                  navigate={navigate}
                  key={product.id}
                  name={product.fields.name}
                  price={product.fields.price}
                  stock={product.fields.stock}
                  category={associatedCategory ? associatedCategory.fields.name : "Unknown Category"}
                  vendor={associatedVendor ? associatedVendor.fields.name : "Unknown Vendor"}
                  vendor_id={associatedVendor ? associatedVendor.fields.vendor_id : -1}
                />
              );
            })}
            </div>
          </div>

          <div className="marketList">
            <h1>Market Info</h1>
              {loading ? (
                <p>Loading markets...</p>
              ) : (
                <ul>
                  {markets.map((market) => (
                    <li key={market.id}>
                      <strong>{market.fields.organizer}</strong>
                      <a href={`https://www.google.com/search?q=${market.fields.address}`} target="_blank">
                        {market.fields.address}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {markets.length === 0 && !loading && <p>No vendors found.</p>}
          </div>
        </div>
    </div>
    </>
  )
}