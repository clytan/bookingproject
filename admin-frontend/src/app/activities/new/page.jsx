'use client';

import AuthGuard from '../../../components/AuthGuard.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Header from '../../../components/Header.jsx';
import ActivityForm from '../../../components/ActivityForm.jsx';
import '../../../styles/Dashboard.css';
import '../../../styles/AdminList.css';
import '../../../styles/HotelForm.css';

export default function NewActivityPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="New Activity" subtitle="Add a new water activity to the platform" />
          <div className="dashboard-content">
            <ActivityForm />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
