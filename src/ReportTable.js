import React from 'react';

const ReportTable = ({ records }) => {
  const formatThaiDate = (dateString) => {
    if (!dateString) return { date: "-", time: "" };
    const dateObj = new Date(dateString);
    
    const date = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });

    // เพิ่มวินาที (second: '2-digit')
    const time = dateObj.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return { date, time };
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            {/* ปรับความกว้างเป็น 25% เพื่อให้ วันที่ + เวลา + วินาที อยู่บรรทัดเดียวพอดี */}
            <th style={{ ...headerStyle, width: '25%', textAlign: 'left' }}>วันที่ - เวลาที่เบิก</th>
            <th style={{ ...headerStyle, width: '35%', textAlign: 'left' }}>สินค้า</th>
            <th style={{ ...headerStyle, width: '15%', textAlign: 'left' }}>พนักงาน</th>
            <th style={{ ...headerStyle, width: '10%', textAlign: 'center' }}>จำนวน</th>
            <th style={{ ...headerStyle, width: '15%', textAlign: 'right' }}>ราคา</th>
          </tr>
        </thead>
        <tbody>
          {records && records.length > 0 ? (
            records.map((item, index) => {
              const { date, time } = formatThaiDate(item.pay_time);
              return (
                <tr 
                  key={index} 
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ ...cellStyle, textAlign: 'left' }}>
                    {/* วันที่และเวลาพร้อมวินาที ตัวหนาและเข้มชัดเจน */}
                    <span style={{ color: '#1e293b', fontWeight: '600' }}>{date}</span>
                    <span style={{ color: '#1e293b', fontWeight: '600', marginLeft: '12px' }}>{time}</span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'left', fontWeight: '500', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product_name}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'left', textTransform: 'uppercase', fontSize: '0.75rem', color: '#475569' }}>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>{item.user_name}</span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: '#1e293b' }}>{item.pay_num}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                    {Number(item.price).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#64748b' }}>฿</span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontFamily: "'Prompt', sans-serif" }}>ไม่พบข้อมูลการเบิก</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = {
  padding: '18px 20px',
  color: '#334155',
  fontSize: '0.85rem',
  fontWeight: '700',
  fontFamily: "'Prompt', sans-serif",
  textTransform: 'uppercase',
  letterSpacing: '0.75px',
};

const cellStyle = {
  padding: '16px 20px',
  fontSize: '0.85rem',
  fontFamily: "'Prompt', sans-serif",
  lineHeight: '1.2'
};

export default ReportTable;