'use client';

import AuthGuard from '../../../components/AuthGuard.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Header from '../../../components/Header.jsx';
import OperatorForm from '../../../components/OperatorForm.jsx';
import '../../../styles/Dashboard.css';
import '../../../styles/AdminList.css';
import '../../../styles/HotelForm.css';

export default function NewOperatorPage() {
  return (
    <AuthGuard>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header title="New Operator" subtitle="Add a water sports company" />
          <div className="dashboard-content">
            <OperatorForm />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
