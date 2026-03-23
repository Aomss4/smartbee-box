import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReportTable from "./ReportTable";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Download, Box, Factory, Circle, Users, LayoutGrid, List, RefreshCw,
} from "lucide-react";

import Machine1Img from "./assets/machine01.png";
import AppLogo from "./assets/logo-materials.png"; 

const MACHINES = [
  { id: "MC01", name: "MATERIALS CARBIDE CO., LTD.", token: "21e6a9316dfffe5b6d944fc37f2c4440", image: Machine1Img },
  { id: "MC02", name: "ตู้แผนกซ่อมบำรุง (Maintenance)", token: "ใส่โทเคนตรงนี้", image: Machine1Img },
  { id: "MC03", name: "ตู้คลังสินค้า (Warehouse)", token: "ใส่โทเคนตรงนี้", image: Machine1Img },
  // ... ตู้อื่นๆ ถ้าไม่มี Token ปุ่มจะกดซิงค์ไม่ได้นะครับ
];

const BACKEND_URL = "https://smartbee-backend-qz1q.onrender.com/api";

const PRODUCT_MASTER = {
  INS0019: { unitPrice: 95, pcsPerBox: 10 },
  INS0013: { unitPrice: 111, pcsPerBox: 10 },
  TOL0007: { unitPrice: 1500, pcsPerBox: 1 },
  INS0010: { unitPrice: 148, pcsPerBox: 10 }, 
};

const getProductInfo = (name) => {
  const code = name ? name.split(" ")[0] : "";
  if (PRODUCT_MASTER[code]) return PRODUCT_MASTER[code];
  const isInsert = code.startsWith("INS") || name.toUpperCase().includes("INSERT");
  return { unitPrice: 148, pcsPerBox: isInsert ? 10 : 1 }; 
};

const calculatePcs = (productName, boxQty) => {
  const info = getProductInfo(productName);
  return Number(boxQty || 0) * info.pcsPerBox;
};

const calculateTotalPrice = (productName, boxQty) => {
  const info = getProductInfo(productName);
  const totalPcs = calculatePcs(productName, boxQty);
  return totalPcs * info.unitPrice;
};

const SkeletonValue = () => (
  <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
    style={{ width: "80px", height: "24px", background: "#e2e8f0", borderRadius: "6px", display: "inline-block" }} />
);

const Navbar = () => (
  <motion.nav initial={{ y: -100 }} animate={{ y: 0 }}
    style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 40px", background: "#ffffff", position: "sticky", top: 0, zIndex: 1000, 
      boxShadow: "none", borderBottom: "1px solid #f1f1f1",
    }}>
    <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={AppLogo} alt="Logo" style={{ height: "70px", width: "auto", objectFit: "contain", display: "block", mixBlendMode: "multiply" }} />
      </div>
      <div style={{ borderLeft: "1px solid #f1f1f1", paddingLeft: "25px", display: "flex", flexDirection: "column", justifyContent: "center", height: "60px" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#2c3e50", fontWeight: "bold", lineHeight: "1.2" }}>SmartBee <span style={{ color: "#007bff" }}>Box</span></h2>
        <p style={{ margin: "2px 0 0 0", fontSize: "0.65rem", color: "#888", letterSpacing: "0.5px", fontWeight: "bold" }}>MATERIALS CARBIDE CO., LTD.</p>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#2c3e50" }}>Admin Panel</div>
        <div style={{ fontSize: "0.75rem", color: "#28a745", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
          <Circle size={8} fill="#28a745" /> Online
        </div>
      </div>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}><Factory size={20} color="#666" /></div>
    </div>
  </motion.nav>
);

function App() {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("2026-03-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // วันที่ปัจจุบัน
  const [activeTab, setActiveTab] = useState("list");
  const [globalSummary, setGlobalSummary] = useState({ totalValue: 0, totalItems: 0, uniqueStaff: 0, allRows: [] });
  const [isSumming, setIsSumming] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDataFromDB = useCallback(async () => {
    if (!selectedMachine) return;
    setIsSumming(true);
    try {
      // เพิ่ม timestamp เพื่อเลี่ยง cache ของ browser
      const res = await fetch(`${BACKEND_URL}/records?machineId=${selectedMachine.id}&startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`);
      if (!res.ok) throw new Error("ดึงข้อมูลจาก DB ไม่สำเร็จ");
      const records = await res.json();

      const groupedMap = records.reduce((acc, curr) => {
        const key = `${curr.pay_time}_${curr.user_name}_${curr.product_name}`;
        if (!acc[key]) {
          acc[key] = { ...curr, countRow: 1 };
        } else {
          acc[key].countRow += 1;
        }
        return acc;
      }, {});

      const finalRecords = Object.values(groupedMap).map((item) => {
        const info = getProductInfo(item.product_name);
        const boxQty = Math.ceil(item.countRow / info.pcsPerBox);
        return { ...item, pay_num: boxQty };
      });

      setData(finalRecords);
      const totalPcs = finalRecords.reduce((sum, item) => sum + calculatePcs(item.product_name, item.pay_num), 0);
      const totalValue = finalRecords.reduce((sum, item) => sum + calculateTotalPrice(item.product_name, item.pay_num), 0);

      setGlobalSummary({
        totalValue: totalValue,
        totalItems: totalPcs,
        uniqueStaff: new Set(finalRecords.map((item) => item.user_name)).size,
        allRows: finalRecords,
      });
    } catch (err) {
      console.error("Fetch DB error:", err);
    } finally {
      setIsSumming(false);
    }
  }, [selectedMachine, startDate, endDate]);

  const handleSyncData = async () => {
    if (!selectedMachine) return;
    
    // ตรวจสอบว่ามี Token ไหม
    if (!selectedMachine.token) {
        alert(`ตู้นี้ยังไม่ได้ตั้งค่า Token (ID: ${selectedMachine.id})`);
        return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/sync-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            token: selectedMachine.token, 
            startDate: "2026-03-01", // บังคับดึงตั้งแต่ต้นเดือนมาใหม่
            endDate: endDate, 
            machineId: selectedMachine.id 
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert(`ซิงค์สำเร็จ! พบข้อมูลใหม่ ${result.total || 0} รายการ`);
        loadDataFromDB();
      } else {
        alert(`Server ตอบกลับผิดพลาด: ${result.message || 'Unknown Error'}`);
      }
    } catch (err) {
      alert("ไม่สามารถติดต่อ Server ได้ (ตรวจสอบว่าเปิด Backend หรือยัง)");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { loadDataFromDB(); }, [loadDataFromDB]);

  const productSummary = useMemo(() => {
    const summary = globalSummary.allRows.reduce((acc, item) => {
      const name = item.product_name || "ไม่ระบุชื่อสินค้า";
      if (!acc[name]) acc[name] = { name, count: 0, total: 0 };
      acc[name].count += calculatePcs(item.product_name, item.pay_num);
      acc[name].total += calculateTotalPrice(item.product_name, item.pay_num);
      return acc;
    }, {});
    return Object.values(summary).sort((a, b) => b.count - a.count);
  }, [globalSummary.allRows]);

  const exportToCSV = () => {
    const isList = activeTab === "list";
    const rows = isList ? globalSummary.allRows : productSummary;
    if (rows.length === 0) return;
    let csvContent = "\uFEFF";
    csvContent += isList ? "วันที่-เวลา,สินค้า,พนักงาน,จำนวนชิ้น,ราคารวม(บาท)\n" : "อันดับ,สินค้า,จำนวนรวม,ราคารวม(บาท)\n";
    rows.forEach((row, idx) => {
      if (isList) {
        const date = new Date(row.pay_time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
        csvContent += `${date},"${row.product_name}",${row.user_name},${calculatePcs(row.product_name, row.pay_num)},${calculateTotalPrice(row.product_name, row.pay_num)}\n`;
      } else {
        csvContent += `${idx + 1},"${row.name}",${row.count},${row.total}\n`;
      }
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Report_${startDate}.csv`;
    link.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", fontFamily: "'Prompt', sans-serif" }}>
      <Navbar />
      <AnimatePresence mode="wait">
        {!selectedMachine ? (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "60px 20px", textAlign: "center" }}>
            <h1 style={{ color: "#2c3e50", fontSize: "2.5rem", fontWeight: "bold" }}>Dashboard การเบิกตู้ SmartBee</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px", maxWidth: "1200px", margin: "50px auto 0 auto" }}>
              {MACHINES.map((m) => (
                <motion.div key={m.id} whileHover={{ y: -10 }} onClick={() => setSelectedMachine(m)} style={{ cursor: "pointer", background: "#fff", padding: "25px", borderRadius: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0" }}>
                  <img src={m.image} alt={m.name} style={{ width: "100%", height: "180px", objectFit: "contain" }} />
                  <p style={{ fontWeight: "bold", marginTop: "20px", color: "#2c3e50" }}>{m.name}</p>
                  <span style={{ fontSize: "0.7rem", color: "#007bff", background: "#eef2ff", padding: "4px 12px", borderRadius: "10px" }}>ID: {m.id}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "30px", maxWidth: "1300px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <button onClick={() => setSelectedMachine(null)} style={{ padding: "10px 20px", borderRadius: "12px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}><ArrowLeft size={18} /> กลับ</button>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ color: "#2c3e50", margin: 0 }}>{selectedMachine.name}</h2>
                <div style={{ display: "flex", gap: "10px", marginTop: "15px", justifyContent: "center" }}>
                  <button onClick={() => setActiveTab("list")} style={{ ...tabButtonStyle, background: activeTab === "list" ? "#007bff" : "#fff", color: activeTab === "list" ? "#fff" : "#666" }}><List size={16} /> รายการละเอียด</button>
                  <button onClick={() => setActiveTab("summary")} style={{ ...tabButtonStyle, background: activeTab === "summary" ? "#007bff" : "#fff", color: activeTab === "summary" ? "#fff" : "#666" }}><LayoutGrid size={16} /> สรุปสินค้า</button>
                </div>
              </div>
              <button 
                onClick={handleSyncData} 
                disabled={isSyncing} 
                style={{ 
                    padding: "10px 20px", borderRadius: "12px", 
                    background: selectedMachine.token ? "#6366f1" : "#cbd5e1", 
                    color: "white", border: "none", 
                    cursor: (isSyncing || !selectedMachine.token) ? "not-allowed" : "pointer", 
                    display: "flex", gap: "8px", alignItems: "center" 
                }}
              >
                <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} /> 
                {isSyncing ? "กำลังซิงค์..." : "ซิงค์ข้อมูลล่าสุด"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
              <div style={summaryCardStyle}><Box color="#3182ce" /> <div><p style={labelStyle}>จำนวนเม็ด/ชิ้นรวม</p><h3 style={valueStyle}>{isSumming ? <SkeletonValue /> : `${globalSummary.totalItems.toLocaleString()} ชิ้น`}</h3></div></div>
              <div style={summaryCardStyle}><Users color="#e53e3e" /> <div><p style={labelStyle}>พนักงานที่เบิก</p><h3 style={valueStyle}>{isSumming ? <SkeletonValue /> : `${globalSummary.uniqueStaff} คน`}</h3></div></div>
            </div>

            <div style={{ marginBottom: "25px", padding: "20px", background: "#fff", borderRadius: "15px", display: "flex", gap: "15px", alignItems: "center", border: "1px solid #eee" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Calendar size={18} color="#007bff" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={dateInputStyle} />
                <span>ถึง</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={dateInputStyle} />
              </div>
              <button onClick={exportToCSV} style={{ marginLeft: "auto", padding: "10px 20px", background: "#28a745", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}><Download size={18} /> ส่งออก CSV</button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "list" ? (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ReportTable records={data} calculatePcs={calculatePcs} calculateTotalPrice={calculateTotalPrice} getProductInfo={getProductInfo} hidePrice={true} />
                </motion.div>
              ) : (
                <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                  {productSummary.map((item, idx) => (
                    <div key={idx} style={{ background: "#fff", padding: "25px", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#6366f1", background: "#e0e7ff", display: "inline-block", padding: "4px 12px", borderRadius: "20px", marginBottom: "10px" }}>อันดับ {idx + 1}</p>
                      <h4 style={{ margin: "0 0 15px 0", color: "#1e293b" }}>{item.name}</h4>
                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                        <div><small style={{ color: "#94a3b8" }}>จำนวนรวม</small><br /><strong>{item.count.toLocaleString()}</strong> ชิ้น</div>
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

const tabButtonStyle = { padding: "8px 16px", borderRadius: "10px", border: "1px solid #eee", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: "bold", transition: "0.2s" };
const summaryCardStyle = { background: "#fff", padding: "20px", borderRadius: "24px", display: "flex", alignItems: "center", gap: "15px", border: "1px solid #eee" };
const labelStyle = { margin: 0, fontSize: "0.8rem", color: "#718096", fontWeight: "bold" };
const valueStyle = { margin: 0, color: "#2d3748", fontSize: "1.5rem", fontWeight: "800", minHeight: "36px" };
const dateInputStyle = { padding: "8px", borderRadius: "10px", border: "1px solid #ddd", fontFamily: "inherit" };

export default App;