import axios from 'axios';

// 1. กำหนดค่า URL ของ API ภายนอก
// ถ้าในอนาคตคุณสร้าง Backend ของตัวเอง ให้เปลี่ยน URL ตรงนี้
const BASE_URL = 'https://apict.zhinenggui.cc/plat/cutterApi/searchAllBorrowTime';

export const fetchBorrowingRecords = async (token, startDate, endDate, page) => {
  try {
    const response = await axios.post(BASE_URL, null, {
      params: {
        token: token,
        star_str: startDate,
        end_str: endDate,
        page: page
      }
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    // เพิ่มการเช็ค Error ให้ละเอียดขึ้นเพื่อให้คุณแก้ปัญหาบนเว็บได้ง่ายขึ้น
    if (error.response) {
        console.error("Data:", error.response.data);
    }
    return null;
  }
};