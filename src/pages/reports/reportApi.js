import api from "../../services/api";

const DEFAULT_BASE_URL = '/reports';

export async function fetchReport(endpoint, params = {}, baseUrl = DEFAULT_BASE_URL) {
  // تنظيف الباراميترز من القيم الفارغة أو غير المعرفة
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  try {
    // بناء المسار المكتمل في حال تغيير الـ baseUrl
    const url = `${baseUrl}/${endpoint.replace(/^\//, '')}`;

    const response = await api.get(url, {
      params: cleanParams,
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status || 'شبكة';
    const message = error.response?.data?.message || error.message || '';
    throw new Error(`فشل تحميل التقرير (${status}): ${message}`);
  }
}