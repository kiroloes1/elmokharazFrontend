import React from 'react';
import { 
  FaFacebook, 
  FaInstagram, 
  FaWhatsapp,
  FaPhone, 
  FaMapMarkerAlt,
  FaShieldAlt,
  FaUserAlt 
} from "react-icons/fa";
import { useSystemSettings } from '../context/shareInfo';

function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSystemSettings();

  return (
    <footer className="no-print mt-auto w-full bg-dark text-ligth py-12 sm:py-16 border-t-2 border-brown/30 relative overflow-hidden" dir="rtl">
      
      {/* لمسات ديكورية خلفية متناسقة مع درجات البني والبيج الفاتح */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-brown/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brwonLight/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* القسم العلوي: الهوية وإصدار النظام */}
        <div className="flex flex-col sm:flex-row justify-between items-center pb-8 mb-10 border-b border-brown/10 gap-6 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-ligth font-extrabold text-lg sm:text-xl tracking-wide">
                {settings?.factoryName || "المصنع"}
              </h3>
              <p className="text-ligth/60 text-xs mt-1">للصناعات البلاستيكية</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-brown/10 rounded-full border border-brown/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brown opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brown"></span>
            </span>
            <p className="text-ligth/90 text-xs sm:text-sm font-semibold">
              نظام الإدارة الذكي v2.0
            </p>
          </div>
        </div>

        {/* شبكة كروت التواصل - تصميم عصري بحدود ناعمة وتأثير Hover هادئ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* كارت: المدير العام */}
          <div className="group bg-brown/5 p-5 rounded-2xl border border-brown/10 hover:border-brown/40 hover:bg-brown/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-brown text-dark p-3 rounded-xl transition-colors duration-300 group-hover:bg-brwonLight">
                <FaUserAlt size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-ligth/40 uppercase mb-1">المدير العام</p>
                <span className="text-ligth text-sm font-bold block truncate">عاطف عطيه</span>
              </div>
            </div>
          </div>

          {/* كارت: رقم التواصل */}
          <div className="group bg-brown/5 p-5 rounded-2xl border border-brown/10 hover:border-brown/40 hover:bg-brown/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-brown text-dark p-3 rounded-xl transition-colors duration-300 group-hover:bg-brwonLight">
                <FaPhone size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-ligth/40 uppercase mb-1">رقم التواصل</p>
                <a href="tel:01221906548" className="text-ligth text-sm font-bold block tracking-wider hover:text-brown transition-colors">
                  01221844356
                </a>
              </div>
            </div>
          </div>

          {/* كارت: الموقع */}
          <div className="group bg-brown/5 p-5 rounded-2xl border border-brown/10 hover:border-brown/40 hover:bg-brown/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-brown text-dark p-3 rounded-xl transition-colors duration-300 group-hover:bg-brwonLight">
                <FaMapMarkerAlt size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-ligth/40 uppercase mb-1">الموقع</p>
                <span className="text-ligth text-sm font-bold block">أسيوط - المدينة الصناعية</span>
              </div>
            </div>
          </div>

          {/* كارت: أمن النظام */}
          <div className="group bg-brown/5 p-5 rounded-2xl border border-brown/10 hover:border-brown/40 hover:bg-brown/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-brown text-dark p-3 rounded-xl transition-colors duration-300 group-hover:bg-brwonLight">
                <FaShieldAlt size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-ligth/40 uppercase mb-1">أمن النظام</p>
                <span className="text-ligth text-[11px] font-bold block leading-tight">اتصال مشفر وآمن</span>
              </div>
            </div>
          </div>
        </div>

        {/* القسم السفلي: الحقوق، السوشيال ميديا، والمطور */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-brown/10 gap-6">
          
          {/* أيقونات التواصل الاجتماعي */}
          <div className="flex gap-5 text-ligth/60">
            <FaFacebook className="hover:text-brown cursor-pointer transition-colors duration-300" size={20} />
            <a href="https://wa.me/201221906548" target="_blank" rel="noreferrer">
              <FaWhatsapp className="hover:text-brown cursor-pointer transition-colors duration-300" size={20} />
            </a>
            <FaInstagram className="hover:text-brown cursor-pointer transition-colors duration-300" size={20} />
          </div>
          
          {/* حقوق النشر */}
          <p className="text-ligth/50 text-xs sm:text-sm font-medium order-first md:order-none text-center">
            © {currentYear} جميع الحقوق محفوظة لـ <span className="text-brown font-bold">{settings?.factoryName || "المصنع"}</span>
          </p>

          {/* بيانات المبرمج */}
          <div className="flex flex-col items-center md:items-end gap-0.5">
            <div className="text-[10px] text-ligth/40 font-bold tracking-[1.5px] uppercase">
              Developed by <span className="text-brown font-extrabold">Kiroloes Reda</span>
            </div>
            <div className="text-[9px] text-ligth/30 font-semibold tracking-wider">01270857659</div>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;