import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. ส่งข้อมูลไปที่ Backend
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      
      // 2. ตรวจสอบว่ามีข้อมูลส่งกลับมาจริง
      if (res.data.token) {
        // --- 🚩 บันทึกข้อมูลลงเครื่อง (ปรับปรุงตามโครงสร้าง Backend ล่าสุด) ---
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('userName', res.data.userName);
        
        // บันทึกรายชื่อตู้ (Array)
        const assigned = res.data.assignedMachines || [];
        localStorage.setItem('assignedMachines', JSON.stringify(assigned));
        
        alert(`ยินดีต้อนรับคุณ ${res.data.userName}`);
        onLoginSuccess(); 
      }
    } catch (err) {
      // แสดง Error Message จาก Backend (ถ้ามี)
      const errorMsg = err.response?.data?.msg || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
      alert(errorMsg);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#003366', fontWeight: '900', marginBottom: '10px' }}>
          SmartBee <span style={{ color: '#fbbf24' }}>Box</span>
        </h2>
        <p style={{ color: '#64748b', marginBottom: '25px' }}>กรุณาเข้าสู่ระบบ</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" placeholder="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} style={inputStyle} required 
          />
          <input 
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} required 
          />
          <button type="submit" style={buttonStyle}>เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  );
};

// --- Styles (คงเดิม) ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' };
const loginBoxStyle = { backgroundColor: '#fff', padding: '50px', borderRadius: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', width: '350px' };
const inputStyle = { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '15px', borderRadius: '15px', border: 'none', backgroundColor: '#003366', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: '0.3s' };

export default Login;