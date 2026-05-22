import React, { useState, useEffect, useCallback, useMemo } from "react";
import Login from "./Login";
import ReportTable from "./ReportTable";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from '@emailjs/browser'; 
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  ArrowLeft, Calendar, Download, Box, RefreshCw, 
  LogOut, AlertTriangle, Search, LayoutDashboard, FileText, 
  Package, Menu, Mail, Send, BarChart2
} from "lucide-react"; 

import Machine3Img from "./assets/machine04.png";
import Machine1Img from  "./assets/machine02.png";
import Machine2Img from  "./assets/machine03.png";
import AppLogo from "./assets/logo-materials.png";

// 💰 แผนผังราคา (ราคาต่อ 1 ชิ้น)
const PRICE_MAP = {
  "INS0006 MPMT070308 UP20M" : 111,
  "INS0019 APMT1135PDER-H2 VP15TF": 100,
  "INS0012 CPMH080204-SV UE6020" : 86,
  "INS0013 DCMT070204-FV AP25N": 117,
  "INS0009 CNMG120408-MA MC6125": 146,
  "INS0010 DNMG150408-MA MC6125": 155,
  "HOLDER PDJNR2525M15": 1200,
  "INS0014 DCMT11T308-FV AP25N" : 181,
  "INS0011 VNMG160408-MA MC6125" : 117,
  "INS0064 QOMT1342R-M2 VP15TF" : 240,
  "INS0074 DCMT150408 US735" : 233,
  "INS0112 SOMX073505-UM VP15TF" : 155,
  "INS0016 DCMT 11T308 UE6020" : 181,
  "HOLDER C08HSCLCR06" : 7291,
  "HOLDER C16RSDUCR07" : 12188,
  "INS0023 RPMT10T3MOE-JS VP15TF" : 113,
  "INS0110 SOMX052704-UM VP15TF" : 145,
};

const MAX_STOCK_MAP = {
  "INS0019 APMT1135PDER-H2 VP15TF": 1500,
  "INS0013 DCMT070204-FV AP25N": 300,
  "HOLDER PDJNR2525M15": 10,
  "INS0006 MPMT070308 UP20M": 300,
  "INS0009 CNMG120408-MA MC6125": 500,
  "INS0010 DNMG150408-MA MC6125": 400,
  "INS0011 VNMG160408-MA MC6125": 500,
  "INS0012 CPMH080204-SV UE6020": 500,
  "INS0014 DCMT11T308-FV AP25N": 1000,
  "INS0016 DCMT 11T308 UE6020": 900,
  "INS0018 DNMG150404-MA UE6020": 300,
  "INS0022 RPMT08T2MOE-JS VP15TF": 300,
  "INS0023 RPMT10T3MOE-JS VP15TF": 200,
  "INS0024 RPMT1204MOE-JS VP15TF": 400,
  "INS0064 QOMT1342R-M2 VP15TF": 600,
  "INS0071 SRFT 25 VP15TF": 10,
  "INS0074 DCMT150408 US735": 400,
  "INS0096 SRFT20VP15TF": 20,
  "INS0100 SRFT32 VP15TF": 20,
  "INS0103 SPMW090304 UP20M": 150,
  "INS0110 SOMX052704-UM VP15TF": 400,
  "INS0111 SOMX063005-UM VP15TF": 300,
  "INS0112 SOMX073505-UM VP15TF": 500,
  "INS0128 SOMX094506-UM VP15TF": 300,
  "INS0129 SOMX115506-UM VP15TF": 300,
  "INS0130 SOMX136008-UM VP15TF": 300,
};

const MACHINES = [
  { id: "model X_1", name: "บริษัท โอเทค (ไทยแลนด์) จำกัด.", token: "808391529c762cd68ebf71e235a03c24", image: Machine1Img },
  { id: "model X_2", name: "บริษัท สายทิพย์ สแปพาร์ท จำกัด", token: "8fd8844af084f7a3c66571d6c8ce2d25", image: Machine1Img },
  { id: "model S", name: "บริษัท เอ็มอาร์พี เอ็นจิเนียริ่ง จำกัด", token: "f07e3a1527eec06004d07a61fa961d05", image: Machine3Img },
  { id: "model X_3", name: "บริษัท มิตซูบิชิ เอลเลเวเตอร์ เอเซีย จำกัด", token: "1f9f2d2d5c1449aee006b755fe098ae2", image: Machine1Img },
  { id: "model X_4", name: "บริษัท ซีเจแมนูแฟคเจอริ่ง จำกัด", token: "09186b5f436981f1f77235702cc901da", image: Machine3Img },
  { id: "Cute Bee", name: "บริษัท อินเตอร์ทูล เทคโนโลยี จำกัด", token: "d9ce4169af572df64bf07115b084e59a", image: Machine2Img },
  { id: "model S", name: "บริษัท เอ็นเอ็มบี-มินีแบ ไทย จำกัด", token: "54c2df056f042a37f3bac88a6d361b20", image: Machine1Img },
  { id: "model X_5", name: "บริษัท ซี.เอ.เอ.เอส.เอ.ช. โอโตพาร์ทส จำกัด", token: "1ea2d928bcc3309821509d098537be1d", image: Machine2Img },
  { id: "Backup", name: "ตู้สำรอง (Backup Unit)", token: "", image: Machine1Img },
];

const BACKEND_URL = "https://smartbee-backend-mtcb.onrender.com/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [allowedMachines, setAllowedMachines] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [data, setData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [allMachinesInventory, setAllMachinesInventory] = useState({});
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const [timeFilterMode, setTimeFilterMode] = useState("daily");

  const [emailConfig, setEmailConfig] = useState({ email: "", frequency: "Daily" });
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const CHART_COLORS = ['#3182ce', '#4299e1', '#63b3ed', '#90cdf4', '#bee3f8'];

  // --- 🎨 Styles ---
  const sidebarWidth = isSidebarOpen ? "180px" : "60px"; 
  const sidebarStyle = { width: sidebarWidth, height: "100vh", background: "#1e293b", color: "#fff", position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column", zIndex: 1000, boxShadow: "2px 0 8px rgba(0,0,0,0.1)", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", overflowX: "hidden" };
  const menuItemStyle = (isActive) => ({ padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", transition: "all 0.2s ease", background: isActive ? "#334155" : "transparent", color: isActive ? "#fbbf24" : "#94a3b8", borderLeft: isActive ? "3px solid #fbbf24" : "3px solid transparent", fontWeight: isActive ? "600" : "400", fontSize: "0.8rem", minWidth: "180px" });
  const contentContainerStyle = { marginLeft: sidebarWidth, flex: 1, minHeight: "100vh", background: "#f1f5f9", transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 900, height: "80px"  };
  const logoutBtnStyle = { background: "#fee2e2", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold", fontSize: "0.75rem" };
  const machineCardStyle = { cursor: "pointer", background: "#fff", padding: "15px", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", gap: "12px", alignItems: "center", transition: "0.3s" };
  const syncBtnStyle = { padding: "8px 14px", borderRadius: "8px", background: "#fbbf24", color: "#003366", border: "none", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center", fontWeight: "800", fontSize: "0.8rem" };
  const filterBarStyle = { background: "#fff", padding: "12px 20px", borderRadius: "15px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", flexWrap: "wrap" };
  const contentBoxStyle = { background: "#fff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0" };
  const backBtnStyle = { padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer", display: "flex", gap: "5px", alignItems: "center", fontWeight: "700", fontSize: "0.8rem" };
  const exportBtnStyle = { background: "#10b981", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", cursor: "pointer" };
  const thStyle = { padding: "10px 12px", color: "#64748b", fontSize: "0.75rem", textAlign: "left", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" };
  const tdStyle = { padding: "10px 12px", fontSize: "0.85rem", color: "#1e293b", borderBottom: "1px solid #f1f5f9" };
  const dateInputStyle = { padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.8rem" };
  
  const normalFilterBtnStyle = { padding: "6px 12px", fontSize: "0.75rem", fontWeight: "700", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", cursor: "pointer", transition: "all 0.2s" };
  const activeFilterBtnStyle = { padding: "6px 12px", fontSize: "0.75rem", fontWeight: "800", borderRadius: "8px", border: "1px solid #3b82f6", background: "#eff6ff", color: "#2563eb", cursor: "pointer", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.08)", transition: "all 0.2s" };

  // --- ⚙️ Logic ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("userName");
    const assigned = JSON.parse(localStorage.getItem("assignedMachines") || "[]");
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role || "");
      setUserName(name || "");
      setAllowedMachines(assigned);
    }
  }, []);

  const displayMachines = useMemo(() => {
    if (userRole === "admin") return MACHINES;
    return MACHINES.filter((m) => allowedMachines.includes(m.id));
  }, [userRole, allowedMachines]);

  const loadAllInventories = useCallback(async () => {
    const inventoryMap = {};
    for (const m of displayMachines) {
      if (!m.token) continue;
      try {
        const res = await fetch(`${BACKEND_URL}/inventory-status?token=${m.token}`);
        const result = await res.json();
        if (res.ok && Array.isArray(result)) {
          const lowStock = result.filter(item => Number(item.inventory) <= 5).sort((a, b) => a.inventory - b.inventory).slice(0, 3);
          inventoryMap[m.id] = lowStock;
        }
      } catch (err) { console.error(err); }
    }
    setAllMachinesInventory(inventoryMap);
  }, [displayMachines]);

  useEffect(() => {
    if (isLoggedIn && !selectedMachine) loadAllInventories();
  }, [isLoggedIn, selectedMachine, loadAllInventories]);

  const handleLogout = () => { localStorage.clear(); window.location.reload(); };

  const loadInventory = useCallback(async () => {
    if (!selectedMachine?.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/predict-stock?machineId=${selectedMachine.id}&token=${selectedMachine.token}`);
      const result = await res.json();
      if (res.ok) setInventoryData(Array.isArray(result) ? result : []);
    } catch (err) { console.error(err); }
  }, [selectedMachine]);

  const loadWorkOrders = useCallback(async () => {
    if (!selectedMachine?.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/work-orders?token=${selectedMachine.token}`);
      if (res.ok) {
        // ประวัติโหลดเวิร์กออเดอร์อนาคต
      }
    } catch (err) { console.error(err); }
  }, [selectedMachine]);

  useEffect(() => {
    if (selectedMachine) {
      if (activeTab === "inventory") loadInventory();
      loadWorkOrders();
    }
  }, [activeTab, selectedMachine, loadInventory, loadWorkOrders]);

  const filteredData = useMemo(() => {
    const groups = {};
    data.forEach((item) => {
      const groupKey = `${item.pay_time}_${item.user_name}_${item.product_name}`;
      if (!groups[groupKey]) { 
        groups[groupKey] = { 
          ...item, 
          pay_num_box: Number(item.pay_num || 0) / 10,
          product_order: item.product_order || "N/A" 
        }; 
      }
      else { 
        groups[groupKey].pay_num += item.pay_num; 
        groups[groupKey].actualTotalPcs = groups[groupKey].pay_num; 
        groups[groupKey].pay_num_box = groups[groupKey].pay_num / 10; 
      }
    });
    const groupedArray = Object.values(groups);
    if (!searchTerm) return groupedArray;
    const s = searchTerm.toLowerCase();
    return groupedArray.filter(item => (item.user_name || "").toLowerCase().includes(s) || (item.product_name || "").toLowerCase().includes(s));
  }, [data, searchTerm]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventoryData;
    const s = searchTerm.toLowerCase();
    return inventoryData.filter(item => (item.product_name || "").toLowerCase().includes(s));
  }, [inventoryData, searchTerm]);

  const clientReportData = useMemo(() => {
    const summary = data.reduce((acc, curr) => {
      const originalName = (curr.product_name || "").trim();
      const jobDisplay = curr.product_order && curr.product_order !== "null" && curr.product_order !== "undefined" ? curr.product_order : "N/A";
      
      const groupKey = `${originalName}_${jobDisplay}`.toUpperCase();
      
      const qtyPcs = curr.actualTotalPcs || curr.pay_num || 0;
      const unitPrice = PRICE_MAP[curr.product_name] || 0;

      if (!acc[groupKey]) { 
        acc[groupKey] = { 
          product_name: curr.product_name, 
          total_pay_num: 0, 
          pay_num_box: 0, 
          jobNo: jobDisplay, 
          unitPrice: unitPrice 
        }; 
      }
      acc[groupKey].total_pay_num += qtyPcs;
      acc[groupKey].pay_num_box = acc[groupKey].total_pay_num / 10;
      acc[groupKey].totalPrice = acc[groupKey].total_pay_num * unitPrice;
      return acc;
    }, {});
    return Object.values(summary).sort((a, b) => b.total_pay_num - a.total_pay_num);
  }, [data]);

  const searchedReportData = useMemo(() => {
    if (!searchTerm) return clientReportData;
    const s = searchTerm.toLowerCase();
    return clientReportData.filter(item => 
      (item.product_name || "").toLowerCase().includes(s) || 
      (item.jobNo || "").toLowerCase().includes(s)
    );
  }, [clientReportData, searchTerm]);

  const weeklyAverageReport = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const timestamps = filteredData
      .filter(item => item && item.pay_time && typeof item.pay_time === 'string' && item.pay_time.includes("/"))
      .map(item => {
        try {
          const datePart = item.pay_time.split(" ")[0];
          if (!datePart) return Date.now();
          const parts = datePart.split("/");
          if (parts.length < 3) return Date.now();
          const [d, m, y] = parts;
          return new Date(Number(y) - 543, Number(m) - 1, Number(d)).getTime();
        } catch (e) {
          return Date.now();
        }
      });

    const minTime = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
    const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    
    const totalDays = Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)));
    const totalWeeks = Math.max(1, totalDays / 7);

    const summary = {};
    filteredData.forEach((curr) => {
      if (!curr) return;
      const pName = (curr.product_name || "").trim();
      const qtyPcs = curr.pay_num || 0; 
      summary[pName] = (summary[pName] || 0) + qtyPcs;
    });

    return Object.keys(summary).map((pName) => {
      const totalPcs = summary[pName];
      const totalBoxes = totalPcs / 10;
      const avgBoxesPerWeek = totalBoxes / totalWeeks;

      return {
        product_name: pName,
        total_boxes: totalBoxes.toFixed(1),
        avg_boxes_per_week: avgBoxesPerWeek.toFixed(2)
      };
    }).sort((a, b) => b.avg_boxes_per_week - a.avg_boxes_per_week);
  }, [filteredData]);

  const grandTotalPrice = useMemo(() => {
    return searchedReportData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [searchedReportData]);

  const chartData = useMemo(() => {
    return [...searchedReportData].sort((a, b) => b.total_pay_num - a.total_pay_num).slice(0, 5).map(item => ({
      name: item.product_name.length > 8 ? item.product_name.substring(0, 8) + '...' : item.product_name,
      fullName: item.product_name,
      pcs: item.total_pay_num
    }));
  }, [searchedReportData]);

  const handleSendDirectEmail = async () => {
    if (!emailConfig.email) return alert("กรุณาระบุอีเมลในช่อง Auto Email Report ก่อนส่งครับ");

    let tableRows = "";
    if (activeTab === "inventory") {
      tableRows = filteredInventory.map(r => `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${r.product_name}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${r.inventory}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${MAX_STOCK_MAP[r.product_name] || 500}</td>
        </tr>
      `).join('');
    } else {
      tableRows = searchedReportData.map(r => `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${r.product_name}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${r.total_pay_num}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${r.totalPrice.toLocaleString()}</td>
        </tr>
      `).join('');
    }

    const emailHtml = `
      <table style="width:100%; border-collapse:collapse; font-family:sans-serif;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px; border:1px solid #ddd; text-align:left;">รายการ</th>
            <th style="padding:8px; border:1px solid #ddd;">จำนวน</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right;">${activeTab === 'inventory' ? 'ค่า MAX' : 'ราคารวม'}</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
        ${activeTab !== 'inventory' ? `<tfoot><tr><td colspan="2" style="padding:8px; border:1px solid #ddd; text-align:right; font-weight:bold;">รวมเงินทั้งสิ้น</td><td style="padding:8px; border:1px solid #ddd; text-align:right; font-weight:bold; color:#10b981;">${grandTotalPrice.toLocaleString()} บาท</td></tr></tfoot>` : ''}
      </table>
    `;

    const currentMenuLabel = activeTab === "inventory" ? "สต็อกสินค้า" : (activeTab === "dailyReport" ? "รายงานรายวัน" : activeTab === "weeklyReport" ? "รายงานรายสัปดาห์" : activeTab === "monthlyReport" ? "รายงานรายเดือน" : "สรุปยอดเบิก");

    const templateParams = {
      machine_name: selectedMachine.name,
      machine_id: selectedMachine.id,
      report_type: currentMenuLabel,
      date_range: `${startDate} ถึง ${endDate}`,
      message_html: emailHtml,
      sender_name: userName,
      to_email: emailConfig.email 
    };

    try {
      await emailjs.send('service_etonq6k', 'template_sfcj3ui', templateParams, 'o2nzoMtk3vBOPbX8V');
      alert(`🚀 ส่งรายงานเข้าอีเมล (${currentMenuLabel}) เรียบร้อยแล้ว!`);
    } catch (err) { alert("❌ ส่งเมลไม่สำเร็จ: " + JSON.stringify(err)); }
  };

  const handleExportCSV = () => {
    let csvContent = "";
    let fileName = "";
    const dl = ","; 

    const clean = (val) => {
      if (val === undefined || val === null) return "";
      let str = String(val).replace(/,/g, ""); 
      return `"${str}"`; 
    };

    if (activeTab === "inventory") {
      csvContent = ["ลำดับ", "ชื่อสินค้า", "คงเหลือ(ชิ้น)", "ค่า MAX"].join(dl) + "\n";
      filteredInventory.forEach((r, i) => {
        const fullStock = MAX_STOCK_MAP[r.product_name] || 500;
        csvContent += [i + 1, clean(r.product_name), r.inventory, fullStock].join(dl) + "\n";
      });
      fileName = `Inventory_${selectedMachine.id}.csv`;
    } else {
      csvContent = ["ลำดับ", "รายการสินค้า", "เบิก(กล่อง)", "รวม(ชิ้น)", "ราคา/ชิ้น", "ราคารวม", "Job No"].join(dl) + "\n";
      searchedReportData.forEach((r, i) => { 
        csvContent += [
          i + 1, clean(r.product_name), r.pay_num_box.toFixed(1), r.total_pay_num, r.unitPrice, r.totalPrice, clean(r.jobNo)
        ].join(dl) + "\n"; 
      });
      csvContent += ["", "", "", "", "รวมเงินทั้งสิ้น", grandTotalPrice, ""].join(dl) + "\n";
      
      const prefixMap = {
        "dailyReport": "Daily_Report",
        "weeklyReport": "Weekly_Report",
        "monthlyReport": "Monthly_Report"
      };
      const prefixName = prefixMap[activeTab] || "Report";
      fileName = `${prefixName}_${selectedMachine.id}.csv`;
    }
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEmailSchedule = async () => {
    if (!emailConfig.email) return alert("กรุณากรอกอีเมล");
    setIsSubmittingEmail(true);
    try {
      await fetch(`${BACKEND_URL}/save-email-schedule`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId: selectedMachine.id, machineName: selectedMachine.name, email: emailConfig.email, frequency: emailConfig.frequency, token: selectedMachine.token }),
      });
      alert(`✅ บันทึกอีเมล ${emailConfig.email} สำหรับรายงานเรียบร้อย!`);
    } catch (err) { alert("Error"); } finally { setIsSubmittingEmail(false); }
  };

  const loadDataFromDB = useCallback(async () => {
    if (!selectedMachine?.id || !startDate || !endDate) return;
    try {
      const res = await fetch(`${BACKEND_URL}/records?machineId=${selectedMachine.id}&startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`);
      const raw = await res.json();
      if (!res.ok || raw.length === 0) { setData([]); return; }
      const final = raw.map((r) => {
        const thaiTime = new Date(r.pay_time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
        return { ...r, pay_time: thaiTime, actualTotalPcs: r.pay_num, pay_num_box: Number(r.pay_num) / 10 };
      });
      setData(final);
    } catch (err) { console.error(err); }
  }, [selectedMachine, startDate, endDate]);

  useEffect(() => { loadDataFromDB(); }, [loadDataFromDB]);

  const handleTimeFilterTab = (mode) => {
    setTimeFilterMode(mode);
    
    const today = new Date();
    let start = new Date();
    let end = new Date();

    const formatDateStr = (date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

    if (mode === "daily") {
      start = today;
      end = today;
    } 
    else if (mode === "weekly") {
      const dayOfWeek = today.getDay(); 
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      start.setDate(today.getDate() - distanceToMonday);
      end.setDate(start.getDate() + 6);
    } 
    else if (mode === "monthly") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    setStartDate(formatDateStr(start));
    setEndDate(formatDateStr(end));
  };

  const switchToDailyReportMenu = () => {
    setActiveTab("dailyReport");
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    setStartDate(todayStr);
    setEndDate(todayStr);
    setTimeFilterMode("daily");
  };

  const switchToWeeklyReportMenu = () => {
    setActiveTab("weeklyReport");
    const today = new Date();
    let start = new Date();
    let end = new Date();

    const dayOfWeek = today.getDay(); 
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    start.setDate(today.getDate() - distanceToMonday);
    end.setDate(start.getDate() + 6);

    const formatDateStr = (date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    setStartDate(formatDateStr(start));
    setEndDate(formatDateStr(end));
    setTimeFilterMode("weekly");
  };

  const switchToMonthlyReportMenu = () => {
    setActiveTab("monthlyReport");
    const today = new Date();
    
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formatDateStr = (date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    setStartDate(formatDateStr(firstDay));
    setEndDate(formatDateStr(lastDay));
    setTimeFilterMode("monthly");
  };

  const handleSyncData = async () => {
    if (userRole !== "admin") return alert("Admin Only");
    setIsSyncing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/sync-records`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: selectedMachine.token, startDate, endDate, machineId: selectedMachine.id }), });
      if (res.ok) { 
        await loadDataFromDB(); 
        if (activeTab === "inventory") loadInventory(); 
        alert("✅ ซิงค์ข้อมูลสำเร็จ!"); 
      }
    } catch (err) { alert("Error"); } finally { setIsSyncing(false); }
  };

  if (!isLoggedIn) return <Login onLoginSuccess={() => window.location.reload()} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Prompt', sans-serif" }}>
      <aside style={sidebarStyle}>
        <div style={{ padding: "15px 0", textAlign: "center", minHeight: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
           {!isSidebarOpen && <Box size={24} color="#fbbf24" />}
        </div>
        <nav style={{ flex: 1, marginTop: "0px" }}>
          <div style={menuItemStyle(activeTab === "overview")} onClick={() => { setActiveTab("overview"); setSelectedMachine(null); }}> <LayoutDashboard size={18} /> <span style={{ opacity: isSidebarOpen ? 1 : 0, transition: "0.2s", marginLeft: "10px", whiteSpace: "nowrap" }}>ภาพรวมระบบ</span> </div>
          <div style={menuItemStyle(activeTab === "list" || activeTab === "clientReport")} onClick={() => { if(selectedMachine) setActiveTab("list"); else { setActiveTab("overview"); setSelectedMachine(null); } }}> <FileText size={18} /> <span style={{ opacity: isSidebarOpen ? 1 : 0, transition: "0.2s", marginLeft: "10px", whiteSpace: "nowrap" }}>รายงานการเบิก</span> </div>
          
          <div style={menuItemStyle(activeTab === "dailyReport")} onClick={switchToDailyReportMenu}> 
            <Mail size={18} /> 
            <span style={{ opacity: isSidebarOpen ? 1 : 0, transition: "0.2s", marginLeft: "10px", whiteSpace: "nowrap" }}>ส่งรีพอร์ต Daily</span> 
          </div>

          <div style={menuItemStyle(activeTab === "weeklyReport")} onClick={switchToWeeklyReportMenu}> 
            <Calendar size={18} /> 
            <span style={{ opacity: isSidebarOpen ? 1 : 0, transition: "0.2s", marginLeft: "10px", whiteSpace: "nowrap" }}>ส่งรีพอร์ต Weekly</span> 
          </div>

          <div style={menuItemStyle(activeTab === "monthlyReport")} onClick={switchToMonthlyReportMenu}> 
            <Calendar size={18} /> 
            <span style={{ opacity: isSidebarOpen ? 1 : 0, transition: "0.2s", marginLeft: "10px", whiteSpace: "nowrap" }}>ส่งรีพอร์ต Monthly</span> 
          </div>

          <div style={menuItemStyle(activeTab === "inventory")} onClick={() => { if(selectedMachine) setActiveTab("inventory"); else { setActiveTab("overview"); setSelectedMachine(null); } }}> <Package size={18} /> <span style={{ opacity: isSidebarOpen ? 1 : 0, transition: "0.2s", marginLeft: "10px", whiteSpace: "nowrap" }}>สต็อกสินค้า</span> </div>
        </nav>
        {isSidebarOpen && ( <div style={{ padding: "10px", borderTop: "1px solid #334155", background: "#0f172a" }}> <p style={{ fontSize: "0.55rem", color: "#64748b", margin: 0, textAlign: "center" }}>VER 2.5.5</p> </div> )}
      </aside>

      <main style={contentContainerStyle}>
        <header style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px", borderRadius: "8px", cursor: "pointer", color: "#1e293b", display: "flex" }}> <Menu size={18} /> </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "2px solid #f1f5f9", paddingLeft: "15px" }}>
              <img src={AppLogo} alt="Logo" style={{ height: "65px", width: "auto", objectFit: "contain" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "0.8rem", fontWeight: "900", color: "#64748b", margin: 0, lineHeight: 1.1 }}>SmartBee <span style={{ color: "#fbbf24", fontWeight: "500" }}>Box</span></h2>
                <span style={{ fontSize: "0.45rem", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>DASHBOARD SYSTEM</span>
              </div>
            </div>
            {selectedMachine && ( <div style={{ marginLeft: "5px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "10px", color: "#64748b", fontSize: "0.65rem", fontWeight: "700" }}> {activeTab.toUpperCase()} / {selectedMachine.id} </div> )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "800", color: "#1e293b" }}>{userName.toUpperCase()}</p>
              <p style={{ margin: 0, fontSize: "0.6rem", color: "#fbbf24", fontWeight: "bold" }}>{userRole.toUpperCase()}</p>
            </div>
            <button onClick={handleLogout} style={{...logoutBtnStyle, cursor: "pointer"}}><LogOut size={14} /> ออก</button>
          </div>
        </header>

        <div style={{ padding: "20px 30px" }}>
          <AnimatePresence mode="wait">
            {!selectedMachine || (activeTab === "overview" && activeTab !== "dailyReport" && activeTab !== "weeklyReport" && activeTab !== "monthlyReport") ? (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h1 style={{ color: "#1e293b", fontWeight: "900", fontSize: "1.6rem", marginBottom: "20px" }}>ตู้ Vending ทั้งหมด</h1>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "15px" }}>
                  {displayMachines.map((m) => (
                    <motion.div key={m.id} whileHover={{ y: -3 }} onClick={() => { setSelectedMachine(m); setActiveTab("clientReport"); }} style={machineCardStyle}>
                      <div style={{ flex: '0 0 100px', textAlign: 'center', borderRight: '1.5px solid #f1f5f9', paddingRight: '10px' }}>
                        <img src={m.image} style={{ width: "80px", height: "80px", objectFit: "contain" }} alt={m.name} />
                        <p style={{ fontWeight: "800", color: "#1e293b", marginTop: "5px", fontSize: '0.7rem' }}>{m.id}</p>
                      </div>
                      <div style={{ flex: 1, paddingLeft: '5px' }}>
                        <h4 style={{ margin: "0 0 5px 0", color: "#334155", fontSize: "0.8rem" }}>{m.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}> <AlertTriangle size={12} color="#e11d48" /> <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#e11d48' }}>สินค้าใกล้หมด</span> </div>
                        {allMachinesInventory[m.id] ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {allMachinesInventory[m.id].length > 0 ? allMachinesInventory[m.id].map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between', color: "#64748b", background: '#fff1f2', padding: '2px 5px', borderRadius: '4px' }}> <span>• {item.product_name.substring(0, 18)}...</span> <span style={{ fontWeight: "900", color: "#e11d48" }}>{item.inventory}</span> </div>
                            )) : <span style={{ fontSize: '0.6rem', color: '#10b981' }}>✅ สินค้าปกติ</span>}
                          </div>
                        ) : <RefreshCw size={10} className="animate-spin" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <button onClick={() => { setSelectedMachine(null); setActiveTab("overview"); }} style={backBtnStyle}><ArrowLeft size={14} /> กลับ</button>
                  <div style={{ display: "flex", background: "#fff", padding: "3px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <button onClick={() => setActiveTab("list")} style={{ ...backBtnStyle, border: "none", background: activeTab === "list" ? "#334155" : "transparent", color: activeTab === "list" ? "#fff" : "#64748b", cursor: "pointer" }}>ข้อมูลเบิก</button>
                    <button onClick={() => setActiveTab("clientReport")} style={{ ...backBtnStyle, border: "none", background: activeTab === "clientReport" ? "#334155" : "transparent", color: activeTab === "clientReport" ? "#fff" : "#64748b", cursor: "pointer" }}>รีพอร์ต</button>
                    <button onClick={() => setActiveTab("inventory")} style={{ ...backBtnStyle, border: "none", background: activeTab === "inventory" ? "#334155" : "transparent", color: activeTab === "inventory" ? "#fff" : "#64748b", cursor: "pointer" }}>สต็อก</button>
                  </div>
                  
                  {/* 🚀 ยกระดับปุ่มซิงค์ตัวเดิมด้วย motion.button พร้อมเอฟเฟกต์หมุนสไตล์แอนิเมชัน */}
                  {userRole === "admin" && (
                    <motion.button
                      onClick={handleSyncData}
                      disabled={isSyncing}
                      whileHover={!isSyncing ? { scale: 1.05, backgroundColor: "#facc15" } : {}}
                      whileTap={!isSyncing ? { scale: 0.95 } : {}}
                      style={{
                        ...syncBtnStyle,
                        cursor: isSyncing ? "not-allowed" : "pointer",
                        opacity: isSyncing ? 0.65 : 1,
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 4px 6px -1px rgba(250, 204, 21, 0.2)",
                        transition: "opacity 0.2s ease, box-shadow 0.2s ease",
                      }}
                    >
                      <RefreshCw
                        size={14}
                        style={{
                          animation: isSyncing ? "spin 1s linear infinite" : "none"
                        }}
                      />
                      <span>{isSyncing ? "กำลังซิงค์..." : "ซิงค์"}</span>

                      <style>{`
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `}</style>
                    </motion.button>
                  )}
                </div>

                {activeTab === "dailyReport" ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={contentBoxStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "15px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Mail size={22} color="#2563eb" />
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "900", color: "#1e293b" }}>ระบบส่งรายงานข้อมูลประจำวัน (Daily Report Center)</h3>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>ตู้ปัจจุบัน: {selectedMachine?.name} ({selectedMachine?.id})</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSendDirectEmail} style={{ ...exportBtnStyle, background: '#6366f1' }}><Send size={14} style={{marginRight:'5px'}}/> ส่งเข้าเมลด่วนประจำวัน</button>
                        <button onClick={handleExportCSV} style={exportBtnStyle}><Download size={14} style={{marginRight:'5px'}}/> ดาวน์โหลดไฟล์ CSV ประจำวัน</button>
                      </div>
                    </div>
                    <div style={{ marginTop: "15px" }}>
                      <ReportTable records={filteredData} getProductInfo={() => ({ pcsPerBox: 10 })} hidePrice={false} />
                    </div>
                  </motion.div>
                ) : activeTab === "weeklyReport" ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={contentBoxStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "15px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Calendar size={22} color="#ea580c" />
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "900", color: "#1e293b" }}>ระบบส่งรายงานรอบสัปดาห์ (Weekly Report Center)</h3>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>ช่วงเวลาสัปดาห์นี้: {startDate} ถึง {endDate}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSendDirectEmail} style={{ ...exportBtnStyle, background: '#6366f1' }}><Send size={14} style={{marginRight:'5px'}}/> ส่งเข้าเมลด่วนรอบสัปดาห์</button>
                        <button onClick={handleExportCSV} style={{ ...exportBtnStyle, background: '#ea580c' }}><Download size={14} style={{marginRight:'5px'}}/> ดาวน์โหลดไฟล์ CSV รอบสัปดาห์</button>
                      </div>
                    </div>
                    <div style={{ marginTop: "15px" }}>
                      <ReportTable records={filteredData} getProductInfo={() => ({ pcsPerBox: 10 })} hidePrice={false} />
                    </div>
                  </motion.div>
                ) : activeTab === "monthlyReport" ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={contentBoxStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "15px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Calendar size={22} color="#10b981" />
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "900", color: "#1e293b" }}>ระบบส่งรายงานประจำเดือน (Monthly Report Center)</h3>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>ช่วงเวลาเดือนนี้: {startDate} ถึง {endDate}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSendDirectEmail} style={{ ...exportBtnStyle, background: '#6366f1' }}><Send size={14} style={{marginRight:'5px'}}/> ส่งเข้าเมลด่วนประจำเดือน</button>
                        <button onClick={handleExportCSV} style={{ ...exportBtnStyle, background: '#10b981' }}><Download size={14} style={{marginRight:'5px'}}/> ดาวน์โหลดไฟล์ CSV ประจำเดือน</button>
                      </div>
                    </div>
                    <div style={{ marginTop: "15px" }}>
                      <ReportTable records={filteredData} getProductInfo={() => ({ pcsPerBox: 10 })} hidePrice={false} />
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div style={{ ...contentBoxStyle, marginBottom: '15px', background: '#f8fafc', borderStyle: 'dashed', padding: '12px 20px' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3182ce' }}> <Mail size={18} /> <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>Auto Email Report</h4> </div>
                        <input type="email" placeholder="กรอกอีเมลสำหรับรับรีพอร์ต..." value={emailConfig.email} onChange={(e) => setEmailConfig({...emailConfig, email: e.target.value})} style={{ ...dateInputStyle, flex: 1, maxWidth: '300px' }} />
                        <button onClick={handleSaveEmailSchedule} disabled={isSubmittingEmail} style={{ ...exportBtnStyle, background: '#3182ce' }}> บันทึกอีเมล <Send size={12} style={{marginLeft: '5px'}} /> </button>
                      </div>
                    </div>

                    <div style={filterBarStyle}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button onClick={() => handleTimeFilterTab("daily")} style={timeFilterMode === "daily" ? activeFilterBtnStyle : normalFilterBtnStyle}>📆 รายวัน</button>
                        <button onClick={() => handleTimeFilterTab("weekly")} style={timeFilterMode === "weekly" ? activeFilterBtnStyle : normalFilterBtnStyle}>📅 รายสัปดาห์</button>
                        <button onClick={() => handleTimeFilterTab("monthly")} style={timeFilterMode === "monthly" ? activeFilterBtnStyle : normalFilterBtnStyle}>🗓️ รายเดือน</button>
                        
                        <div style={{ borderLeft: "2px solid #e2e8f0", height: "20px", margin: "0 5px" }} />
                        
                        <Calendar size={14} color="#64748b" />
                        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setTimeFilterMode("custom"); }} style={dateInputStyle} />
                        <span>-</span>
                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setTimeFilterMode("custom"); }} style={dateInputStyle} />
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '2px 15px', borderRadius: '12px', border: '1.5px solid #e2e8f0', width: '100%', maxWidth: '350px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', transition: 'all 0.2s', marginLeft: 'auto' }}>
                        <Search size={16} color="#94a3b8" />
                        <input type="text" placeholder="ค้นหาชื่อสินค้า หรือ รหัสใบงาน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', padding: '10px', width: '100%', outline: 'none', fontSize: '0.85rem', color: '#1e293b' }} />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSendDirectEmail} style={{ ...exportBtnStyle, background: '#6366f1' }}><Send size={14} style={{marginRight:'5px'}}/> ส่งเข้าเมลด่วน</button>
                        <button onClick={handleExportCSV} style={exportBtnStyle}><Download size={14} style={{marginRight:'5px'}}/> CSV</button>
                      </div>
                    </div>

                    {activeTab === "clientReport" ? (
                      <div style={contentBoxStyle}>
                        <h3 style={{ marginBottom: "15px", fontSize: "1rem" }}>Customer Report: {selectedMachine.name}</h3>
                        <div style={{ height: "250px", marginBottom: "20px", padding: "10px", background: "#fcfcfc", borderRadius: "15px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '10px' }} />
                              <Bar dataKey="pcs" radius={[5, 5, 0, 0]} barSize={30}> {chartData.map((entry, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)} </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={thStyle}>รุ่นเครื่องมือ</th>
                              <th style={{...thStyle, textAlign: 'center'}}>เบิก (กล่อง)</th>
                              <th style={{...thStyle, textAlign: 'center'}}>รวม (ชิ้น)</th>
                              <th style={{...thStyle, textAlign: 'right'}}>ราคา/ชิ้น</th>
                              <th style={{...thStyle, textAlign: 'right'}}>ราคารวม (บาท)</th>
                              <th style={thStyle}>ใบสั่งงาน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchedReportData.map((item, idx) => (
                              <tr key={idx}>
                                <td style={tdStyle}>{item.product_name}</td>
                                <td style={{...tdStyle, textAlign: 'center'}}>{item.pay_num_box.toFixed(1)}</td>
                                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '800', color: '#3182ce', background: '#f0f9ff' }}>{item.total_pay_num}</td>
                                <td style={{...tdStyle, textAlign: 'right', color: '#64748b'}}>{item.unitPrice.toLocaleString()}</td>
                                <td style={{...tdStyle, textAlign: 'right', fontWeight: 'bold'}}>{item.totalPrice.toLocaleString()}</td>
                                <td style={{...tdStyle, color: '#2563eb', fontWeight: 'bold', fontSize: '0.85rem'}}>{item.jobNo}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="4" style={{...tdStyle, textAlign: 'right', fontWeight: '900', borderTop: '2px solid #e2e8f0'}}>รวมเงินทั้งสิ้น</td>
                              <td style={{...tdStyle, textAlign: 'right', fontWeight: '900', color: '#10b981', fontSize: '1rem', borderTop: '2px solid #e2e8f0'}}>{grandTotalPrice.toLocaleString()}</td>
                              <td style={{...tdStyle, borderTop: '2px solid #e2e8f0'}}>บาท</td>
                            </tr>
                          </tfoot>
                        </table>

                        <div style={{ marginTop: "40px", borderTop: "2px dashed #e2e8f0", paddingTop: "20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
                            <BarChart2 size={18} color="#ea580c" />
                            <h3 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#1e293b", margin: 0 }}> สรุปอัตราเบิกเฉลี่ยรายสัปดาห์ (Weekly Purchase Planning) </h3>
                          </div>
                          
                          <table style={{ width: "100%", borderCollapse: "collapse", background: "#f8fafc", borderRadius: "12px", overflow: "hidden" }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9" }}>
                                <th style={{ ...thStyle, width: "60px", background: "transparent", textAlign: "center" }}>ลำดับ</th>
                                <th style={{ ...thStyle, background: "transparent" }}>รายการสินค้า</th>
                                <th style={{ ...thStyle, width: "200px", textAlign: "center", background: "transparent" }}>เบิกรวมในช่วงนี้ (กล่อง)</th>
                                <th style={{ ...thStyle, width: "220px", textAlign: "center", color: "#ea580c", background: "transparent" }}>เฉลี่ยเบิก/สัปดาห์ (กล่อง)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {weeklyAverageReport.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                                  <td style={{ ...tdStyle, fontWeight: "600", color: "#334155" }}>{row.product_name}</td>
                                  <td style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>{row.total_boxes} กล่อง</td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: "900", color: "#ea580c", background: "#fff7ed", fontSize: "0.85rem" }}> {row.avg_boxes_per_week} กล่อง/สัปดาห์ </td>
                                </tr>
                              ))}
                              {weeklyAverageReport.length === 0 && (
                                <tr> <td colSpan="4" style={{ ...tdStyle, textAlign: "center", padding: "30px", color: "#94a3b8" }}> ไม่มีข้อมูลสถิติสำหรับช่วงเวลาที่เลือก </td> </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : activeTab === "inventory" ? (
                      <div style={contentBoxStyle}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "12px" }}>
                          {filteredInventory.length > 0 ? filteredInventory.map((item, i) => {
                            const fullStock = MAX_STOCK_MAP[item.product_name] || 500;
                            const currentQty = Number(item.inventory);
                            const percent = Math.min((currentQty / fullStock) * 100, 100);
                            const isStockUrgent = item.days_remaining !== "not-specified" && Number(item.days_remaining) <= 3.0;

                            return (
                              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={item.product_name} style={{ padding: "15px", borderRadius: "18px", border: `1px solid ${currentQty <= 5 || isStockUrgent ? "#fee2e2" : "#f1f5f9"}`, background: currentQty <= 5 || isStockUrgent ? "#fffafb" : "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: "0.75rem", color: '#334155', minHeight: '38px', lineHeight: '1.4' }}>{item.product_name}</h4>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                                    <p style={{ fontSize: "1.2rem", fontWeight: "900", color: currentQty <= 5 || isStockUrgent ? "#ef4444" : "#1e293b", margin: 0 }}> {currentQty} <span style={{fontSize: '0.7rem', fontWeight: '500', color: '#94a3b8'}}>ชิ้น</span> </p>
                                    <p style={{ fontSize: "0.65rem", color: "#94a3b8", margin: 0, fontWeight: "600" }}>เต็ม: {fullStock}</p>
                                  </div>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#f8fafc', borderRadius: '10px', marginTop: '12px', overflow: 'hidden' }}>
                                  <div style={{ width: `${percent}%`, height: '100%', background: currentQty <= 5 ? "#ef4444" : (percent < 30 ? "#f59e0b" : "#3182ce"), transition: 'width 0.5s ease-out' }} />
                                </div>
                                <div style={{ marginTop: '12px', padding: '6px 10px', borderRadius: '8px', background: isStockUrgent ? '#fef2f2' : '#fff7ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${isStockUrgent ? '#fecaca' : '#ffedd5'}` }}>
                                  <span style={{ fontSize: '0.65rem', color: isStockUrgent ? '#ef4444' : '#c2410c', fontWeight: '700' }}>ทำนายวิกฤต:</span>
                                  <span style={{ fontSize: '0.68rem', color: isStockUrgent ? '#dc2626' : '#ea580c', fontWeight: '800' }}> {item.days_remaining === "ไม่ระบุ" ? "⚡ สต็อกนิ่งคงที่" : `⏳ หมดใน ${item.days_remaining} วัน`} </span>
                                </div>
                              </motion.div>
                            );
                          }) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '20px' }}> <Search size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} /> <p style={{ color: '#94a3b8' }}>ไม่พบรายการสินค้าที่คุณค้นหา</p> </div>
                          )}
                        </div>
                      </div>
                    ) : ( 
                      <div style={contentBoxStyle}>
                        <ReportTable records={filteredData} getProductInfo={() => ({ pcsPerBox: 10 })} hidePrice={false} />
                      </div> 
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;