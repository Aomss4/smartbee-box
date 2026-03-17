import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReportTable from './ReportTable';
import { motion, AnimatePresence } from 'framer-motion'; 
import { ArrowLeft, Calendar, Download, Box, Factory, Circle, Users, DollarSign, LayoutGrid, List, RefreshCw } from 'lucide-react';

import Machine1Img from './assets/machine01.png'; 

const MACHINES = [
  { id: "MC01", name: "OTEC (THAILAND) CO., LTD", token: "52d99523b772b3c79dea90d582af5bd2", image: Machine1Img },
  { id: "MC02", name: "ตู้แผนกซ่อมบำรุง", token: "", image: Machine1Img },
  { id: "MC03", name: "ตู้คลังสินค้า", token: "", image: Machine1Img }
];

// 🔥 แก้ไขเป็น URL ของ Render ที่คุณเพิ่งทำเสร็จ
const BACKEND_URL = "https://smartbee-backend-qz1q.onrender.com/api";

const SkeletonValue = () => (
  <motion.div
    animate={{ opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    style={{ width: '80px', height: '24px', background: '#e2e8f0', borderRadius: '6px', display: 'inline-block' }}
  />
);

const Navbar = () => (
  <motion.nav 
    initial={{ y: -100 }} animate={{ y: 0 }}
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 40px', background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 1000,
      boxShadow: '0 2px 15px rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(255,255,255,0.3)'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ background: '#007bff', padding: '8px', borderRadius: '12px' }}><Box color="white" size={24} /></div>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#2c3e50', fontWeight: 'bold' }}>SmartBee <span style={{ color: '#007bff' }}>Box</span></h2>
        <p style={{ margin: 0, fontSize: '0.65rem', color: '#888', letterSpacing: '1px', fontWeight: 'bold' }}>OTEC (THAILAND) CO., LTD.</p>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2c3e50' }}>Admin Panel</div>
        <div style={{ fontSize: '0.75rem', color: '#28a745', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
          <Circle size={8} fill="#28a745" /> Online
        </div>
      </div>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Factory size={20} color="#666" /></div>
    </div>
  </motion.nav>
);

function App() {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("2026-03-01");
  const [endDate, setEndDate] = useState("2026-03-17");
  const [activeTab, setActiveTab] = useState('list'); 
  const [globalSummary, setGlobalSummary] = useState({ totalValue: 0, totalItems: 0, uniqueStaff: 0, allRows: [] });
  const [isSumming, setIsSumming] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. 🚀 ดึงข้อมูลจาก MongoDB บน Cloud
  const loadDataFromDB = useCallback(async () => {
    if (!selectedMachine) return;
    setIsSumming(true);
    try {
      const res = await fetch(`${BACKEND_URL}/records?machineId=${selectedMachine.id}&startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Server response was not ok");
      const records = await res.json();
      
      setData(records);
      setGlobalSummary({
        totalValue: records.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
        totalItems: records.reduce((sum, item) => sum + (Number(item.pay_num) || 0), 0),
        uniqueStaff: new Set(records.map(item => item.user_name)).size,
        allRows: records
      });
    } catch (err) {
      console.error("Fetch DB error:", err);
    } finally {
      setIsSumming(false);
    }
  }, [selectedMachine, startDate, endDate]);

  // 2. 🔄 สั่ง Sync ข้อมูล (Node.js บน Render จะไปดึงจากจีนมาลง MongoDB Atlas)
  const handleSyncData = async () => {
    if (!selectedMachine) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/sync-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: selectedMachine.token,
          startDate: startDate,
          endDate: endDate,
          machineId: selectedMachine.id
        })
      });
      const result = await res.json();
      if (res.ok) {
        alert(`ดึงข้อมูลสำเร็จ! (รวม ${result.total} รายการบันทึกลงฐานข้อมูลแล้ว)`);
        loadDataFromDB();
      } else {
        alert("Sync Error: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      alert("ไม่สามารถติดต่อ Server ได้ (อาจจะเป็นเพราะระบบ Free Plan กำลังหลับ รอ 30 วินาทีแล้วลองใหม่นะครับ)");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { loadDataFromDB(); }, [loadDataFromDB]);

  const productSummary = useMemo(() => {
    const summary = globalSummary.allRows.reduce((acc, item) => {
      const name = item.product_name || "ไม่ระบุชื่อสินค้า";
      if (!acc[name]) acc[name] = { name, count: 0, total: 0 };
      acc[name].count += Number(item.pay_num || 0);
      acc[name].total += Number(item.price || 0);
      return acc;
    }, {});
    return Object.values(summary).sort((a, b) => b.count - a.count);
  }, [globalSummary.allRows]);

  const exportHistoryCSV = () => {
    if (globalSummary.allRows.length === 0) { alert("ไม่มีข้อมูลสำหรับส่งออก"); return; }
    let csvContent = "\uFEFF"; 
    csvContent += "วันที่-เวลาเบิก,สินค้า,พนักงาน,จำนวน,ราคา (บาท)\n";
    globalSummary.allRows.forEach(row => {
      const date = new Date(row.pay_time).toLocaleString('th-TH'); 
      const productName = `"${row.product_name.replace(/"/g, '""')}"`; 
      csvContent += `${date},${productName},${row.user_name},${row.pay_num},${row.price}\n`;
    });
    downloadFile(csvContent, `History_${selectedMachine.name}_${startDate}.csv`);
  };

  const exportProductSummaryCSV = () => {
    if (productSummary.length === 0) { alert("ไม่มีข้อมูลสรุปสินค้า"); return; }
    let csvContent = "\uFEFF"; 
    csvContent += "อันดับ,ชื่อรุ่นสินค้า,จำนวนที่เบิกทั้งหมด (กล่อง),มูลค่ารวม (บาท)\n";
    productSummary.forEach((item, idx) => {
      const productName = `"${item.name.replace(/"/g, '""')}"`; 
      csvContent += `${idx + 1},${productName},${item.count},${item.total}\n`;
    });
    downloadFile(csvContent, `Product_Summary_${selectedMachine.name}_${startDate}.csv`);
  };

  const downloadFile = (content, fileName) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc', fontFamily: "'Prompt', sans-serif" }}>
      <Navbar />
      <AnimatePresence mode="wait">
        {!selectedMachine ? (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '60px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: 'calc(100vh - 65px)' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '10px', fontSize: '2.5rem', fontWeight: 'bold' }}>ข้อมูลการเบิกของ SmartBee Box</h1>
            <p style={{ color: '#666', marginBottom: '50px' }}>กรุณาเลือกตู้สินค้าเพื่อตรวจสอบรายงานเบิกจ่าย</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '35px', flexWrap: 'wrap' }}>
              {MACHINES.map((m, index) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.05, translateY: -10 }} onClick={() => { if(m.token) { setSelectedMachine(m); setActiveTab('list'); } else { alert("ตู้นี้ยังไม่มีข้อมูล"); } }} style={{ padding: '20px', width: '320px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '28px', cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.4)', opacity: m.token ? 1 : 0.7 }}>
                  <div style={{ width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', background: '#fff' }}>
                    <img src={m.image} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '15px' }} />
                  </div>
                  <p style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1rem', margin: '0' }}>{m.name}</p>
                  <div style={{ marginTop: '12px', display: 'inline-block', padding: '5px 15px', background: '#e1f0ff', color: '#007bff', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>MODEL X</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="report" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} style={{ padding: '30px', maxWidth: '1300px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <button onClick={() => { setSelectedMachine(null); setData([]); setGlobalSummary({ totalValue: 0, totalItems: 0, uniqueStaff: 0, allRows: [] }); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ddd', background: '#fff', padding: '10px 20px', borderRadius: '12px', color: '#444', cursor: 'pointer', fontWeight: 'bold' }}><ArrowLeft size={20} /> กลับหน้าเลือกตู้</button>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.8rem' }}>{selectedMachine.name}</h2>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                    <button onClick={() => setActiveTab('list')} style={{ ...tabButtonStyle, background: activeTab === 'list' ? '#007bff' : '#fff', color: activeTab === 'list' ? '#fff' : '#666' }}><List size={18}/> รายการละเอียด</button>
                    <button onClick={() => setActiveTab('summary')} style={{ ...tabButtonStyle, background: activeTab === 'summary' ? '#007bff' : '#fff', color: activeTab === 'summary' ? '#fff' : '#666' }}><LayoutGrid size={18}/> สรุปตามชนิดสินค้า</button>
                </div>
              </div>
              
              <button 
                onClick={handleSyncData} 
                disabled={isSyncing}
                style={{ ...syncButtonStyle, opacity: isSyncing ? 0.6 : 1 }}
              >
                <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "กำลังดึงข้อมูล..." : "ดึงข้อมูลใหม่จากตู้"}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <div style={summaryCardStyle}>
                <div style={{ background: '#e6fffa', padding: '12px', borderRadius: '15px' }}><DollarSign color="#38a169" /></div>
                <div>
                  <p style={labelStyle}>ยอดเงินรวมช่วงที่เลือก</p>
                  <h3 style={valueStyle}>
                    {isSumming ? <SkeletonValue /> : `${globalSummary.totalValue.toLocaleString()} ฿`}
                  </h3>
                </div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ background: '#ebf8ff', padding: '12px', borderRadius: '15px' }}><Box color="#3182ce" /></div>
                <div>
                  <p style={labelStyle}>จำนวนที่เบิก</p>
                  <h3 style={valueStyle}>
                    {isSumming ? <SkeletonValue /> : `${globalSummary.totalItems.toLocaleString()} กล่อง`}
                  </h3>
                </div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ background: '#fff5f5', padding: '12px', borderRadius: '15px' }}><Users color="#e53e3e" /></div>
                <div>
                  <p style={labelStyle}>พนักงาน</p>
                  <h3 style={valueStyle}>
                    {isSumming ? <SkeletonValue /> : `${globalSummary.uniqueStaff.toLocaleString()} คน`}
                  </h3>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '25px', padding: '25px', background: '#fff', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fc', padding: '10px 15px', borderRadius: '12px', border: '1px solid #eee' }}>
                <Calendar size={18} color="#007bff" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={dateInputStyle} />
                <span>|</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={dateInputStyle} />
              </div>
              
              {activeTab === 'list' ? (
                <button onClick={exportHistoryCSV} style={{ ...exportButtonStyle, backgroundColor: '#28a745' }}>
                  <Download size={20} /> ส่งออกประวัติการเบิก (CSV)
                </button>
              ) : (
                <button onClick={exportProductSummaryCSV} style={{ ...exportButtonStyle, backgroundColor: '#10b981' }}>
                  <Download size={20} /> ส่งออกสรุปสินค้า (CSV)
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'list' ? (
                    <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                            <ReportTable records={data} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                        {productSummary.map((item, idx) => (
                            <div key={idx} style={productCardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div style={{ background: '#eef2ff', padding: '10px', borderRadius: '12px' }}><Box color="#4f46e5" size={20}/></div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6366f1', background: '#e0e7ff', padding: '4px 12px', borderRadius: '20px' }}>อันดับ {idx + 1}</div>
                                </div>
                                <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1rem', height: '2.5rem', overflow: 'hidden' }}>{item.name}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>จำนวนที่เบิก</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#007bff' }}>{item.count} <small style={{fontWeight: 400}}>กล่อง</small></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>มูลค่ารวม</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>{item.total.toLocaleString()} <small style={{fontWeight: 400}}>฿</small></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ... styles เหมือนเดิม ...
const summaryCardStyle = { background: '#fff', padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' };
const productCardStyle = { background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' };
const labelStyle = { margin: 0, fontSize: '0.8rem', color: '#718096', fontWeight: 'bold' };
const valueStyle = { margin: 0, color: '#2d3748', fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', minHeight: '36px' };
const dateInputStyle = { border: 'none', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' };
const tabButtonStyle = { padding: '8px 20px', borderRadius: '10px', border: '1px solid #eee', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' };
const exportButtonStyle = { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };
const syncButtonStyle = { background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };

export default App;