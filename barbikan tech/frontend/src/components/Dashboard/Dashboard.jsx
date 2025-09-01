// Dashboard.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import PurchaseTable from '../Reel Stock/Purchase';
import Purchase1 from '../gum - Ink /Purchase';
import PurchaseForm from '../Reel Stock/PurchaseForm';
import Usage from '../Reel Stock/Usage';

const Dashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PurchaseTable />} />
        <Route path="/purchase1" element={<Purchase1 />} />
        <Route path="/purchase2" element={<PurchaseForm />} />
        <Route path="/usage" element={<Usage />} />
      </Routes>
    </Layout>
  );
};

export default Dashboard;
