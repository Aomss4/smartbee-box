const express = require('express');
const axios = require('axios');
const cors = require('cors'); // ตัวช่วยอนุญาตให้ React ของเราคุยกับ Backend นี้ได้
const app = express();

app.use(cors()); // อนุญาตให้ทุกโดเมนเข้าถึง (หรือระบุเฉพาะ Vercel ของคุณก็ได้)
app.use(express.json());

const CHINA_API_URL = 'https://apict.zhinenggui.cc/plat/cutterApi/searchAllBorrowTime';

// สร้าง Route มารองรับคำสั่งจาก React
app.post('/api/proxy-records', async (req, res) => {
  try {
    // รับค่าจาก React แล้วส่งต่อไปที่ API จีน
    const response = await axios.post(CHINA_API_URL, null, {
      params: req.query // ส่ง token, date, page ต่อไป
    });
    res.json(response.data); // ส่งข้อมูลกลับไปให้ React
  } catch (error) {
    res.status(500).json({ error: 'Proxy Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));