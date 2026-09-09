import React from "react";
import { Link } from "react-router-dom";
import { Coffee, MapPin, Clock, Phone, LayoutDashboard, ShieldCheck, Heart } from "lucide-react";

export default function CustomerFooter({ footerData }) {
  const brandName = footerData?.brandName || "Coffee 404";
  const location = footerData?.location || "إيتاي البارود - البحيرة (بجوار المحطة)";
  const hours = footerData?.hours || "يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل";
  const phone = footerData?.phone || "0100 000 0404";

  return (
    <footer className="customer-page-footer">
      <div className="footer-content-inner">
        {/* Desktop Columns Grid */}
        <div className="footer-grid-wrapper">
          {/* Col 1: Brand & Bio */}
          <div className="footer-col brand-col">
            <div className="footer-brand-title">
              <div className="footer-logo-badge">
                <Coffee size={20} className="footer-coffee-icon" />
              </div>
              <div className="footer-brand-name-group">
                <span className="brand-primary-name">{brandName}</span>
                <span className="brand-tagline">مذاق القهوة المختصة بأعلى معايير الجودة</span>
              </div>
            </div>
            <p className="footer-brand-description">
              نقدم لكم تجربة قهوة استثنائية مع تشكيلة واسعة من المشروبات الساخنة والباردة والحلويات الطازجة المحضرة يومياً بكل حب وإتقان.
            </p>
          </div>

          {/* Col 2: Info & Hours */}
          <div className="footer-col info-col">
            <h4 className="footer-col-heading">معلومات والتواصل</h4>
            <div className="footer-meta-info">
              <p className="footer-meta-item">
                <MapPin size={16} className="meta-icon" />
                <span>{location}</span>
              </p>
              <p className="footer-meta-item">
                <Clock size={16} className="meta-icon" />
                <span>{hours}</span>
              </p>
              <p className="footer-meta-item">
                <Phone size={16} className="meta-icon" />
                <span>خدمة العملاء: {phone}</span>
              </p>
            </div>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="footer-col nav-col">
            <h4 className="footer-col-heading">روابط سريعة</h4>
            <ul className="footer-nav-list">
              <li>
                <a href="#categories-section-anchor" className="footer-nav-link">قائمة المينيو</a>
              </li>
              <li>
                <a href="#offers-section-anchor" className="footer-nav-link">العروض المميزة</a>
              </li>
              <li>
                <Link to="/admin/dashboard" className="footer-nav-link admin-highlight">
                  <LayoutDashboard size={14} />
                  <span>لوحة تحكم الأدمن</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            جميع الحقوق محفوظة © {new Date().getFullYear()} كافيه 404 COFFEE. صنع بـ <Heart size={13} className="heart-icon" /> لخدمتكم.
          </p>
          <div className="footer-quick-links">
            <a href="#contact" className="footer-link-item">اتصل بنا</a>
            <span className="footer-link-dot">•</span>
            <a href="#terms" className="footer-link-item">الشروط والأحكام</a>
            <span className="footer-link-dot">•</span>
            <a href="#privacy" className="footer-link-item">سياسة الخصوصية</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

