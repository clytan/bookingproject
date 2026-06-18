'use client';

import AuthGuard from '../../../components/AuthGuard';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import ActivityForm from '../../../components/ActivityForm';
import '../../Dashboard.css';
import '../../bookings/new/NewBooking.css';

export default function NewActivityPage() {
  return (
    <AuthGuard>
      <div className="m-layout">
        <Sidebar />
        <div className="m-main">
          <Header title="New Activity" subtitle="Add a new water activity to your company" />
          <div className="m-content">
            <ActivityForm />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
