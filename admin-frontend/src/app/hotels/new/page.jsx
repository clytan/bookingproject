'use client';

import AuthGuard from '../../../components/AuthGuard.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Header from '../../../components/Header.jsx';
import HotelForm from '../../../components/HotelForm.jsx';
import '../../../styles/Dashboard.css';

export default function NewHotelPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="New Hotel" subtitle="Add a new property to the platform" />
          <div className="dashboard-content">
            <HotelForm title="Create new hotel" />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
