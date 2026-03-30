import React from 'react';

const ReportTable = ({ records, calculateTotalPrice, getProductInfo, hidePrice }) => {
  const formatThaiDate = (dateString) => {
    if (!dateString) return { date: "-", time: "" };
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' 
    });
    const time = dateObj.toLocaleTimeString('th-TH', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' 
    });
    return { date, time };
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', minWidth: '1100px', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ ...headerStyle, width: '50px', textAlign: 'center' }}>#</th>
            <th style={{ ...headerStyle, width: '140px', textAlign: 'left' }}>ผู้เบิก</th>
            <th style={{ ...headerStyle, width: '160px', textAlign: 'left' }}>วันที่บันทึก</th>
            <th style={{ ...headerStyle, textAlign: 'left' }}>รุ่นเครื่องมือ (DESCRIPTION)</th>
            <th style={{ ...headerStyle, width: '180px', textAlign: 'center' }}>หมวดหมู่</th>
            <th style={{ ...headerStyle, width: '130px', textAlign: 'center' }}>รหัสวัสดุ</th>
            <th style={{ ...headerStyle, width: '110px', textAlign: 'center' }}>เบิก (กล่อง)</th>
            <th style={{ ...headerStyle, width: '110px', textAlign: 'center' }}>บรรจุภัณฑ์</th>
            {!hidePrice && <th style={{ ...headerStyle, width: '130px', textAlign: 'right' }}>ราคารวม</th>}
          </tr>
        </thead>
        <tbody>
          {records && records.length > 0 ? (
            records.map((item, index) => {
              const { date, time } = formatThaiDate(item.pay_time);
              const info = getProductInfo(item.product_name);
              const productCode = item.product_name ? item.product_name.split(' ')[0] : "N/A";
              
              const displayCategory = item.type_name || "TOOL/HOLDER";
              const catUpper = displayCategory.toUpperCase();
              const isInsert = catUpper.includes("INSERT");
              const isDrill = catUpper.includes("DRILL");

              return (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} 
                    onMouseOver={(e) => e.currentTarget.style.background = '#fcfdfe'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...cellStyle, textAlign: 'center', color: '#94a3b8' }}>{index + 1}</td>
                  <td style={{ ...cellStyle, fontWeight: '600', color: '#1e293b' }}>{item.user_name}</td>
                  <td style={{ ...cellStyle }}>
                    <div style={{ fontWeight: '500' }}>{date}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{time}</div>
                  </td>
                  <td style={{ ...cellStyle, color: '#334155', lineHeight: '1.5', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {item.product_name}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      background: isInsert ? '#d1fae5' : isDrill ? '#e0f2fe' : '#f1f5f9', 
                      color: isInsert ? '#065f46' : isDrill ? '#0369a1' : '#475569', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      display: 'inline-block',
                      minWidth: '140px',
                      border: `1px solid ${isInsert ? '#a7f3d0' : isDrill ? '#bae6fd' : '#e2e8f0'}`,
                      textTransform: 'uppercase'
                    }}>
                      {displayCategory}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontFamily: 'monospace', fontWeight: '600', color: '#475569' }}>{productCode}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontWeight: '800', color: '#2563eb', fontSize: '1rem' }}>{item.pay_num}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: '#64748b', fontWeight: '500' }}>{info.pcsPerBox}</td>
                  {!hidePrice && (
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                      {calculateTotalPrice ? calculateTotalPrice(item.product_name, item.pay_num).toLocaleString() : "0"} ฿
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={hidePrice ? "8" : "9"} style={{ padding: '100px', textAlign: 'center', color: '#94a3b8' }}>
                ไม่พบข้อมูลในช่วงเวลาที่เลือก
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = { 
  padding: '18px 15px', 
  color: '#64748b', 
  fontSize: '0.75rem', 
  fontWeight: '700', 
  textTransform: 'uppercase', 
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap'
};

const cellStyle = { 
  padding: '16px 15px', 
  fontSize: '0.85rem',
  verticalAlign: 'middle'
};

export default ReportTable;