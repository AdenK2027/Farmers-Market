//src/App.tsx

import './App.css'
import Airtable from 'airtable';
import VendorProfile from './Vendor';
import MarketProfile from './Market';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Homepage from './Homepage';
import { useEffect, useState } from 'react';

const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || ''; 
const base = new Airtable({ 
  apiKey: import.meta.env.VITE_AIRTABLE_TOKEN 
}).base(baseId);

interface CategoryRecord {
    id: string,
    fields: {
        category_id: number,
        name: string,
    }
}

interface AppRoutesProps {
  categories: CategoryRecord[],
}

function AppRoutes({ categories }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Homepage 
        base={base}
        categories={categories}
      />} />
      <Route path="/Vendor" element={<VendorProfile 
        base={base}
        categories={categories}
      />} />
      <Route path="/Market" element={<MarketProfile 
        base={base}
      />} />
    </Routes>
  );
}

export default function App() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryData = await base('Categories').select().all();
        setCategories(categoryData as unknown as CategoryRecord[]);
      } catch (error) {
          console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  },[])

  return (
    <BrowserRouter basename="/Farmers-Market/">
      <AppRoutes 
      categories={categories}
      />
    </BrowserRouter>
  );
}
