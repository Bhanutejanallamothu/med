import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/Dashboard.css';

function Dashboard() {
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
    { title: "1. Token Generation", icon: "🎟️", path: "/token" },
    { title: "2. Patient Registration", icon: "👤", path: "/patient-registration" },
    { title: "3. Patients Waiting", icon: "⏳", class:"in-progress" },
    { title: "4. Doctor assigning", icon: "👨‍⚕️", path: "/doctor-assigning" },
    // { title: "5.2 Doctor assigning automatic", icon: "👨‍⚕️", path: "/doctor-assigning-automatic" },
    { title: "5. Vitals", icon: "💓", path: "/vitals" },
    { title: "6. Doctor Prescription", icon: "📝", path: "/doctor-prescription" },
    { title: "7. Medicine Verification", icon: "💊", path: "/medicine-pickup" },
    { title: "8. Patient Status", icon: "🔍", path:"/patient-status" },
    { title: "9. Counselling", icon: "🗣️", path:"/counselling" },
    { title: "10. Doctor Assitance", icon: "👩‍⚕️", class:"in-progress" },
    { title: "11. View Queues", icon: "📋", class: "in-progress" },
    { title: "12. Medicine Delivery", icon: "🚚", class:"in-progress" },
    { title: "13. Lab", icon: "🔬", class:"in-progress" },
    { title: "14. Patient Support", icon: "🤝", class:"in-progress" },
    { title: "15. Food", icon: "🍽️", class:"in-progress" },
  ];


  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-card-container">
        {cardData.map((card, index) => (
          <Link to={card.path} key={index} className={`dashboard-card-link ${card.class}`}>
            <Card title={card.title} icon={card.icon} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
