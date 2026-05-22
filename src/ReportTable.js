import React, { useState, useMemo } from "react";

const ReportTable = ({ records = [], calculateTotalPrice, getProductInfo, hidePrice = true }) => {
  
  // 1. คลังหัวข้อตารางทั้งหมด
  const columnLabels = [
    { key: "user_name", label: "ผู้เบิก" },
    { key: "employee_id", label: "รหัสพนักงาน" },
    { key: "date", label: "วันที่บันทึก" },
    { key: "time", label: "เวลาเบิก" },
    { key: "description", label: "รุ่นเครื่องมือ" },
    { key: "cabinet_no", label: "ช่องเก็บเครื่องมือ" },
    { key: "category", label: "หมวดหมู่" },
    { key: "brand", label: "ยี่ห้อ" },
    { key: "supplier", label: "ผู้จำหน่าย" },
    { key: "qty", label: "เบิก (ชิ้น)" },
    { key: "unit_price", label: "ราคาต่อหน่วย" },
    { key: "cost", label: "ค่าใช้จ่าย" },
    { key: "material_code", label: "รหัสวัสดุ" },
    { key: "work_order", label: "ใบสั่งซื้อสินค้า/งาน" },
  ];

  const [visibleColumns, setVisibleColumns] = useState({
    no: true,            
    user_name: true,     
    employee_id: true,   
    date: true,          
    time: true,          
    description: true,   
    cabinet_no: true,    
    category: true,      
    brand: true,         
    supplier: true,      
    qty: true,           
    unit_price: true,    
    cost: true,          
    material_code: true, 
    work_order: true,    
  });

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  // 🚩 สถานะเปิด/ปิด โหมดจัดกลุ่มตามไอเทมสินค้า (Item Description)
  const [isGroupByItem, setIsGroupByItem] = useState(false);

  // ฟังก์ชันจัดฟอร์แมตวันที่และเวลา
  const formatThaiDate = (dateString) => {
    if (!dateString) return { date: "-", time: "" };
    if (typeof dateString === "string" && (dateString.includes("/") || dateString.includes(":"))) {
      const parts = dateString.split(" ");
      return { date: parts[0] || dateString, time: parts[1] || "" };
    }
    const dateObj = new Date(dateString);
    if (Number.isNaN(dateObj.getTime())) return { date: "-", time: "" };

    const date = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bangkok" });
    const time = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });
    return { date, time };
  };

  const handleCheckboxChange = (columnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

  // 🚩 🏁 ลอจิกคัดแยกเรียงรุ่นสินค้าซ้ำ และแทรกแถว Subtotal สีเหลืองรายไอเทม
  const renderRowsWithSubtotals = useMemo(() => {
    if (records.length === 0) return [];

    // โหมดปกติ: พ่นแถวเรียงตามเวลาปกติ
    if (!isGroupByItem) {
      return records.map((item, index) => ({
        type: "data",
        data: item,
        index: index
      }));
    }

    // โหมดจัดกลุ่มไอเทม: สั่งเรียงชื่อรุ่นสินค้า (product_name) ที่ซ้ำกันให้อยู่ติดกลุ่มเดียวกัน
    const sortedRecords = [...records].sort((a, b) => {
      const itemA = (a.product_name || "").trim();
      const itemB = (b.product_name || "").trim();
      return itemA.localeCompare(itemB, "th");
    });

    const finalRows = [];
    let currentItemName = (sortedRecords[0].product_name || "").trim();
    let subtotalQty = 0;
    let subtotalCost = 0;
    let dataIndex = 0;

    sortedRecords.forEach((item, idx) => {
      const itemName = (item.product_name || "").trim();
      const uPrice = item.unit_price ?? 0;
      const qtyPcs = item.pay_num ?? 0;
      const liveCost = uPrice * qtyPcs;

      // จังหวะตัดบล็อก: ถ้าเปลี่ยนขึ้นเครื่องมือรุ่นใหม่ ให้พ่นแถวสีเหลืองสรุปยอดของรุ่นเก่าก่อน
      if (itemName !== currentItemName) {
        finalRows.push({
          type: "subtotal",
          itemName: currentItemName,
          qtySum: subtotalQty,
          costSum: subtotalCost
        });
        // รีเซ็ตค่านับสะสมกลุ่มใหม่
        subtotalQty = 0;
        subtotalCost = 0;
        currentItemName = itemName;
      }

      subtotalQty += qtyPcs;
      subtotalCost += liveCost;
      
      finalRows.push({
        type: "data",
        data: item,
        index: dataIndex++
      });

      // ดักรอบสุดท้าย: พ่นแถวสีเหลืองสรุปยอดให้กับไอเทมรุ่นสุดท้ายในตาราง
      if (idx === sortedRecords.length - 1) {
        finalRows.push({
          type: "subtotal",
          itemName: currentItemName,
          qtySum: subtotalQty,
          costSum: subtotalCost
        });
      }
    });

    return finalRows;
  }, [records, isGroupByItem]);

  // คำนวณยอดสะสมรวมสุทธิ (Grand Total ท้ายตาราง)
  const totalQtySum = records.reduce((sum, item) => sum + (item.pay_num ?? 0), 0);
  const totalCostSum = records.reduce((sum, item) => sum + ((item.unit_price ?? 0) * (item.pay_num ?? 0)), 0);

  const activeColumnsCount = Object.values(visibleColumns).filter(Boolean).length;

  // ฟังก์ชันดาวน์โหลด Excel (.xls สลับสี)
  const downloadAsExcel = () => {
    if (!records || records.length === 0) return alert("ไม่พบข้อมูลรายงานครับพี่");

    const headers = [];
    if (visibleColumns.no) headers.push("ลำดับ");
    if (visibleColumns.user_name) headers.push("ผู้เบิก");
    if (visibleColumns.employee_id) headers.push("รหัสพนักงาน");
    if (visibleColumns.date) headers.push("วันที่บันทึก");
    if (visibleColumns.time) headers.push("เวลาเบิก");
    if (visibleColumns.description) headers.push("รุ่นเครื่องมือ(DESCRIPTION)");
    if (visibleColumns.cabinet_no) headers.push("ช่องเก็บเครื่องมือ");
    if (visibleColumns.category) headers.push("หมวดหมู่");
    if (visibleColumns.brand) headers.push("ยี่ห้อ");
    if (visibleColumns.supplier) headers.push("ผู้จำหน่าย");
    if (visibleColumns.qty) headers.push("เบิก(ชิ้น)");
    if (visibleColumns.unit_price) headers.push("ราคาต่อหน่วย");
    if (visibleColumns.cost) headers.push("ค่าใช้จ่าย");
    if (visibleColumns.material_code) headers.push("รหัสวัสดุ");
    if (visibleColumns.work_order) headers.push("ใบสั่งซื้อสินค้า/งาน");

    let htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; font-family: 'Tahoma', sans-serif; }
          th { background-color: #3b82f6; color: white; font-weight: bold; border: 1px solid #94a3b8; text-align: center; font-size: 10pt; }
          td { border: 1px solid #cbd5e1; font-size: 10pt; vertical-align: middle; padding: 6px 8px; text-align: center; }
          .even-row { background-color: #eff6ff; }
          .odd-row { background-color: #ffffff; }
          .subtotal-row { background-color: #fef08a; font-weight: bold; }
          .total-row { background-color: #e2e8f0; font-weight: bold; }
        </style>
      </head>
      <body><table><thead><tr>`;

    headers.forEach(header => { htmlTable += `<th style="width: 150px; height: 32px;">${header}</th>`; });
    htmlTable += `</tr></thead><tbody>`;

    renderRowsWithSubtotals.forEach((row) => {
      if (row.type === "data") {
        const item = row.data;
        const { date, time } = formatThaiDate(item.pay_time);
        const productCode = item.product_name ? item.product_name.split(" ")[0] : "-";
        const displayLabel = item.cutter_type && item.cutter_type !== "0" ? String(item.cutter_type) : "TOOL/HOLDER";
        const finalWorkOrder = item.product_order && item.product_order !== "N/A" && item.product_order !== "null" ? item.product_order : (item.jobNo && item.jobNo !== "N/A" && item.jobNo !== "null" ? item.jobNo : "-");
        const uPrice = item.unit_price ?? 0;
        const qtyPcs = item.pay_num ?? 0;
        const bgStyle = row.index % 2 === 0 ? "even-row" : "odd-row";

        htmlTable += `<tr class="${bgStyle}" style="height: 26px;">`;
        if (visibleColumns.no) htmlTable += `<td>${row.index + 1}</td>`;
        if (visibleColumns.user_name) htmlTable += `<td>${item.user_name || "-"}</td>`;
        if (visibleColumns.employee_id) htmlTable += `<td>${item.employee_id || "-"}</td>`;
        if (visibleColumns.date) htmlTable += `<td>${date}</td>`;
        if (visibleColumns.time) htmlTable += `<td>${time || "-"}</td>`;
        if (visibleColumns.description) htmlTable += `<td>${item.product_name || "-"}</td>`;
        if (visibleColumns.cabinet_no) htmlTable += `<td>${item.cabinet_no || "-"}</td>`;
        if (visibleColumns.category) htmlTable += `<td>${displayLabel}</td>`;
        if (visibleColumns.brand) htmlTable += `<td>${item.brand_name || "-"}</td>`;
        if (visibleColumns.supplier) htmlTable += `<td>${item.specification || "-"}</td>`;
        if (visibleColumns.qty) htmlTable += `<td>${qtyPcs}</td>`;
        if (visibleColumns.unit_price) htmlTable += `<td>${uPrice.toLocaleString("th-TH")} ฿</td>`;
        if (visibleColumns.cost) htmlTable += `<td>${(uPrice * qtyPcs).toLocaleString("th-TH")} ฿</td>`;
        if (visibleColumns.material_code) htmlTable += `<td>${productCode}</td>`;
        if (visibleColumns.work_order) htmlTable += `<td>${finalWorkOrder}</td>`;
        htmlTable += `</tr>`;
      } else if (row.type === "subtotal") {
        htmlTable += `<tr class="subtotal-row" style="height: 28px;">`;
        if (visibleColumns.no) htmlTable += `<td></td>`;
        if (visibleColumns.user_name) htmlTable += `<td colspan="9" style="text-align: left; padding-left: 15px;">📊 ยอดสรุปรวมของรุ่น: ${row.itemName}</td>`;
        else {
          if (visibleColumns.employee_id) htmlTable += `<td></td>`;
          if (visibleColumns.date) htmlTable += `<td></td>`;
          if (visibleColumns.time) htmlTable += `<td></td>`;
          if (visibleColumns.description) htmlTable += `<td>รุ่น: ${row.itemName}</td>`;
          if (visibleColumns.cabinet_no) htmlTable += `<td></td>`;
          if (visibleColumns.category) htmlTable += `<td></td>`;
          if (visibleColumns.brand) htmlTable += `<td></td>`;
          if (visibleColumns.supplier) htmlTable += `<td></td>`;
        }
        if (visibleColumns.qty) htmlTable += `<td>${row.qtySum}</td>`;
        if (visibleColumns.unit_price) htmlTable += `<td></td>`;
        if (visibleColumns.cost) htmlTable += `<td>${row.costSum.toLocaleString("th-TH")} ฿</td>`;
        if (visibleColumns.material_code) htmlTable += `<td></td>`;
        if (visibleColumns.work_order) htmlTable += `<td></td>`;
        htmlTable += `</tr>`;
      }
    });

    htmlTable += `<tr class="total-row" style="height: 32px;">`;
    if (visibleColumns.no) htmlTable += `<td></td>`;
    if (visibleColumns.user_name) htmlTable += `<td><b>GRAND TOTAL</b></td>`;
    if (visibleColumns.employee_id) htmlTable += `<td></td>`;
    if (visibleColumns.date) htmlTable += `<td></td>`;
    if (visibleColumns.time) htmlTable += `<td></td>`;
    if (visibleColumns.description) htmlTable += `<td></td>`;
    if (visibleColumns.cabinet_no) htmlTable += `<td></td>`;
    if (visibleColumns.category) htmlTable += `<td></td>`;
    if (visibleColumns.brand) htmlTable += `<td></td>`;
    if (visibleColumns.supplier) htmlTable += `<td></td>`;
    if (visibleColumns.qty) htmlTable += `<td><b>${totalQtySum}</b></td>`;
    if (visibleColumns.unit_price) htmlTable += `<td></td>`;
    if (visibleColumns.cost) htmlTable += `<td><b>${totalCostSum.toLocaleString("th-TH")} ฿</b></td>`;
    if (visibleColumns.material_code) htmlTable += `<td></td>`;
    if (visibleColumns.work_order) htmlTable += `<td></td>`;
    htmlTable += `</tr>`;

    htmlTable += `</tbody></table></body></html>`;

    const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SmartBee_Item_Report_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.xls`);
    link.click();
    setShowDownloadMenu(false);
  };

  // ฟังก์ชันดาวน์โหลด CSV
  const downloadAsCSV = () => {
    if (records.length === 0) return alert("ไม่มีข้อมูลครับ");
    const headers = [];
    if (visibleColumns.no) headers.push("ลำดับ");
    if (visibleColumns.user_name) headers.push("ผู้เบิก");
    if (visibleColumns.employee_id) headers.push("รหัสพนักงาน");
    if (visibleColumns.date) headers.push("วันที่บันทึก");
    if (visibleColumns.time) headers.push("เวลาเบิก");
    if (visibleColumns.description) headers.push("รุ่นเครื่องมือ(DESCRIPTION)");
    if (visibleColumns.cabinet_no) headers.push("ช่องเก็บเครื่องมือ");
    if (visibleColumns.category) headers.push("หมวดหมู่");
    if (visibleColumns.brand) headers.push("ยี่ห้อ");
    if (visibleColumns.supplier) headers.push("ผู้จำหน่าย");
    if (visibleColumns.qty) headers.push("เบิก(ชิ้น)");
    if (visibleColumns.unit_price) headers.push("ราคาต่อหน่วย");
    if (visibleColumns.cost) headers.push("ค่าใช้จ่าย");
    if (visibleColumns.material_code) headers.push("รหัสวัสดุ");
    if (visibleColumns.work_order) headers.push("ใบสั่งซื้อสินค้า/งาน");

    const csvRows = [headers.join(",")];
    records.forEach((item, index) => {
      const { date, time } = formatThaiDate(item.pay_time);
      const productCode = item.product_name ? item.product_name.split(" ")[0] : "-";
      const displayLabel = item.cutter_type && item.cutter_type !== "0" ? String(item.cutter_type) : "TOOL/HOLDER";
      const finalWorkOrder = item.product_order && item.product_order !== "N/A" && item.product_order !== "null" ? item.product_order : (item.jobNo && item.jobNo !== "N/A" && item.jobNo !== "null" ? item.jobNo : "-");
      
      const rowData = [];
      if (visibleColumns.no) rowData.push(`"${index + 1}"`);
      if (visibleColumns.user_name) rowData.push(`"${item.user_name || "-"}"`);
      if (visibleColumns.employee_id) rowData.push(`"${item.employee_id || "-"}"`);
      if (visibleColumns.date) rowData.push(`"${date}"`);
      if (visibleColumns.time) rowData.push(`"${time || "-"}"`);
      if (visibleColumns.description) rowData.push(`"${(item.product_name || "-").replace(/"/g, '""')}"`);
      if (visibleColumns.cabinet_no) rowData.push(`"${item.cabinet_no || item.box_no || item.cell_no || "-"}"`);
      if (visibleColumns.category) rowData.push(`"${displayLabel}"`);
      if (visibleColumns.brand) rowData.push(`"${item.brand_name || "-"}"`);
      if (visibleColumns.supplier) rowData.push(`"${item.specification || "-"}"`);
      if (visibleColumns.qty) rowData.push(`"${item.pay_num ?? 0}"`);
      if (visibleColumns.unit_price) rowData.push(`"${item.unit_price ?? 0}"`);
      if (visibleColumns.cost) rowData.push(`"${(item.unit_price ?? 0) * (item.pay_num ?? 0)}"`);
      if (visibleColumns.material_code) rowData.push(`"${productCode}"`);
      if (visibleColumns.work_order) rowData.push(`"${finalWorkOrder}"`);
      csvRows.push(rowData.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SmartBee_CSV_Report_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.csv`);
    link.click();
    setShowDownloadMenu(false);
  };

  return (
    <div>
      {/* แผงควบคุมหัวตาราง อัปเกรดปุ่มฟิลเตอร์เป็นแบบเรียงกลุ่มไอเทมสินค้าสินค้าตรงเป้าหมาย */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#f8fafc",
        padding: "15px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        marginBottom: "15px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>
            🛠️ เครื่องมือรายงาน:
          </span>
          <button
            onClick={() => setIsGroupByItem(!isGroupByItem)}
            style={{
              padding: "5px 14px",
              borderRadius: "20px",
              fontSize: "0.72rem",
              fontWeight: "700",
              cursor: "pointer",
              border: `1.5px solid ${isGroupByItem ? "#eab308" : "#cbd5e1"}`,
              background: isGroupByItem ? "#fef9c3" : "#ffffff",
              color: isGroupByItem ? "#a16207" : "#475569",
              transition: "all 0.15s ease-out",
              boxShadow: isGroupByItem ? "0 2px 4px rgba(234,179,8,0.12)" : "none"
            }}
          >
            📦 {isGroupByItem ? "🔍 กำลังแยกกลุ่มตามไอเทม (รุ่นสินค้า)" : "🗂️ เปิดโหมดแทรกแถวสรุปย่อยรายไอเทม"}
          </button>
        </div>
        
        <div style={{ position: "relative", display: "inline-block", marginLeft: "auto" }}>
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "0.72rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            📥 ดาวน์โหลดรายงานประจำตู้ ▾
          </button>

          {showDownloadMenu && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "115%",
              background: "white",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              zIndex: 50,
              minWidth: "160px",
              overflow: "hidden"
            }}>
              <button
                onClick={downloadAsExcel}
                style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", fontSize: "0.75rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}
                onMouseOver={(e) => e.target.style.background = "#f1f5f9"}
                onMouseOut={(e) => e.target.style.background = "none"}
              >
                🟢 ไฟล์ Excel (.xls สลับสี)
              </button>
              <button
                onClick={downloadAsCSV}
                style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", fontSize: "0.75rem", fontWeight: "600", color: "#1e293b", cursor: "pointer", borderTop: "1px solid #f1f5f9" }}
                onMouseOver={(e) => e.target.style.background = "#f1f5f9"}
                onMouseOut={(e) => e.target.style.background = "none"}
              >
                🔵 ไฟล์ CSV (.csv คลีนดิบ)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* บล็อก Checkboxes ตัวเลือกเปิด/ปิดคอลัมน์ */}
      <div style={{ background: "#ffffff", padding: "12px 15px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "15px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 15px" }}>
          {columnLabels.map((col) => (
            <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={visibleColumns[col.key]} onChange={() => handleCheckboxChange(col.key)} style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#2563eb" }} />
              {col.label}
            </label>
          ))}
        </div>
      </div>

      {/* ตารางหลักจัดเรียงกลางหน้าจอสมบูรณ์แบบ */}
      <div style={{ width: "100%", overflowX: "hidden", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", tableLayout: "auto" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {visibleColumns.no && <th style={{ ...headerStyle, textAlign: "center" }}>#</th>}
              {visibleColumns.user_name && <th style={{ ...headerStyle, textAlign: "center" }}>ผู้เบิก</th>}
              {visibleColumns.employee_id && <th style={{ ...headerStyle, textAlign: "center" }}>รหัสพนักงาน</th>}
              {visibleColumns.date && <th style={{ ...headerStyle, textAlign: "center" }}>วันที่บันทึก</th>}
              {visibleColumns.time && <th style={{ ...headerStyle, textAlign: "center" }}>เวลาเบิก</th>}
              {visibleColumns.description && <th style={{ ...headerStyle, textAlign: "center" }}>รุ่นเครื่องมือ (DESCRIPTION)</th>}
              {visibleColumns.cabinet_no && <th style={{ ...headerStyle, textAlign: "center" }}>ช่องเก็บเครื่องมือ</th>}
              {visibleColumns.category && <th style={{ ...headerStyle, textAlign: "center" }}>หมวดหมู่</th>}
              {visibleColumns.brand && <th style={{ ...headerStyle, textAlign: "center" }}>ยี่ห้อ</th>}
              {visibleColumns.supplier && <th style={{ ...headerStyle, textAlign: "center" }}>ผู้จำหน่าย</th>}
              {visibleColumns.qty && <th style={{ ...headerStyle, textAlign: "center" }}>เบิก (ชิ้น)</th>}
              {visibleColumns.unit_price && <th style={{ ...headerStyle, textAlign: "center" }}>ราคาต่อหน่วย</th>}
              {visibleColumns.cost && <th style={{ ...headerStyle, textAlign: "center" }}>ค่าใช้จ่าย</th>}
              {visibleColumns.material_code && <th style={{ ...headerStyle, textAlign: "center" }}>รหัสวัสดุ</th>}
              {visibleColumns.work_order && <th style={{ ...headerStyle, textAlign: "center" }}>ใบสั่งซื้อสินค้า/งาน</th>}
            </tr>
          </thead>

          <tbody>
            {renderRowsWithSubtotals.length > 0 ? (
              renderRowsWithSubtotals.map((row, idx) => {
                if (row.type === "data") {
                  const item = row.data;
                  const { date, time } = formatThaiDate(item.pay_time);
                  const productCode = item.product_name ? item.product_name.split(" ")[0] : "N/A";
                  const displayLabel = item.cutter_type && item.cutter_type !== "0" ? String(item.cutter_type) : "TOOL/HOLDER";
                  const labelUpper = displayLabel.toUpperCase();

                  const isInsert = labelUpper.includes("INSERT");
                  const isDrill = labelUpper.includes("DRILL");
                  const isEndmill = labelUpper.includes("BLANK") || labelUpper.includes("ENDMILL") || labelUpper.includes("END MILL");
                  const isHolder = labelUpper.includes("HOLDER");

                  const finalWorkOrder = item.product_order && item.product_order !== "N/A" && item.product_order !== "null" ? item.product_order : (item.jobNo && item.jobNo !== "N/A" && item.jobNo !== "null" ? item.jobNo : "-");

                  return (
                    <tr
                      key={`data-${idx}`}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s ease" }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {visibleColumns.no && <td style={cellStyle}>{row.index + 1}</td>}
                      {visibleColumns.user_name && <td style={{ ...cellStyle, fontWeight: "600", color: "#1e293b", whiteSpace: "nowrap" }}>{item.user_name || "-"}</td>}
                      {visibleColumns.employee_id && <td style={{ ...cellStyle, fontFamily: "monospace", fontWeight: "600", color: "#475569" }}>{item.employee_id || "-"}</td>}
                      {visibleColumns.date && <td style={{ ...cellStyle, whiteSpace: "nowrap", fontWeight: "600", color: "#0f172a" }}>{date}</td>}
                      {visibleColumns.time && <td style={{ ...cellStyle, color: "#6366f1", fontWeight: "bold", fontFamily: "monospace", whiteSpace: "nowrap" }}>{time || "-"}</td>}
                      {visibleColumns.description && <td style={{ ...cellStyle, color: "#334155", lineHeight: "1.2", fontSize: "0.68rem", fontWeight: isGroupByItem ? "700" : "400" }}>{item.product_name || "-"}</td>}
                      {visibleColumns.cabinet_no && <td style={{ ...cellStyle, fontWeight: "700", fontFamily: "monospace" }}>{item.cabinet_no || item.box_no || item.cell_no || "-"}</td>}
                      {visibleColumns.category && (
                        <td style={cellStyle}>
                          <span style={{
                            padding: "2px 5px", borderRadius: "6px", fontSize: "0.6rem", fontWeight: "800", display: "inline-block", minWidth: "80px", textTransform: "uppercase",
                            background: isInsert ? "#d1fae5" : isDrill ? "#e0f2fe" : isEndmill ? "#fef3c7" : isHolder ? "#f3e8ff" : "#f1f5f9",
                            color: isInsert ? "#065f46" : isDrill ? "#0369a1" : isEndmill ? "#92400e" : isHolder ? "#6b21a8" : "#475569",
                            border: `1px solid ${isInsert ? "#a7f3d0" : isDrill ? "#bae6fd" : isEndmill ? "#fde68a" : isHolder ? "#e9d5ff" : "#e2e8f0"}`
                          }}>{displayLabel}</span>
                        </td>
                      )}
                      {visibleColumns.brand && <td style={{ ...cellStyle, fontWeight: "700", color: "#334155", fontSize: "0.65rem", textTransform: "uppercase" }}>{item.brand_name && item.brand_name !== "0" ? item.brand_name : "-"}</td>}
                      {visibleColumns.supplier && <td style={{ ...cellStyle, fontWeight: "700", color: "#475569", fontSize: "0.65rem", textTransform: "uppercase" }}>{item.specification && item.specification !== "0" && item.specification !== "-" ? item.specification : "-"}</td>}
                      {visibleColumns.qty && <td style={{ ...cellStyle, fontWeight: "800", color: "#2563eb", fontSize: "0.72rem" }}>{item.pay_num ?? 0}</td>}
                      {visibleColumns.unit_price && <td style={{ ...cellStyle, fontFamily: "monospace", fontWeight: "600", color: "#0f172a", fontSize: "0.68rem", whiteSpace: "nowrap" }}>{(item.unit_price ?? 0).toLocaleString("th-TH")} ฿</td>}
                      {visibleColumns.cost && <td style={{ ...cellStyle, fontFamily: "monospace", fontWeight: "800", color: "#e11d48", fontSize: "0.7rem", whiteSpace: "nowrap" }}>{((item.unit_price ?? 0) * (item.pay_num ?? 0)).toLocaleString("th-TH")} ฿</td>}
                      {visibleColumns.material_code && <td style={{ ...cellStyle, fontFamily: "monospace", fontWeight: "600", color: "#475569", fontSize: "0.65rem" }}>{productCode}</td>}
                      {visibleColumns.work_order && <td style={{ ...cellStyle, fontWeight: "800", color: "#2563eb", fontSize: "0.65rem" }}>{finalWorkOrder}</td>}
                    </tr>
                  );
                } 
                
                // 📝 🚩 🏁 ท่อนแทรกแถวสีเหลือง ไฮไลท์สรุปยอดขั้นบันได (Subtotal Breakdown) แยกตามรุ่นไอเทมสินค้าตรงความต้องการเป๊ะ!
                else if (row.type === "subtotal") {
                  return (
                    <tr key={`sub-${idx}`} style={{ backgroundColor: "#fef08a", borderBottom: "2px solid #eab308", fontWeight: "bold" }}>
                      {visibleColumns.no && <td style={{ ...cellStyle, color: "#a16207" }}>-</td>}
                      
                      {/* ยิงคอลัมน์ซ้ายยาว เพื่ออธิบายรุ่นของเครื่องมือกลุ่มนั้น */}
                      {visibleColumns.user_name ? (
                        <td colSpan={visibleColumns.employee_id ? 5 : 4} style={{ ...cellStyle, color: "#854d0e", fontWeight: "900", textAlign: "left", paddingLeft: "20px" }}>
                          🗂️ สรุปยอดรวมรุ่น: {row.itemName}
                        </td>
                      ) : (
                        <>
                          {visibleColumns.employee_id && <td style={cellStyle}>-</td>}
                          {visibleColumns.date && <td style={cellStyle}>-</td>}
                          {visibleColumns.time && <td style={cellStyle}>-</td>}
                          {visibleColumns.description && <td style={{ ...cellStyle, color: "#854d0e", fontWeight: "900", textAlign: "left" }}>🗂️ สรุปรวมรุ่น: {row.itemName}</td>}
                        </>
                      )}

                      {/* เคลียร์ช่องว่างระหว่างทาง */}
                      {visibleColumns.cabinet_no && <td style={cellStyle}>-</td>}
                      {visibleColumns.category && <td style={cellStyle}>-</td>}
                      {visibleColumns.brand && <td style={cellStyle}>-</td>}
                      {visibleColumns.supplier && <td style={cellStyle}>-</td>}
                      
                      {/* 🔵 แสดงผลรวมจำนวนชิ้นเฉพาะไอเทมรุ่นนี้ */}
                      {visibleColumns.qty && (
                        <td style={{ ...cellStyle, color: "#1e3a8a", fontSize: "0.75rem", fontWeight: "900", background: "#fde047" }}>
                          {row.qtySum.toLocaleString()}
                        </td>
                      )}
                      
                      {visibleColumns.unit_price && <td style={cellStyle}>-</td>}
                      
                      {/* 🔴 แสดงผลรวมค่าใช้จ่ายเฉพาะไอเทมรุ่นนี้ */}
                      {visibleColumns.cost && (
                        <td style={{ ...cellStyle, color: "#b91c1c", fontSize: "0.75rem", fontWeight: "900", background: "#fde047", whiteSpace: "nowrap" }}>
                          {row.costSum.toLocaleString("th-TH")} ฿
                        </td>
                      )}
                      
                      {visibleColumns.material_code && <td style={cellStyle}>-</td>}
                      {visibleColumns.work_order && <td style={cellStyle}>-</td>}
                    </tr>
                  );
                }
                return null;
              })
            ) : (
              <tr><td colSpan={activeColumnsCount} style={{ padding: "80px", color: "#94a3b8" }}>ไม่พบข้อมูลในช่วงเวลาที่เลือก</td></tr>
            )}
          </tbody>

          {/* สรุปยอด Grand Total สุทธิรวมท้ายกระดาษตาราง */}
          {records.length > 0 && (
            <tfoot>
              <tr style={{ background: "#e2e8f0", borderTop: "2.5px double #94a3b8", fontWeight: "bold" }}>
                {visibleColumns.no && <td style={{ ...cellStyle, color: "#64748b" }}>-</td>}
                {visibleColumns.user_name && <td style={{ ...cellStyle, color: "#1e293b", fontWeight: "900" }}>GRAND TOTAL</td>}
                {visibleColumns.employee_id && <td style={cellStyle}>-</td>}
                {visibleColumns.date && <td style={cellStyle}>-</td>}
                {visibleColumns.time && <td style={cellStyle}>-</td>}
                {visibleColumns.description && <td style={cellStyle}>-</td>}
                {visibleColumns.cabinet_no && <td style={cellStyle}>-</td>}
                {visibleColumns.category && <td style={cellStyle}>-</td>}
                {visibleColumns.brand && <td style={cellStyle}>-</td>}
                {visibleColumns.supplier && <td style={cellStyle}>-</td>}
                
                {visibleColumns.qty && (
                  <td style={{ ...cellStyle, color: "#1e3a8a", fontSize: "0.8rem", fontWeight: "900", background: "#cbd5e1" }}>
                    {totalQtySum.toLocaleString()}
                  </td>
                )}
                
                {visibleColumns.unit_price && <td style={cellStyle}>-</td>}
                
                {visibleColumns.cost && (
                  <td style={{ ...cellStyle, color: "#b91c1c", fontSize: "0.8rem", fontWeight: "900", background: "#cbd5e1", whiteSpace: "nowrap" }}>
                    {totalCostSum.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
                  </td>
                )}
                
                {visibleColumns.material_code && <td style={cellStyle}>-</td>}
                {visibleColumns.work_order && <td style={cellStyle}>-</td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const headerStyle = { padding: "6px 8px", color: "#64748b", fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.01em", whiteSpace: "nowrap" };
const cellStyle = { padding: "4px 6px", fontSize: "0.68rem", verticalAlign: "middle", textAlign: "center" };

export default ReportTable;