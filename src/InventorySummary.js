import React from 'react';
import { Box, PieChart, Activity } from 'lucide-react';

const InventorySummary = ({ data, isSumming }) => {
  // Logic: จัดกลุ่มข้อมูลตามชื่อสินค้า
  const calculateStats = () => {
    const stats = data.reduce((acc, item) => {
      const name = item.product_name;
      if (!acc[name]) {
        acc[name] = { name, count: 0, amount: 0 };
      }
      acc[name].count += Number(item.pay_num || 0);
      acc[name].amount += Number(item.price || 0);
      return acc;
    }, {});
    return Object.values(stats).sort((a, b) => b.count - a.count);
  };

  const productStats = calculateStats();

  if (isSumming) return <div style={{ textAlign: 'center', padding: '50px' }}>กำลังคำนวณยอดสรุป...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '25px', color: '#1e293b' }}>📦 สรุปยอดเบิกรายชนิดไอเทม</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {productStats.map((item, index) => (
          <div key={index} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={iconBoxStyle}><Box size={20} color="#007bff" /></div>
              <span style={badgeStyle}>อันดับ {index + 1}</span>
            </div>
            
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px', height: '3em', overflow: 'hidden' }}>
              {item.name}
            </div>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={labelStyle}>จำนวนที่เบิก</p>
                <p style={valueStyle}>{item.count} <small>กล่อง</small></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={labelStyle}>มูลค่ารวม</p>
                <p style={{ ...valueStyle, color: '#2ecc71' }}>{item.amount.toLocaleString()} <small>฿</small></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Styles สำหรับการ์ดสรุป
const cardStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '20px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid #edf2f7'
};

const iconBoxStyle = {
  background: '#e0f2fe',
  padding: '10px',
  borderRadius: '12px'
};

const badgeStyle = {
  fontSize: '0.7rem',
  background: '#f1f5f9',
  padding: '4px 10px',
  borderRadius: '20px',
  fontWeight: 'bold',
  color: '#64748b'
};

const labelStyle = { margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' };
const valueStyle = { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' };

export default InventorySummary;