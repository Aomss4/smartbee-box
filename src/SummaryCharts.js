import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area 
} from 'recharts';

const SummaryCharts = ({ data }) => {
  
  // --- 1. เตรียมข้อมูลรายวัน/รายสัปดาห์ (Line Chart) ---
  const dailyData = data.reduce((acc, curr) => {
    const date = new Date(curr.pay_time).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
    if (!acc[date]) acc[date] = { date, total: 0 };
    acc[date].total += curr.actualTotalPcs;
    return acc;
  }, {});
  const lineChartData = Object.values(dailyData).reverse(); // เรียงจากวันที่น้อยไปมาก

  // --- 2. เตรียมข้อมูลรายคน (Bar Chart) ---
  const staffData = data.reduce((acc, curr) => {
    const name = curr.user_name;
    if (!acc[name]) acc[name] = { name, total: 0 };
    acc[name].total += curr.actualTotalPcs;
    return acc;
  }, {});
  const barChartData = Object.values(staffData).sort((a, b) => b.total - a.total).slice(0, 5);

  // --- 3. เตรียมข้อมูลหมวดหมู่ (Pie Chart) ---
  const categorySummary = data.reduce((acc, curr) => {
    const cat = curr.type_name || "อื่นๆ";
    if (!acc[cat]) acc[cat] = { name: cat, value: 0 };
    acc[cat].value += curr.actualTotalPcs;
    return acc;
  }, {});
  const pieChartData = Object.values(categorySummary);

  const COLORS = ['#003366', '#fbbf24', '#10b981', '#6366f1', '#f43f5e'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. กราฟเส้นแสดงแนวโน้มรายวัน (เต็มความกว้าง) */}
      <div style={chartBoxFullStyle}>
        <h3 style={titleStyle}>แนวโน้มการเบิกรายวัน (Trend)</h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <AreaChart data={lineChartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003366" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#003366" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="#003366" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* 2. กราฟแท่งรายคน */}
        <div style={chartBoxStyle}>
          <h3 style={titleStyle}>Top 5 พนักงานเบิกสูงสุด</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} barSize={35}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#003366' : '#fbbf24'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. กราฟวงกลมหมวดหมู่ */}
        <div style={chartBoxStyle}>
          <h3 style={titleStyle}>สัดส่วนหมวดหมู่ (%)</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieChartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

const chartBoxStyle = { background: '#fff', padding: '25px', borderRadius: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };
const chartBoxFullStyle = { ...chartBoxStyle, width: 'auto' };
const titleStyle = { color: '#003366', fontWeight: '900', marginBottom: '20px', fontSize: '1rem' };
const tooltipStyle = { borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' };

export default SummaryCharts;