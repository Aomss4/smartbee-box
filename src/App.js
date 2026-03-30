import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReportTable from "./ReportTable";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Download, Box, Factory, Circle, Users, LayoutGrid, List, RefreshCw,
} from "lucide-react";

import Machine1Img from "./assets/machine01.png";
import AppLogo from "./assets/logo-materials.png"; 

const MACHINES = [
  { id: "MC01", name: "บริษัท โอเทค (ไทยแลนด์) จำกัด.", token: "32021fe95bee7e977df9db1e79d0b107", image: Machine1Img },
  { id: "MC02", name: "บริษัท สายทิพย์ สแปพาร์ท จำกัด", token: "e8ca5787461158f82a6dd07b462c1711", image: Machine1Img },
  { id: "MC03", name: "บริษัท เอ็มอาร์พี เอ็นจิเนียริ่ง จำกัด", token: "f07e3a1527eec06004d07a61fa961d05", image: Machine1Img },
  { id: "MC04", name: "บริษัท มิตซูบิชิ เอลเลเวเตอร์ เอเซีย จำกัด", token: "e2d5b25ff721be1bc67034cd34a740e7", image: Machine1Img },
  { id: "MC05", name: "บริษัท ซีเจแมนูแฟคเจอริ่ง จำกัด", token: "4bc6d9a59bc1f6cf703afa81fe075c65", image: Machine1Img },
  { id: "MC06", name: "บริษัท อินเตอร์ทูล เทคโนโลยี จำกัด", token: "1cf9a026e0bf54c2c86f1034f178cc6f", image: Machine1Img },
  { id: "MC07", name: "บริษัท เอ็นเอ็มบี-มินีแบ ไทย จำกัด", token: "051ec749f6948eb30ca43047f24d5faa", image: Machine1Img },
  { id: "MC08", name: "บริษัท ซี.เอ.เอส.เอช. โอโตพาร์ทส จำกัด", token: "09df453697ac0a225b5d1d74acd575af", image: Machine1Img },
  { id: "MC09", name: "ตู้สำรอง (Backup Unit)", token: "", image: Machine1Img }
];

const BACKEND_URL = "http://localhost:5000/api"; 

const getProductInfo = (name) => {
  const nameUpper = name?.toUpperCase() || "";

  // 🚩 ระบุรหัสสินค้าที่ต้องการให้หาร 1 (ไม่ใช่ 10)
  // เพิ่มรหัส A2336 และ A2414 เข้าไปในรายการนี้
  const specialItems = ["A2336", "A2414"];

  // ตรวจสอบว่าชื่อสินค้ามีรหัสที่ระบุไว้หรือไม่
  const isSpecial = specialItems.some(code => nameUpper.includes(code));

  // ตรวจสอบว่าเป็นกลุ่ม INSERT ทั่วไปหรือไม่
  const isInsert = nameUpper.includes("INSERT") || nameUpper.startsWith("INS");

  // --- Logic การตัดสินใจ ---
  // 1. ถ้าเป็นรหัสพิเศษ (A2336, A2414) -> ให้หาร 1 ทันที
  if (isSpecial) {
    return { pcsPerBox: 1 };
  }

  // 2. ถ้าไม่ใช่รหัสพิเศษ แต่เป็น INSERT ทั่วไป -> ให้หาร 10
  if (isInsert) {
    return { pcsPerBox: 10 };
  }

  // 3. สินค้าอื่นๆ (เช่น End Mill, Holder) -> ให้หาร 1
  return { pcsPerBox: 1 };
};

function App() {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState("list");
  
  const [totalItems, setTotalItems] = useState(0);
  const [uniqueStaff, setUniqueStaff] = useState(0);
  const [isSumming, setIsSumming] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ฟังก์ชันช่วยจัดรูปแบบข้อมูลให้พร้อมแสดงผล
  const formatRecords = useCallback((rawArray) => {
    if (!rawArray || rawArray.length === 0) return [];

    const groupedMap = rawArray.reduce((acc, curr) => {
      const uName = curr.nick_name || curr.user_name || "ไม่ระบุชื่อ";
      const pName = curr.tool_model || curr.product_name || "ไม่ระบุสินค้า";
      const pTime = curr.pay_time || curr.borrow_time || curr.create_time;
      
      const key = `${pTime}_${uName}_${pName}`;
      const num = Number(curr.pay_num || curr.num || 0);

      if (!acc[key]) {
        acc[key] = { 
          ...curr, 
          user_name: uName,
          product_name: pName,
          pay_time: pTime,
          pay_num: num 
        };
      } else {
        acc[key].pay_num += num;
      }
      return acc;
    }, {});

    return Object.values(groupedMap).map(row => {
      const info = getProductInfo(row.product_name);
      return { 
        ...row, 
        actualTotalPcs: row.pay_num,
        pay_num: row.pay_num / info.pcsPerBox 
      };
    });
  }, []);

  const loadDataFromDB = useCallback(async () => {
    if (!selectedMachine) return;
    setIsSumming(true);
    try {
      const res = await fetch(`${BACKEND_URL}/records?machineId=${selectedMachine.id}&startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Fetch DB error");
      const rawRecords = await res.json();
      
      const final = formatRecords(rawRecords);
      setData(final);
      setTotalItems(final.reduce((sum, r) => sum + r.actualTotalPcs, 0));
      setUniqueStaff(new Set(final.map(r => r.user_name)).size);
    } catch (err) { 
      console.error("Load Data Error:", err); 
    } finally { 
      setIsSumming(false); 
    }
  }, [selectedMachine, startDate, endDate, formatRecords]);

  useEffect(() => { loadDataFromDB(); }, [loadDataFromDB]);

  const handleSyncData = async () => {
    if (!selectedMachine || !selectedMachine.token) return alert("กรุณาใส่ Token");
    setIsSyncing(true);

    try {
      const res = await fetch(`${BACKEND_URL}/sync-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: selectedMachine.token, 
          startDate, endDate, 
          machineId: selectedMachine.id 
        }),
      });

      const result = await res.json();

      if (res.ok && result.rows) { 
        // รับข้อมูลชุดใหญ่ (ทุกหน้า) มาแสดงผลทันที
        const final = formatRecords(result.rows);
        setData(final);
        setTotalItems(final.reduce((sum, r) => sum + r.actualTotalPcs, 0));
        setUniqueStaff(new Set(final.map(r => r.user_name)).size);
        alert(`ซิงค์สำเร็จ! รวบรวมข้อมูลได้ทั้งหมด ${result.total} รายการ`); 
      } else if (res.ok) {
        loadDataFromDB();
        alert("ซิงค์สำเร็จ!");
      } else {
        alert(`ซิงค์ไม่สำเร็จ: ${result.error}`);
      }
    } catch (err) { 
      alert("ติดต่อ Backend Server ไม่ได้ หรือการเชื่อมต่อใช้เวลานานเกินไป"); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const productSummary = useMemo(() => {
    const summary = data.reduce((acc, item) => {
      const name = item.product_name;
      if (!acc[name]) acc[name] = { name, count: 0 };
      acc[name].count += item.actualTotalPcs;
      return acc;
    }, {});
    return Object.values(summary).sort((a, b) => b.count - a.count);
  }, [data]);

  const exportToCSV = () => {
    let csvContent = "\uFEFFลำดับ,ผู้เบิก,วันที่บันทึก,สินค้า,จำนวนเบิก(กล่อง),จำนวนชิ้นรวม\n";
    data.forEach((row, idx) => {
      csvContent += `${idx + 1},${row.user_name},${row.pay_time},"${row.product_name}",${row.pay_num},${row.actualTotalPcs}\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Report_${selectedMachine.id}_${startDate}.csv`);
    link.click();
  };

  // --- Styles (คงเดิม) ---
  const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 50px", background: "#fff", borderBottom: "2px solid #f1f5f9", position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };
  const machineCardStyle = { cursor: "pointer", background: "#fff", padding: "30px", borderRadius: "35px", border: "1px solid #e2e8f0", textAlign: 'center', transition: '0.4s' };
  const cardStyle = { background: "#fff", padding: "30px", borderRadius: "30px", display: "flex", alignItems: "center", gap: "25px", border: "1px solid #e2e8f0", boxShadow: '0 10px 25px rgba(0,51,102,0.03)' };
  const summaryBoxStyle = { background: "#fff", padding: "30px", borderRadius: "35px", border: "1px solid #e2e8f0", boxShadow: '0 5px 25px rgba(0,0,0,0.02)', position: 'relative' };
  const labelStyle = { margin: 0, fontSize: "0.9rem", color: "#64748b", fontWeight: "bold" };
  const valueStyle = { margin: 0, fontSize: "2.4rem", fontWeight: "900" };
  const tabBtn = { padding: "12px 28px", borderRadius: "18px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", fontSize: '0.95rem', transition: "0.3s" };
  const backBtnStyle = { padding: "12px 24px", borderRadius: "18px", border: "1px solid #e2e8f0", background: "#fff", color: '#475569', cursor: "pointer", display: "flex", gap: "10px", alignItems: "center", fontWeight: '900', fontSize: '0.95rem' };
  const syncBtnStyle = { padding: "12px 30px", borderRadius: "18px", background: "#fbbf24", color: "#003366", border: "none", cursor: "pointer", display: "flex", gap: "12px", alignItems: "center", fontWeight: '900', fontSize: '1rem', boxShadow: '0 4px 15px rgba(251,191,36,0.3)' };
  const filterBarStyle = { background: '#fff', padding: '20px 35px', borderRadius: '30px', border: '1px solid #e2e8f0', marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const dateInputStyle = { border: '2px solid #f1f5f9', padding: '12px 18px', borderRadius: '15px', fontSize: '0.95rem', outline: 'none', color: '#003366', fontWeight: '700', background: '#f8fafc' };
  const exportBtnStyle = { background: '#10b981', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '900', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Prompt', sans-serif" }}>
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ background: '#fff', padding: '5px', borderRadius: '10px' }}>
            <img src={AppLogo} alt="Logo" style={{ height: "60px", mixBlendMode: 'multiply' }} />
          </div>
          <div style={{ borderLeft: "2px solid #e2e8f0", paddingLeft: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#003366", fontWeight: "800" }}>SmartBee <span style={{ color: "#fbbf24" }}>Box</span></h2>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b", fontWeight: "bold", letterSpacing: "1px" }}>MATERIALS CARBIDE CO., LTD.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#003366' }}>Admin Portal</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                    <Circle size={8} fill="#10b981" /> Online
                </div>
            </div>
            <div style={{ width: '45px', height: '45px', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <Factory size={24} color="#003366" />
            </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {!selectedMachine ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
             <h1 style={{color: "#003366", fontWeight: "900", fontSize: '2.5rem', marginBottom: '10px'}}>Materials Carbide <span style={{color: '#fbbf24'}}>SmartBee</span></h1>
             <p style={{color: '#64748b', marginBottom: '50px'}}>กรุณาเลือกตู้ที่ต้องการจัดการข้อมูล</p>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px", maxWidth: "1250px", margin: "0 auto" }}>
                {MACHINES.map(m => (
                  <motion.div key={m.id} whileHover={{ y: -12, boxShadow: '0 20px 40px rgba(0,51,102,0.1)' }} onClick={() => setSelectedMachine(m)} style={machineCardStyle}>
                    <div style={{background: '#f8fafc', borderRadius: '25px', padding: '20px', marginBottom: '20px', border: '1px solid #f1f5f9'}}>
                        <img src={m.image} alt={m.name} style={{width: "100%", height: "160px", objectFit: 'contain'}} />
                    </div>
                    <p style={{fontWeight: "800", color: '#003366', fontSize: '1.1rem', margin: '10px 0'}}>{m.name}</p>
                    <span style={{fontSize: '0.75rem', color: '#fff', background: '#003366', padding: '6px 16px', borderRadius: '10px', fontWeight: 'bold'}}>ID: {m.id}</span>
                  </motion.div>
                ))}
             </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px" }}>
              <button onClick={() => setSelectedMachine(null)} style={backBtnStyle}><ArrowLeft size={18} /> กลับ</button>
              <div style={{textAlign: "center"}}>
                 <h2 style={{margin: 0, color: '#003366', fontWeight: '900', fontSize: '1.8rem'}}>{selectedMachine.name}</h2>
                 <div style={{display: "flex", gap: "10px", marginTop: "20px", justifyContent: "center"}}>
                    <button onClick={() => setActiveTab("list")} style={{...tabBtn, background: activeTab === "list" ? "#003366" : "#fff", color: activeTab === "list" ? "#fff" : "#475569", border: '1px solid #e2e8f0'}}><List size={18} /> รายการรายละเอียด</button>
                    <button onClick={() => setActiveTab("summary")} style={{...tabBtn, background: activeTab === "summary" ? "#003366" : "#fff", color: activeTab === "summary" ? "#fff" : "#475569", border: '1px solid #e2e8f0'}}><LayoutGrid size={18} /> สรุปแยกสินค้า</button>
                 </div>
              </div>
              <button onClick={handleSyncData} disabled={isSyncing} style={syncBtnStyle}>
                <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "กำลังซิงค์ข้อมูลทั้งหมด..." : "ซิงค์ข้อมูลล่าสุด"}
              </button>
            </div>

            <div style={filterBarStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '12px' }}><Calendar size={22} color="#003366" /></div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={dateInputStyle} />
                        <span style={{color: '#cbd5e0', fontWeight: '900'}}>TO</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={dateInputStyle} />
                    </div>
                </div>
                <button onClick={exportToCSV} style={exportBtnStyle}><Download size={18} /> ดาวน์โหลดรายงาน</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "35px" }}>
              <div style={cardStyle}>
                <div style={{background: '#003366', padding: '18px', borderRadius: '20px'}}><Box color="#fff" size={35} /></div>
                <div>
                    <p style={labelStyle}>จำนวนเม็ด/ชิ้นรวมทั้งหมด</p>
                    <h3 style={{...valueStyle, color: '#003366'}}>{isSumming || isSyncing ? "..." : `${totalItems.toLocaleString()}`} <span style={{fontSize: '1.2rem', color: '#94a3b8'}}>ชิ้น</span></h3>
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{background: '#fbbf24', padding: '18px', borderRadius: '20px'}}><Users color="#003366" size={35} /></div>
                <div>
                    <p style={labelStyle}>พนักงานที่ทำรายการ</p>
                    <h3 style={{...valueStyle, color: '#003366'}}>{isSumming || isSyncing ? "..." : `${uniqueStaff}`} <span style={{fontSize: '1.2rem', color: '#94a3b8'}}>คน</span></h3>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "list" ? (
                <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{background: "#fff", padding: "25px", borderRadius: "30px", border: "1px solid #e2e8f0", boxShadow: '0 10px 30px rgba(0,0,0,0.03)'}}>
                   <ReportTable records={data} getProductInfo={getProductInfo} hidePrice={true} />
                </motion.div>
              ) : (
                <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px" }}>
                   {productSummary.map((item, idx) => (
                      <div key={idx} style={summaryBoxStyle}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: "0.75rem", color: "#003366", fontWeight: "900", background: '#fbbf24', padding: '6px 15px', borderRadius: '10px' }}>RANK {idx + 1}</span>
                            <Box size={20} color="#e2e8f0" />
                         </div>
                         <h4 style={{ margin: "20px 0 10px 0", color: '#003366', lineHeight: '1.4', fontWeight: '800' }}>{item.name}</h4>
                         <div style={{ borderTop: '2px solid #f8fafc', paddingTop: '20px', marginTop: '15px' }}>
                            <p style={{ margin: 0, color: "#64748b", fontSize: '0.85rem', fontWeight: 'bold' }}>ยอดเบิกสะสมรวม</p>
                            <p style={{ margin: 0, color: '#003366', fontSize: '1.8rem', fontWeight: '900' }}>{item.count.toLocaleString()} <span style={{fontSize: '1rem', fontWeight: 'normal', color: '#94a3b8'}}>ชิ้น</span></p>
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

export default App;