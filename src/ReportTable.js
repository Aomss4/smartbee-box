import React from 'react';

const ReportTable = ({ records, calculateTotalPrice, getProductInfo, hidePrice }) => {
  const formatThaiDate = (dateString) => {
    if (!dateString) return { date: "-", time: "" };
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' });
    const time = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
    return { date, time };
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', minWidth: '1000px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ ...headerStyle, width: '50px', textAlign: 'center' }}>#</th>
            <th style={{ ...headerStyle, width: '120px' }}>ผู้เบิก</th>
            <th style={{ ...headerStyle, width: '180px' }}>วันที่บันทึก</th>
            <th style={{ ...headerStyle, width: '280px' }}>รุ่นเครื่องมือ (Description)</th>
            <th style={{ ...headerStyle, width: '100px', textAlign: 'center' }}>หมวดหมู่</th>
            <th style={{ ...headerStyle, width: '120px', textAlign: 'center' }}>รหัสวัสดุ</th>
            <th style={{ ...headerStyle, width: '100px', textAlign: 'center' }}>เบิก (กล่อง)</th>
            <th style={{ ...headerStyle, width: '100px', textAlign: 'center' }}>บรรจุภัณฑ์</th>
            {!hidePrice && <th style={{ ...headerStyle, width: '120px', textAlign: 'right' }}>ราคารวม</th>}
          </tr>
        </thead>
        <tbody>
          {records && records.length > 0 ? (
            records.map((item, index) => {
              const { date, time } = formatThaiDate(item.pay_time);
              const info = getProductInfo(item.product_name);
              const productCode = item.product_name.split(' ')[0];
              const category = productCode.startsWith('INS') ? 'Insert' : 'Holder';

              return (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...cellStyle, textAlign: 'center', color: '#94a3b8' }}>{index + 1}</td>
                  <td style={{ ...cellStyle, fontWeight: '600' }}>{item.user_name}</td>
                  <td style={cellStyle}>{date} <span style={{ color: '#94a3b8' }}>{time}</span></td>
                  <td style={cellStyle}>{item.product_name}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: category === 'Insert' ? '#ecfdf5' : '#eff6ff', color: category === 'Insert' ? '#059669' : '#2563eb', fontSize: '0.7rem', fontWeight: 'bold' }}>{category}</span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{productCode}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', color: '#007bff' }}>{item.pay_num}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{info.pcsPerBox}</td>
                  {!hidePrice && (
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: '700' }}>
                      {calculateTotalPrice(item.product_name, item.pay_num).toLocaleString()} ฿
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={hidePrice ? "8" : "9"} style={{ padding: '60px', textAlign: 'center' }}>ไม่พบข้อมูล</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = { padding: '16px 15px', color: '#475569', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' };
const cellStyle = { padding: '14px 15px', fontSize: '0.85rem' };

export default ReportTable;