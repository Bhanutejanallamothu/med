import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/Dashboard.css';

function DashboardAdmin() {
  const Card = ({ title, icon }) => (
    <div className="dashboard-card">
      <div className="dashboard-card-icon">{icon}</div>
      <div className="dashboard-card-content">
        <h3>{title}</h3>
        {/* <p>Subhead</p> */}
      </div>
    </div>
  );

  const cardData = [
    { title: "Camp Analytics", icon: "📊", path: "/analytics" },
    { title: "Update Doctor Availability", icon: "📅", path: "/doctor-availability" },
    { title: "Update Medicine Stock", icon: "💊", path: "/update-medicine-stock" },
    {title: "View Doctors" , icon: "👨‍⚕️" , path: "/get-doctors"},
    { title: "View Medicines", icon: "💊", path: "/get-medicines" },
    { title: "View Volunteers", icon: "👥", path: "/get-volunteers" },
    { title: "View Patients", icon: "😷", path: "/view-patients" },
    { title: "Add New Medicine", icon: "💊", path: "/add-new-medicine" },
    { title: "Add Doctor", icon: "👨‍⚕️", path: "/add-doctor" },
    { title: "Add Volunteer", icon: "👥", path: "/add-volunteer" },
    { title: "View Logs", icon: "📜", path: "/log" },
  ];

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-card-container">
        {cardData.map((card, index) => (
          <Link to={card.path} key={index} className="dashboard-card-link">
            <Card title={card.title} icon={card.icon} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DashboardAdmin;
