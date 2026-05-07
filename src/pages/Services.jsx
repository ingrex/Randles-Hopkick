import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HireStaffButton from "../components/buttons/HireStaffButton";

// ─── CSS SCOPE HELPER ─────────────────────────────────────────────────────────
const scopeCSS = (css, scope) =>
  css.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*\{)/g, (match, selector, suffix) => {
    const s = selector.trim();
    if (
      s.startsWith("@") ||
      s.startsWith(scope) ||
      s === "from" ||
      s === "to" ||
      /^\d+%/.test(s) ||
      s.startsWith(":root") ||
      s.startsWith("html") ||
      s.startsWith("*")
    ) {
      return match;
    }
    return `${scope} ${s}${suffix}`;
  });

// ─── RAW STYLES (scoped to .svc) ─────────────────────────────────────────────
const RAW_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');

  /* ── Keyframes (global — safe, no element targeting) ── */
  @keyframes svc-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes svc-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes svc-scaleIn {
    from { opacity: 0; transform: scale(0.94) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes svc-pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.55; transform: scale(0.75); }
  }
  @keyframes svc-slide-bar {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes svc-glow-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(14,165,233,0); }
    50%       { box-shadow: 0 0 28px 6px rgba(14,165,233,0.18); }
  }
  @keyframes svc-hero-badge-in {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes svc-hero-title-in {
    from { opacity: 0; transform: translateY(30px) skewY(1deg); }
    to   { opacity: 1; transform: translateY(0) skewY(0deg); }
  }
  @keyframes svc-hero-sub-in {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes svc-hero-btns-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes svc-stat-count-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes svc-reveal-left {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes svc-line-grow {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes svc-top-bar-in {
    from { opacity: 0; transform: scaleX(0); transform-origin: left; }
    to   { opacity: 1; transform: scaleX(1); transform-origin: left; }
  }
  @keyframes svc-modal-backdrop {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── CSS Variables scoped to .svc ── */
  .svc {
    --sky: #0EA5E9;
    --sky-light: #38BDF8;
    --sky-dark: #0284C7;
    --sky-glass: rgba(14,165,233,0.13);
    --sky-border: rgba(14,165,233,0.35);
    --bg: #07080F;
    --surface: #0D0E18;
    --card: #131421;
    --border: #1E2035;
    --border-light: #2A2C45;
    --text-primary: #F2EDE3;
    --text-secondary: #8A8BA8;
    --text-muted: #4E4F6A;
    background: var(--bg);
    color: var(--text-primary);
    min-height: 100vh;
    box-sizing: border-box;
  }

  .svc *, .svc *::before, .svc *::after {
    box-sizing: border-box;
  }

  .svc ::-webkit-scrollbar { width: 5px; }
  .svc ::-webkit-scrollbar-track { background: var(--surface); }
  .svc ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 3px; }

  /* ── HERO ── */
  .hero {
    position: relative;
    padding-top: 80px;
    height: calc(100vh - 90px);
    margin-top: -70px;
    min-height: 700px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    transition: opacity 0.9s ease;
  }
  .hero-img--visible { opacity: 1; }
  .hero-img--hidden  { opacity: 0; }
  .hero-overlay-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(7,8,15,0.5) 0%, rgba(7,8,15,0.68) 55%, rgba(7,8,15,0.97) 100%);
    z-index: 1;
  }
  .hero-overlay-radial {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 50% at 50% 40%, rgba(14,165,233,0.07) 0%, transparent 65%);
    z-index: 1;
  }
  .hero-dots {
    position: absolute;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 3;
  }
  .hero-dot {
    height: 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.35s ease;
    background: var(--border-light);
    width: 8px;
  }
  .hero-dot--active {
    width: 26px;
    background: var(--sky);
  }
  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 24px;
    max-width: 820px;
    width: 100%;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(14,165,233,0.12);
    backdrop-filter: blur(10px);
    border: 1px solid var(--sky-border);
    border-radius: 20px;
    padding: 6px 18px;
    margin-bottom: 28px;
    animation: svc-hero-badge-in 0.7s cubic-bezier(0.22,0.68,0,1.2) both;
    animation-delay: 0.1s;
  }
  .hero-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sky);
    animation: svc-pulse-dot 2.2s ease-in-out infinite;
  }
  .hero-badge-text {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--sky-light);
    font-family: 'Jost', sans-serif;
  }
  .hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(46px, 8vw, 96px);
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.0;
    margin-bottom: 20px;
    animation: svc-hero-title-in 0.8s cubic-bezier(0.22,0.68,0,1.1) both;
    animation-delay: 0.25s;
  }
  .hero-title-accent { color: var(--sky); }
  .hero-subtitle {
    font-size: clamp(15px, 1.8vw, 18px);
    line-height: 1.75;
    color: rgba(242,237,227,0.68);
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    margin: 0 auto 48px;
    max-width: 560px;
    animation: svc-hero-sub-in 0.8s cubic-bezier(0.22,0.68,0,1.1) both;
    animation-delay: 0.4s;
  }
  .hero-buttons {
    display: flex;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
    animation: svc-hero-btns-in 0.8s cubic-bezier(0.22,0.68,0,1.1) both;
    animation-delay: 0.55s;
  }
  .hero-btn {
    padding: 8px 20px;
    border-radius: 40px;
    background: var(--sky-glass);
    backdrop-filter: blur(14px);
    border: 1px solid var(--sky-border);
    color: #fff;
    font-size: 11px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    font-family: 'Jost', sans-serif;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.26s ease, transform 0.26s ease, box-shadow 0.26s ease, border-color 0.26s ease;
  }
  .hero-btn:hover {
    background: rgba(14,165,233,0.3);
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(14,165,233,0.18);
    border-color: rgba(56,189,248,0.55);
  }

  /* ── STATS STRIP ── */
  .stats-strip {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .stats-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  /* ── STATS MOBILE FIX ── */
  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .stat-cell {
      border-right: none !important;
      border-bottom: 1px solid var(--border);
      padding: 24px 20px !important;
    }
    .stat-cell:last-child {
      border-bottom: none;
    }
    .stat-cell--first::before {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 44px;
      height: 3px;
      top: 0;
    }
  }

  .stat-cell {
    padding: 38px 40px;
    position: relative;
    border-right: 1px solid var(--border);
    animation: svc-stat-count-in 0.6s ease both;
  }
  .stat-cell:last-child { border-right: none; }
  .stat-cell--first::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 44px;
    background: var(--sky);
    border-radius: 0 2px 2px 0;
    animation: svc-slide-bar 0.6s cubic-bezier(0.22,0.68,0,1.2) both;
    animation-delay: 0.3s;
  }
  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 6px;
  }
  .stat-label {
    font-size: 13px;
    font-family: 'Jost', sans-serif;
    font-weight: 500;
    color: var(--sky);
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .stat-sub {
    font-size: 12px;
    font-family: 'Jost', sans-serif;
    color: var(--text-muted);
  }

  /* ── SERVICE SECTION ── */
  .service-section {
    padding-top: 80px;
    padding-bottom: 60px;
    border-bottom: 1px solid rgba(14,165,233,0.12);
    position: relative;
    background:
      radial-gradient(ellipse 70% 50% at 15% 20%, rgba(14,165,233,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 55% 40% at 85% 75%, rgba(56,189,248,0.05) 0%, transparent 55%),
      linear-gradient(160deg, rgba(2,132,199,0.08) 0%, rgba(7,8,15,0) 45%),
      #080C14;
  }
  .service-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(14,165,233,0.06) 1px, transparent 1px);
    background-size: 36px 36px;
    pointer-events: none;
    z-index: 0;
    opacity: 0.6;
  }
  .service-section::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.5) 30%, rgba(56,189,248,0.7) 50%, rgba(14,165,233,0.5) 70%, transparent 100%);
  }
  .section-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    position: relative;
    z-index: 1;
  }

  /* ── CATEGORY HEADER ── */
  .cat-header {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    background: linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(13,14,24,0.92) 55%, rgba(7,8,15,0.96) 100%);
    border: 1px solid rgba(14,165,233,0.22);
    border-radius: 18px;
    overflow: hidden;
    margin-bottom: 48px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 32px rgba(14,165,233,0.08), inset 0 1px 0 rgba(56,189,248,0.1);
  }
  .cat-header:hover {
    border-color: rgba(14,165,233,0.42);
    box-shadow: 0 16px 48px rgba(14,165,233,0.14), inset 0 1px 0 rgba(56,189,248,0.15);
  }
  .cat-header-img-wrap {
    position: relative;
    flex-shrink: 0;
    width: 220px;
    min-height: 180px;
    overflow: hidden;
  }
  .cat-header-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s ease;
  }
  .cat-header:hover .cat-header-img { transform: scale(1.06); }
  .cat-header-img-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 40%, rgba(4,8,20,0.88) 100%), linear-gradient(to top, rgba(2,10,28,0.6) 0%, transparent 70%);
  }
  .cat-header-img-tint {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(14,165,233,0.07), transparent 60%);
  }
  .cat-header-body {
    padding: 30px 32px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }

  /* ── CATEGORY HEADER MOBILE ── */
  @media (max-width: 640px) {
    .cat-header {
      flex-direction: column;
    }
    .cat-header-img-wrap {
      width: 100%;
      height: 200px;
      min-height: unset;
      flex-shrink: 0;
    }
    .cat-header-img-fade {
      background: linear-gradient(to bottom, transparent 40%, rgba(4,8,20,0.88) 100%), linear-gradient(to top, rgba(2,10,28,0.6) 0%, transparent 70%);
    }
    .cat-header-body {
      padding: 22px 20px 26px;
    }
  }
  .cat-eyebrow {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--sky);
    font-family: 'Jost', sans-serif;
  }
  .cat-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(22px, 2.8vw, 34px);
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.15;
  }
  .cat-desc {
    font-size: 14px;
    line-height: 1.75;
    color: var(--text-secondary);
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    max-width: 540px;
  }
  .cat-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .cat-meta-line {
    width: 24px;
    height: 2px;
    background: var(--sky);
    border-radius: 1px;
  }
  .cat-meta-text {
    font-size: 11px;
    color: var(--text-muted);
    font-family: 'Jost', sans-serif;
    letter-spacing: 0.05em;
  }

  /* ── SUBCATEGORY ── */
  .subcategory { margin-bottom: 52px; }
  .sub-label-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 22px;
    animation: svc-reveal-left 0.5s ease both;
  }
  .sub-label {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(56,189,248,0.7);
    font-family: 'Jost', sans-serif;
    white-space: nowrap;
  }
  .sub-rule {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(14,165,233,0.35) 0%, rgba(14,165,233,0.06) 100%);
    transform-origin: left;
    animation: svc-line-grow 0.6s ease both;
    animation-delay: 0.15s;
  }

  /* ── ROLE CARDS GRID ── */
  .roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 16px;
  }

  /* ── ROLE CARD ── */
  .role-card {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    height: 270px;
    cursor: pointer;
    border: 1px solid rgba(14,165,233,0.15);
    transition: transform 0.32s ease, box-shadow 0.32s ease, border-color 0.32s ease;
    animation: svc-fadeUp 0.5s ease both;
  }
  .role-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 28px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.22);
    border-color: rgba(14,165,233,0.45);
  }
  .role-card-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.55s ease;
  }
  .role-card:hover .role-card-bg { transform: scale(1.08); }
  .role-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(4,5,12,0.96) 0%, rgba(4,5,12,0.55) 52%, rgba(4,5,12,0.18) 100%);
    transition: background 0.32s ease;
  }
  .role-card:hover .role-card-overlay {
    background: linear-gradient(to top, rgba(4,5,12,0.97) 0%, rgba(4,5,12,0.72) 50%, rgba(4,5,12,0.3) 100%);
  }
  .role-card-top-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--sky), var(--sky-light));
    opacity: 0;
    transition: opacity 0.3s ease;
    transform-origin: left;
  }
  .role-card:hover .role-card-top-bar {
    opacity: 1;
    animation: svc-top-bar-in 0.4s ease both;
  }
  .role-card-content {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 20px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transform: translateY(6px);
    transition: transform 0.32s ease;
  }
  .role-card:hover .role-card-content { transform: translateY(0); }
  .role-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 19px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
  }
  .role-card-brief {
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--text-secondary);
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    transition: color 0.3s ease;
  }
  .role-card:hover .role-card-brief { color: rgba(242,237,227,0.75); }
  .role-learn-btn {
    margin-top: 4px;
    align-self: flex-start;
    padding: 7px 18px;
    border-radius: 30px;
    background: var(--sky-glass);
    backdrop-filter: blur(10px);
    border: 1px solid var(--sky-border);
    color: var(--sky-light);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Jost', sans-serif;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
    opacity: 0;
    transform: translateY(6px);
  }
  .role-card:hover .role-learn-btn {
    opacity: 1;
    transform: translateY(0);
    transition: background 0.2s ease, color 0.2s ease, transform 0.3s ease 0.05s, opacity 0.3s ease 0.05s;
  }
  .role-learn-btn:hover {
    background: rgba(14,165,233,0.3);
    color: #fff;
    transform: translateY(-2px) !important;
  }

  /* ── MODAL ── */
  .svc-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(4,5,12,0.88);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: svc-modal-backdrop 0.25s ease both;
  }
  .modal-panel {
    background: var(--surface);
    border: 1px solid var(--border-light);
    border-radius: 20px;
    max-width: 540px;
    width: 100%;
    overflow: hidden;
    box-shadow: 0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(14,165,233,0.1);
    animation: svc-scaleIn 0.3s cubic-bezier(0.22,0.68,0,1.2) both;
  }
  .modal-img-wrap {
    position: relative;
    height: 210px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .modal-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s ease;
  }
  .modal-panel:hover .modal-img { transform: scale(1.04); }
  .modal-img-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(13,14,24,1) 0%, rgba(13,14,24,0.25) 60%, transparent 100%);
  }
  .modal-close-btn {
    position: absolute;
    top: 14px; right: 14px;
    width: 34px; height: 34px;
    border-radius: 50%;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    border: 1px solid var(--border-light);
    color: var(--text-secondary);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }
  .modal-close-btn:hover {
    background: rgba(14,165,233,0.2);
    color: #fff;
    transform: rotate(90deg);
  }
  .modal-body {
    padding: 26px 32px 32px;
  }
  .modal-accent-bar {
    width: 30px;
    height: 3px;
    background: var(--sky);
    border-radius: 2px;
    margin-bottom: 14px;
    animation: svc-slide-bar 0.5s cubic-bezier(0.22,0.68,0,1.2) both;
    animation-delay: 0.2s;
  }
  .modal-eyebrow {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--sky);
    font-family: 'Jost', sans-serif;
    margin-bottom: 8px;
  }
  .modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
    margin-bottom: 14px;
  }
  .modal-desc {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-secondary);
    font-family: 'Jost', sans-serif;
    font-weight: 300;
  }
  .modal-actions {
    margin-top: 26px;
    display: flex;
    gap: 10px;
  }
  .modal-cta-btn {
    flex: 1;
    padding: 13px;
    border-radius: 10px;
    background: var(--sky);
    border: none;
    color: #fff;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Jost', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    animation: svc-glow-pulse 3s ease-in-out infinite;
  }
  .modal-cta-btn:hover {
    background: var(--sky-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(14,165,233,0.35);
  }
  .modal-dismiss-btn {
    padding: 13px 20px;
    border-radius: 10px;
    background: transparent;
    border: 1px solid var(--border-light);
    color: var(--text-secondary);
    font-size: 12px;
    font-family: 'Jost', sans-serif;
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
  }
  .modal-dismiss-btn:hover {
    border-color: var(--text-muted);
    color: var(--text-primary);
    background: rgba(255,255,255,0.04);
  }

  /* ── CTA SECTION ── */
  .cta-section {
    position: relative;
    overflow: hidden;
    padding: 100px 24px;
  }
  .cta-bg-wrap {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
  .cta-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.3;
    transition: transform 12s ease;
  }
  .cta-section:hover .cta-bg-img { transform: scale(1.04); }
  .cta-bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(7,8,15,0.75) 0%, rgba(7,8,15,0.65) 50%, rgba(7,8,15,0.88) 100%);
  }
  .cta-gif-badge {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(14,165,233,0.12);
    backdrop-filter: blur(6px);
    border: 1px dashed rgba(14,165,233,0.35);
    border-radius: 6px;
    padding: 5px 14px;
    pointer-events: none;
    white-space: nowrap;
  }
  .cta-gif-badge-text {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sky);
    font-family: 'Jost', sans-serif;
  }
  .cta-inner {
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 48px;
    flex-wrap: wrap;
  }
  .cta-text-block { max-width: 540px; }
  .cta-eyebrow {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--sky);
    font-family: 'Jost', sans-serif;
    margin-bottom: 16px;
  }
  .cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(30px, 4vw, 54px);
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.12;
    margin-bottom: 18px;
  }
  .cta-body {
    font-size: 15px;
    line-height: 1.78;
    color: var(--text-secondary);
    font-family: 'Jost', sans-serif;
    font-weight: 300;
  }
  .cta-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 210px;
  }
  .cta-btn-primary {
    padding: 16px 36px;
    border-radius: 10px;
    background: var(--sky);
    border: none;
    color: #fff;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: 'Jost', sans-serif;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(14,165,233,0.22);
    transition: background 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
  }
  .cta-btn-primary:hover {
    background: var(--sky-light);
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(14,165,233,0.35);
  }

  /* ── SCROLL REVEAL ── */
  .svc-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .svc-reveal--visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Build the final scoped CSS
const SCOPED_CSS = scopeCSS(RAW_CSS, ".svc");

// ─── CAROUSEL IMAGES ──────────────────────────────────────────────────────────
const CAROUSEL = [
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1920&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80",
];

// ─── SERVICE DATA ─────────────────────────────────────────────────────────────
const serviceData = [
  {
    id: "training",
    title: "Staff Training Services",
    shortTitle: "Training",
    description:
      "We equip both domestic and corporate staff with the skills, discipline and professionalism required to excel in their roles — through structured, practical and results-driven training programmes.",
    categoryImage:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&q=80",
    subcategories: [
      {
        name: "Domestic Staff Training",
        roles: [
          {
            name: "Housekeeping & Cleaning Standards",
            brief: "Professional techniques for impeccable home maintenance.",
            description:
              "A comprehensive training programme covering professional cleaning techniques, organisation systems, surface-care best practices and household management standards — equipping domestic staff to maintain homes to the highest possible level of cleanliness and order.",
            image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700&q=80",
          },
          {
            name: "Childcare & Nanny Training",
            brief: "Child development and safety essentials for caregivers.",
            description:
              "Structured training covering early childhood development, age-appropriate activities, emergency first aid, child safety protocols and effective communication with parents — ensuring caregivers are fully equipped to provide nurturing and professional childcare.",
            image: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=700&q=80",
          },
          {
            name: "Cooking & Culinary Skills",
            brief: "Kitchen mastery from preparation to plating.",
            description:
              "Practical culinary training designed for domestic cooks and private chefs — covering meal planning, food hygiene, dietary considerations, recipe execution and kitchen organisation to enable consistently high-quality home cooking.",
            image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&q=80",
          },
          {
            name: "Elderly Care & Support",
            brief: "Compassionate care techniques for senior support staff.",
            description:
              "Specialist training focused on the physical and emotional needs of elderly individuals — including safe mobility assistance, medication awareness, communication with family members and maintaining dignity and independence in daily care routines.",
            image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=700&q=80",
          },
          {
            name: "Etiquette & Household Protocols",
            brief: "Professionalism and discretion in a household setting.",
            description:
              "Training in professional household etiquette, personal presentation, discretion, correct forms of address, service standards and the unspoken expectations of working within a private residence — ensuring staff conduct themselves with refinement at all times.",
            image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=80",
          },
        ],
      },
      {
        name: "Corporate Staff Training",
        roles: [
          {
            name: "Customer Service Excellence",
            brief: "Delivering outstanding client experiences every time.",
            description:
              "An intensive programme developing communication skills, conflict resolution, empathy, active listening and brand-aligned service delivery — equipping customer-facing staff to consistently exceed client expectations across all touchpoints.",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&q=80",
          },
          {
            name: "Office Administration & Productivity",
            brief: "Structured workflows and administrative best practices.",
            description:
              "Practical training covering office organisation, document management, scheduling, email communication, time management and administrative best practices — enabling office staff to operate with greater efficiency and professionalism.",
            image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=700&q=80",
          },
          {
            name: "Sales & Business Development",
            brief: "Proven techniques to drive revenue and client growth.",
            description:
              "A results-oriented programme covering prospecting, needs analysis, persuasive communication, objection handling, negotiation and closing techniques — designed to sharpen the commercial instincts of sales teams and drive measurable revenue growth.",
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&q=80",
          },
          {
            name: "Leadership & Team Management",
            brief: "Building capable, confident and inspiring leaders.",
            description:
              "A structured leadership development programme covering management styles, team motivation, performance conversations, delegation, decision-making and emotional intelligence — transforming capable employees into effective, inspiring leaders.",
            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=700&q=80",
          },
          {
            name: "Health, Safety & Workplace Compliance",
            brief: "Creating safer, compliant and legally sound workplaces.",
            description:
              "Comprehensive training on occupational health and safety regulations, hazard identification, emergency response procedures, workplace rights and compliance obligations — equipping staff and managers to maintain a safe and legally compliant working environment.",
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80",
          },
        ],
      },
    ],
  },
  {
    id: "domestic",
    title: "Domestic Outsourcing Services",
    shortTitle: "Domestic",
    description:
      "We connect homes with thoroughly vetted household professionals — from housekeepers to private chefs — ensuring comfort, order and peace of mind every day.",
    categoryImage:
      "https://images.unsplash.com/photo-1527515545081-5db817172677?w=500&q=80",
    subcategories: [
      {
        name: "Household & Personal Staff",
        roles: [
          {
            name: "Housekeepers / Cleaners",
            brief: "Spotless homes maintained to the highest standard of cleanliness.",
            description:
              "Thoroughly vetted professionals who maintain your home to the highest standard of cleanliness and order. From routine tidying to deep cleans, they bring discipline and attention to every corner of your living space.",
            image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700&q=80",
          },
          {
            name: "Maids (Live-in / Part-time)",
            brief: "Reliable domestic support for any household arrangement.",
            description:
              "Dependable domestic staff available for full residential live-in arrangements or flexible scheduled visits. Discreet, professional and trained to your household's specific preferences and routines.",
            image: "https://images.unsplash.com/photo-1584820927498-cad0e4f49b68?w=700&q=80",
          },
          {
            name: "Nannies / Babysitters",
            brief: "Caring, vetted childcare specialists for your family.",
            description:
              "Carefully screened childcare specialists who provide nurturing, developmental and safety-conscious care for your children. Available for live-in and visiting arrangements tailored to your family's schedule.",
            image: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=700&q=80",
          },
          {
            name: "Laundry Assistants",
            brief: "Expert garment care and wardrobe management.",
            description:
              "Skilled laundry professionals handling the full wash cycle — sorting, washing, pressing, folding and wardrobe organisation — with special care for delicate and premium garments.",
            image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=700&q=80",
          },
          {
            name: "Elderly & Health Support",
            brief: "Compassionate daily care for your loved ones at home.",
            description:
              "Compassionate and trained caregivers providing daily living assistance, medication reminders, mobility support and companionship for elderly family members — all in the comfort of home.",
            image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=700&q=80",
          },
          {
            name: "Private Chefs",
            brief: "Bespoke culinary experiences crafted in your home.",
            description:
              "Accomplished culinary professionals who design and prepare bespoke daily menus tailored to your dietary needs and preferences, delivering a restaurant-quality dining experience within your own residence.",
            image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&q=80",
          },
          {
            name: "Cooks (Event)",
            brief: "High-quality event catering for any scale.",
            description:
              "Experienced event cooks who execute high-volume, high-quality meal preparation for private gatherings, celebrations and corporate events of any scale — seamlessly and professionally.",
            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80",
          },
          {
            name: "Personal Drivers",
            brief: "Safe, discreet and punctual transportation professionals.",
            description:
              "Professional, punctual and discreet drivers providing safe, comfortable transportation for you and your family. Fully licensed with extensive knowledge of local routes and a commitment to discretion.",
            image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=700&q=80",
          },
          {
            name: "Security Guard / Gatekeeper",
            brief: "Round-the-clock access control and residential protection.",
            description:
              "Trained and vetted security personnel providing vigilant, round-the-clock access control and protection for your residence — ensuring complete peace of mind for your household at all times.",
            image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=700&q=80",
          },
        ],
      },
    ],
  },
  {
    id: "corporate",
    title: "Corporate Outsourcing Services",
    shortTitle: "Corporate",
    description:
      "From front-desk reception to IT support and logistics — we supply skilled corporate professionals who integrate seamlessly into your organisation and deliver results from day one.",
    categoryImage:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500&q=80",
    subcategories: [
      {
        name: "Administrative & Office Staff",
        roles: [
          {
            name: "Receptionists",
            brief: "Polished first impressions for your organisation.",
            description:
              "Polished, articulate front-desk professionals who create outstanding first impressions and manage visitor relations, call routing and scheduling with ease and consistent professionalism.",
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=700&q=80",
          },
          {
            name: "Office Assistants",
            brief: "Versatile support for day-to-day office operations.",
            description:
              "Versatile administrative support staff handling clerical duties, documentation, correspondence and general office coordination — keeping your operations running smoothly every single day.",
            image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=700&q=80",
          },
          {
            name: "Data Entry Clerks",
            brief: "Accurate records and clean information systems.",
            description:
              "Meticulous and fast-typing clerks who maintain data accuracy, manage records and ensure your information systems stay clean, current and fully organised at all times.",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80",
          },
          {
            name: "Secretaries / Executive Assistants",
            brief: "Strategic administrative support for senior leadership.",
            description:
              "Highly organised professionals adept at calendar management, executive scheduling, travel coordination and handling sensitive correspondence on behalf of senior leadership — with absolute discretion.",
            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=700&q=80",
          },
        ],
      },
      {
        name: "Facility & Maintenance Staff",
        roles: [
          {
            name: "Cleaners / Janitors",
            brief: "Hygienic, well-presented commercial environments.",
            description:
              "Reliable cleaning personnel who maintain hygienic, well-presented work environments — from routine daily cleaning to scheduled deep cleans of commercial and industrial premises.",
            image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=700&q=80",
          },
          {
            name: "Facility Managers",
            brief: "End-to-end management of your entire facility.",
            description:
              "Experienced managers who oversee operations, maintenance and safety compliance across your entire facility — coordinating vendors and ensuring uninterrupted business continuity.",
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80",
          },
          {
            name: "Maintenance Technicians",
            brief: "Proactive repairs keeping your facility at full capacity.",
            description:
              "Multi-skilled technicians who perform preventive maintenance, identify issues proactively and execute timely repairs to keep your facilities functioning at full operational capacity.",
            image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=700&q=80",
          },
          {
            name: "Electricians",
            brief: "Safe, certified electrical work for commercial premises.",
            description:
              "Certified electrical professionals handling installations, fault-finding, rewiring and compliance inspections for commercial office spaces and facilities — always safe and to code.",
            image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&q=80",
          },
        ],
      },
      {
        name: "Customer Support & Sales",
        roles: [
          {
            name: "Customer Service Representatives",
            brief: "Consistent, brand-aligned customer experiences.",
            description:
              "Trained communication professionals who resolve queries, manage complaints and deliver consistent, brand-aligned customer experiences across voice, email and digital channels.",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&q=80",
          },
          {
            name: "Sales Representatives",
            brief: "Goal-driven professionals growing your revenue base.",
            description:
              "Results-driven sales professionals skilled in lead generation, client acquisition, relationship building and closing deals — consistently growing your revenue base and market reach.",
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&q=80",
          },
        ],
      },
      {
        name: "Technical & IT Roles",
        roles: [
          {
            name: "IT Support Staff",
            brief: "Keeping your digital infrastructure operational.",
            description:
              "Competent technical support professionals who manage helpdesk queries, troubleshoot hardware and software issues and maintain your organisation's digital infrastructure with minimal downtime.",
            image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=700&q=80",
          },
        ],
      },
      {
        name: "Logistics & Operations",
        roles: [
          {
            name: "Dispatch Riders",
            brief: "Swift, reliable last-mile delivery solutions.",
            description:
              "Reliable and swift riders who ensure timely, safe last-mile delivery of packages, documents and goods across your operational network — efficiently and on schedule.",
            image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80",
          },
          {
            name: "Drivers",
            brief: "Professional drivers for all corporate operations.",
            description:
              "Professional drivers for corporate logistics, staff movement, airport transfers and supply chain operations — punctual, courteous and knowledgeable of local routes.",
            image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=700&q=80",
          },
        ],
      },
    ],
  },
  {
    id: "artisans",
    title: "Artisans Recruitment Services",
    shortTitle: "Artisans",
    description:
      "We source and vet Nigeria's most skilled artisans — builders, fabricators, creatives and personal service professionals — matched precisely to your project requirements.",
    categoryImage:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&q=80",
    subcategories: [
      {
        name: "Construction & Building Trades",
        roles: [
          {
            name: "Masons / Bricklayers",
            brief: "Precise, durable brickwork for any structure.",
            description:
              "Experienced masons who deliver precise, durable brickwork and masonry for residential foundations, commercial structures and decorative finishes — built to last.",
            image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=700&q=80",
          },
          {
            name: "Carpenters",
            brief: "Bespoke woodwork and structural joinery.",
            description:
              "Skilled carpenters crafting and installing furniture frameworks, structural woodwork, door frames, roofing timbers and bespoke joinery — all to exacting standards.",
            image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=700&q=80",
          },
          {
            name: "Painters",
            brief: "Flawless interior and exterior finishes.",
            description:
              "Professional painters providing flawless interior and exterior finishes — from surface preparation and priming through to final coat application and detailed touch-ups.",
            image: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=700&q=80",
          },
          {
            name: "Tilers",
            brief: "Immaculate tile installations on any surface.",
            description:
              "Expert tilers delivering immaculate, perfectly level tile installations on floors, walls and outdoor surfaces across residential and commercial settings — with precision.",
            image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=700&q=80",
          },
          {
            name: "Plumbers",
            brief: "Complete plumbing installations and repairs.",
            description:
              "Licensed plumbers handling full-system installations, pipe repairs, leak fixes and maintenance for residential, commercial and industrial plumbing networks.",
            image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=700&q=80",
          },
        ],
      },
      {
        name: "Electrical & Mechanical",
        roles: [
          {
            name: "Electricians",
            brief: "Safe, code-compliant electrical work.",
            description:
              "Certified electricians for residential and commercial wiring, DB installations, fault diagnosis, fixture mounting and power system upgrades — always compliant and safe.",
            image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&q=80",
          },
          {
            name: "Generator Technicians",
            brief: "Expert genset installation, servicing and repair.",
            description:
              "Specialists in the installation, routine servicing, load testing and emergency repair of diesel and petrol generating sets of all capacities — keeping your power reliable.",
            image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=80",
          },
          {
            name: "HVAC Technicians (AC Repair)",
            brief: "Optimal cooling performance maintained year-round.",
            description:
              "Trained technicians who install, service and repair split-unit, cassette and ducted air-conditioning systems — ensuring optimal cooling performance throughout every season.",
            image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=700&q=80",
          },
          {
            name: "Welders / Fabricators",
            brief: "Precision metalwork using advanced welding techniques.",
            description:
              "Skilled welders producing precision metal fabrications — gates, grilles, structural frames, tanks and bespoke metalwork — using MIG, TIG and arc welding techniques.",
            image: "https://res.cloudinary.com/dotvnclej/image/upload/v1777905578/3_Key_Safety_Clothing_for_Machinists_-_Vents_MagaZine_fdclfb.jpg",
          },
        ],
      },
      {
        name: "Craft & Creative Trades",
        roles: [
          {
            name: "Furniture Makers",
            brief: "Custom-crafted pieces built to your specification.",
            description:
              "Talented craftspeople designing and handcrafting custom wood, metal and upholstered furniture pieces tailored to client specifications and interior styles.",
            image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=80",
          },
          {
            name: "Interior Decorators",
            brief: "Spaces transformed into refined environments.",
            description:
              "Creative decorators who conceptualise and execute interior transformations — from colour schemes and material selection to spatial arrangement and accessory styling.",
            image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&q=80",
          },
          {
            name: "Upholsterers",
            brief: "Furniture restored to showroom condition.",
            description:
              "Specialist craftspeople who restore, re-pad and re-cover furniture pieces with premium fabrics, leather and foam — returning worn items to showroom condition.",
            image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=80",
          },
        ],
      },
      {
        name: "Personal Service Artisans",
        roles: [
          {
            name: "Tailors / Fashion Designers",
            brief: "Bespoke garments crafted with precision and style.",
            description:
              "Expert tailors and designers creating perfectly fitted bespoke garments — from corporate attire and occasion wear to everyday fashion — with precision and personal style.",
            image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=700&q=80",
          },
          {
            name: "Barbers / Hair Stylists",
            brief: "Sharp cuts and sophisticated styles delivered.",
            description:
              "Talented grooming professionals delivering sharp fades, precision cuts and sophisticated styling for both male and female clients in residential and salon settings.",
            image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700&q=80",
          },
          {
            name: "Makeup Artists",
            brief: "Flawless looks for every occasion and event.",
            description:
              "Professional makeup artists specialising in bridal, editorial, event and everyday looks — using premium products and proven techniques to deliver consistently flawless results.",
            image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=700&q=80",
          },
        ],
      },
      {
        name: "General Skilled Labour",
        roles: [
          {
            name: "Handymen",
            brief: "Reliable multi-skilled help for any property task.",
            description:
              "Versatile multi-skilled workers who handle a broad range of repair, maintenance and light construction tasks around the home or workplace — reliable, efficient and professional.",
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=80",
          },
          {
            name: "Installers (Solar, CCTV, etc.)",
            brief: "Certified installation of all technical equipment.",
            description:
              "Certified technicians for the installation and commissioning of solar panels, CCTV systems, access control, satellite dishes and other technical equipment.",
            image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=700&q=80",
          },
          {
            name: "Painters & Finishers",
            brief: "Specialist decorative and protective finishes.",
            description:
              "Specialist painters trained in decorative and protective surface finishes including epoxy floors, textured coatings, stencil work and spray applications for distinctive results.",
            image: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=700&q=80",
          },
        ],
      },
    ],
  },
];

// ─── SCROLL REVEAL HOOK ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("svc-reveal--visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ role, onClose, isTraining, user }) {
  const navigate = useNavigate();
  const [hireOpen, setHireOpen] = useState(false);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleHireClick = () => {
    if (!user) {
      onClose();
      navigate("/login");
      return;
    }
    setHireOpen(true);
  };

  return (
    <>
      <div className="svc-modal-backdrop" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-img-wrap">
            <img src={role.image} alt={role.name} className="modal-img" />
            <div className="modal-img-gradient" />
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="modal-accent-bar" />
            <p className="modal-eyebrow">Role Details</p>
            <h3 className="modal-title">{role.name}</h3>
            <p className="modal-desc">{role.description}</p>
            <div className="modal-actions">
              {isTraining ? (
                <a
                  href="/contact"
                  className="modal-cta-btn"
                  style={{ textDecoration: "none", textAlign: "center" }}
                  onClick={onClose}
                >
                  Contact Us
                </a>
              ) : (
                <button className="modal-cta-btn" onClick={handleHireClick}>
                  Hire Staff
                </button>
              )}
              <button className="modal-dismiss-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {hireOpen && <HireStaffModal onClose={() => setHireOpen(false)} />}
    </>
  );
}

// ─── ROLE CARD ────────────────────────────────────────────────────────────────
function RoleCard({ role, onLearnMore, delay = 0 }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="role-card svc-reveal"
      style={{ animationDelay: `${delay}ms` }}
    >
      <img src={role.image} alt={role.name} className="role-card-bg" />
      <div className="role-card-overlay" />
      <div className="role-card-top-bar" />
      <div className="role-card-content">
        <h4 className="role-card-title">{role.name}</h4>
        <p className="role-card-brief">{role.brief}</p>
        <button
          className="role-learn-btn"
          onClick={(e) => { e.stopPropagation(); onLearnMore(role); }}
        >
          Learn More
        </button>
      </div>
    </div>
  );
}

// ─── CATEGORY HEADER ─────────────────────────────────────────────────────────
function CategoryHeader({ service }) {
  const totalRoles = service.subcategories.reduce((a, s) => a + s.roles.length, 0);
  const ref = useReveal();
  return (
    <div ref={ref} className="cat-header svc-reveal">
      <div className="cat-header-img-wrap">
        <img src={service.categoryImage} alt={service.title} className="cat-header-img" />
        <div className="cat-header-img-fade" />
        <div className="cat-header-img-tint" />
      </div>
      <div className="cat-header-body">
        <p className="cat-eyebrow">Services Category</p>
        <h2 className="cat-title">{service.title}</h2>
        <p className="cat-desc">{service.description}</p>
        <div className="cat-meta">
          <div className="cat-meta-line" />
          <span className="cat-meta-text">{totalRoles} programmes available</span>
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE SECTION ──────────────────────────────────────────────────────────
function ServiceSection({ service, user }) {
  const [activeRole, setActiveRole] = useState(null);
  const isTraining = service.id === "training";
  return (
    <section id={service.id} className="service-section">
      <div className="section-inner">
        <CategoryHeader service={service} />
        {service.subcategories.map((sub, si) => (
          <div key={si} className="subcategory">
            <div className="sub-label-row">
              <span className="sub-label">{sub.name}</span>
              <div className="sub-rule" />
            </div>
            <div className="roles-grid">
              {sub.roles.map((role, ri) => (
                <RoleCard
                  key={ri}
                  role={role}
                  onLearnMore={setActiveRole}
                  delay={ri * 60}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {activeRole && (
        <Modal
          role={activeRole}
          onClose={() => setActiveRole(null)}
          isTraining={isTraining}
          user={user}
        />
      )}
    </section>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection({ onNav }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx((p) => (p + 1) % CAROUSEL.length); setFade(true); }, 600);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="hero">
      {CAROUSEL.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={`hero-img ${i === idx ? (fade ? "hero-img--visible" : "hero-img--hidden") : "hero-img--hidden"}`}
        />
      ))}
      <div className="hero-overlay-gradient" />
      <div className="hero-overlay-radial" />

      <div className="hero-dots">
        {CAROUSEL.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === idx ? "hero-dot--active" : ""}`}
            onClick={() => {
              setFade(false);
              setTimeout(() => { setIdx(i); setFade(true); }, 300);
            }}
          />
        ))}
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          <span className="hero-badge-text">Staffing &amp; Outsourcing Solutions</span>
        </div>

        <h1 className="hero-title">
          Our <span className="hero-title-accent">Services</span>
        </h1>

        <p className="hero-subtitle">
          From staff training and domestic household management to corporate operations and skilled artisan recruitment — connecting you with the professionals who matter most.
        </p>

        <div className="hero-buttons">
          {serviceData.map((s) => (
            <button key={s.id} className="hero-btn" onClick={() => onNav(s.id)}>
              {s.shortTitle}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── STATS STRIP ─────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { label: "Service Categories", value: "4", sub: "Training · Domestic · Corporate · Artisans" },
    { label: "Roles Available", value: "50+", sub: "Across all service categories" },
    { label: "Years of Excellence", value: "10+", sub: "Trusted by homes & businesses" },
  ];
  return (
    <div className="stats-strip">
      <div className="stats-inner">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`stat-cell${i === 0 ? " stat-cell--first" : ""}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CTA SECTION ─────────────────────────────────────────────────────────────
function CTASection() {
  const ref = useReveal();
  return (
    <section className="cta-section">
      <div className="cta-bg-wrap">
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80"
          alt=""
          className="cta-bg-img"
        />
        <div className="cta-gif-badge">
          <span className="cta-gif-badge-text">GIF Placeholder — Replace with animated asset</span>
        </div>
        <div className="cta-bg-overlay" />
      </div>

      <div ref={ref} className="cta-inner svc-reveal">
        <div className="cta-text-block">
          <p className="cta-eyebrow">Get Started Today</p>
          <h3 className="cta-title">Ready to find the right professional?</h3>
          <p className="cta-body">
            Let us match you with vetted, reliable staff — tailored to your exact needs and delivered with professionalism every time.
          </p>
        </div>

        <div className="cta-actions">
          <a href="/contact" className="cta-btn-primary" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>Contact Us</a>
        </div>
      </div>
    </section>
  );
}

// ─── PAGE ROOT ────────────────────────────────────────────────────────────────
export function ServicesPage({ user }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <style>{SCOPED_CSS}</style>
      <div className="svc">
        <HeroSection onNav={scrollTo} />
        <StatsStrip />
        {serviceData.map((s) => (
          <ServiceSection key={s.id} service={s} user={user} />
        ))}
        <CTASection />
      </div>
    </>
  );
}

export default ServicesPage;