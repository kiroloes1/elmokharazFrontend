import React from "react";
import { useNavigate } from "react-router-dom";
import { Cog, PackagePlus, Wrench, Cable, ShoppingBag, ArrowLeft } from "lucide-react";
import { useSystemSettings } from "../../context/shareInfo";

const PurchasesHub = () => {
  const navigate = useNavigate();
  const { settings } = useSystemSettings() || {};

  const theme = settings?.theme || {
    primary: "#0A2947",
    secondary: "#8B5E3C",
    accent: "#8B5E3C",
    background: "#F3E4C9",
  };

  const SECTIONS = [
    {
      key: "equipment",
      title: "المعدات",
      subtitle: "إدارة وشراء المعدات",
      path: "/equipment",
      icon: Cog,
      accent: theme.primary,
    },
    {
      key: "equipmentSupply",
      title: "مستلزمات المعدات",
      subtitle: "توريدات وقطع غيار",
      path: "/equipmentSupply",
      icon: PackagePlus,
      accent: theme.secondary,
    },
    {
      key: "maintenance",
      title: "الصيانة",
      subtitle: "متابعة أعمال الصيانة",
      path: "/Maintenance",
      icon: Wrench,
      accent: theme.accent,
    },
    // {
    //   key: "wire",
    //   title: "الأسلاك",
    //   subtitle: "مشتريات الأسلاك بالأنواع",
    //   path: "/wire",
    //   icon: Cable,
    //   accent: theme.secondary,
    // },
    // {
    //   key: "bag",
    //   title: "الشكاير",
    //   subtitle: "مشتريات الشكاير بالأنواع",
    //   path: "/bag",
    //   icon: ShoppingBag,
    //   accent: theme.primary,
    // },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full px-6 py-10 md:px-12 transition-colors duration-300"
      style={{ background: theme.background }}
    >
      <style>{`
  
        .ph-title { 
          
          letter-spacing: 0.02em; 
        }
        
        .card-fill-hover {
          position: relative;
          background: white;
          border-radius: 20px;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          z-index: 1;
        }

        /* الطبقة التي تتوسع من اليمين للشمال */
        .card-fill-hover::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          left: 0;
          background-color: var(--accent-color);
          transform: scaleX(0);
          transform-origin: right; /* البداية من جهة اليمين */
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
        }

        .card-fill-hover:hover::before {
          transform: scaleX(1);
        }

        .icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        /* تحول الألوان عند الـ Hover لضمان الوضوح والقراءة */
        .card-fill-hover:hover .card-title,
        .card-fill-hover:hover .card-subtitle {
          color: #ffffff !important;
          opacity: 1 !important;
        }

        .card-fill-hover:hover .icon-wrapper {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }

        .card-fill-hover:hover .card-badge {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }

        .card-fill-hover:hover .open-text,
        .card-fill-hover:hover .arrow-icon {
          color: #ffffff !important;
        }

        .arrow-icon {
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateX(8px);
        }

        .card-fill-hover:hover .arrow-icon {
          opacity: 1;
          transform: translateX(0);
        }

        .card-content {
          padding: 24px 24px 20px;
        }

        .card-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          opacity: 0.8;
          transition: all 0.3s ease;
        }
      `}</style>

      {/* Header */}
      <div className="mb-10">
        <p
          className="ph-title text-sm font-semibold tracking-widest mb-2"
          style={{ color: theme.secondary }}
        >
          لوحة الأقسام
        </p>
        <h1 className="ph-title text-3xl md:text-4xl font-bold" style={{ color: theme.primary }}>
          إدارة المخزون والمعدات
        </h1>
        <p className="mt-2 text-sm opacity-60" style={{ color: theme.primary }}>
          اختر القسم الذي ترغب في إدارته
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.key}
              role="button"
              tabIndex={0}
              onClick={() => navigate(section.path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(section.path);
              }}
              className="card-fill-hover"
              style={{
                '--accent-color': section.accent,
              }}
            >
              {/* Colored top bar */}
              <div
                style={{
                  height: '4px',
                  background: `linear-gradient(90deg, ${section.accent}, ${section.accent}CC)`,
                }}
              />

              <div className="card-content">
                {/* Icon */}
                <div
                  className="icon-wrapper mb-4"
                  style={{
                    background: `${section.accent}15`,
                    color: section.accent,
                  }}
                >
                  <Icon size={26} strokeWidth={2} />
                </div>

                {/* Title */}
                <h3
                  className="ph-title card-title text-lg font-semibold mb-1 transition-colors duration-300"
                  style={{ color: theme.primary }}
                >
                  {section.title}
                </h3>

                {/* Subtitle */}
                <p 
                  className="card-subtitle text-sm opacity-60 mb-3 transition-colors duration-300" 
                  style={{ color: theme.primary }}
                >
                  {section.subtitle}
                </p>

                {/* Badge */}
                <span
                  className="card-badge"
                  style={{
                    background: `${section.accent}12`,
                    color: section.accent,
                  }}
                >
                  {section.key === "equipment" && "معدات"}
                  {section.key === "equipmentSupply" && "توريدات"}
                  {section.key === "maintenance" && "صيانة"}
                  {section.key === "wire" && "أسلاك"}
                  {section.key === "bag" && "شكاير"}
                </span>

                {/* Arrow indicator */}
                <div className="mt-4 flex items-center justify-between">
                  <span 
                    className="open-text text-sm font-medium transition-colors duration-300" 
                    style={{ color: section.accent }}
                  >
                    فتح القسم
                  </span>
                  <ArrowLeft size={18} className="arrow-icon" style={{ color: section.accent }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchasesHub;