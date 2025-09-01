import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import User from "./components/Dashboard/components/User";
import Layout from "./components/Dashboard/Layout";
import ReelStockPurchaseTable from "./components/reel-stock/Purchase";
import ReelStockSupplierForm from "./components/reel-stock/Supplier";
import ReelStockSwapTable from "./components/reel-stock/Swapping";
import FactoryTable from "./components/Dashboard/components/Factory";
import GumPurchase from "./components/gum-Ink/purchaseEntry";
import GumUsage from "./components/gum-Ink/usage";
import OffsetCompany from "./components/board-stack/Company";
import OffsetJobCardList from "./components/board-stack/Jobcards";
import OffsetMatterList from "./components/board-stack/Matter";
import OffsetStockTab from "./components/board-stack/Stock";
import ReelProduct from "./components/reel-stock/product";
import GumProduct from "./components/gum-Ink/product";
import Protect from "./components/auth/protect";
import Private from "./components/auth/private"; // <- this is your simple auth guard
import ReelStockUsage from "./components/reel-stock/usage";
import GumSupplier from "./components/gum-Ink/supplier";
import GumSwapTable from "./components/gum-Ink/swapping";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}

        {/* Protected Routes (Require login) */}
        <Route element={<Layout />}>
          {/* No role restrictions, only login required */}
          <Route path="/companyList" element={<Private Component={OffsetCompany} />} />
          <Route path="/stockTable" element={<Private Component={OffsetStockTab} />} />
          <Route path="/job-cards" element={<Private Component={OffsetJobCardList} />} />
          <Route path="/matter" element={<Private Component={OffsetMatterList} />} />

          {/* Role Protected */}
          <Route path="/user" element={<Protect Component={User} blockRole="staff" />} />
          <Route path="/factory" element={<Private Component={FactoryTable} />} />

          {/* Reel Stock */}
          <Route path="/reel-stock/purchase" element={<Private Component={ReelStockPurchaseTable} />} />
          <Route path="/reel-stock/usage" element={<Private Component={ReelStockUsage} />} />
          <Route path="/reel-stock/product" element={<Private Component={ReelProduct} />} />
          <Route path="/reel-stock/swapping" element={<Private Component={ReelStockSwapTable} />} />
          <Route path="/reel-stock/supplier" element={<Private Component={ReelStockSupplierForm} />} />

          {/* Gum-Ink */}
          <Route path="/gum-ink/product" element={<Private Component={GumProduct} />} />
          <Route path="/gum-ink/purchase" element={<Private Component={GumPurchase} />} />
          <Route path="/gum-ink/supplier" element={<Private Component={GumSupplier} />} />
          <Route path="/gum-ink/usage" element={<Private Component={GumUsage} />} />
          <Route path="/gum-ink/swapping" element={<Private Component={GumSwapTable} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
