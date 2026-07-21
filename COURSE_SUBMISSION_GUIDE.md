# MarketPilot AI — Course Submission Guide

---

## توضیحات پروژه (Persian)

**MarketPilot AI** یک ابزار برنامه‌ریزی بازاریابی AI-assisted و مبتنی بر ورودی‌های ساختاریافته کسب‌وکار است. این پروژه در صورت تنظیم Gemini از طریق Netlify Function، کیفیت ورودی را بررسی می‌کند، سؤال‌های تکمیلی می‌پرسد و سپس برنامه بازاریابی ۱۷ بخشی تولید می‌کند؛ اگر هوش مصنوعی در دسترس نباشد، موتور rule-based داخلی نسخه پایه را می‌سازد. هدف اصلی، ایجاد یک نمونه‌کار حرفه‌ای برای ارائه در درس بازاریابی و نمایش پیاده‌سازی مفاهیم آکادمیک بازاریابی در یک محصول نرم‌افزاری واقعی است.

---

## Project Description (English)

MarketPilot AI is an AI-assisted structured marketing planning assistant. It accepts business/product information through a multi-step form, uses a server-side Gemini flow for input-quality review and final plan generation when configured, and preserves a deterministic rule-based fallback when AI is unavailable.

### What Problem It Solves

Entrepreneurs, students, and small business owners often need a structured marketing plan but lack the time, expertise, or budget to create one. MarketPilot AI provides an instant, academically grounded starting point that can be refined and customized.

### Marketing Concepts Covered

| # | Section | Course Concept |
|---|---------|---------------|
| 1 | Business Summary | Digital marketing fundamentals |
| 2 | Customer Development Stage | Customer lifecycle, Lean Startup stages |
| 3 | Market Segments | Geographic, demographic, psychographic, behavioral, profitability segmentation |
| 4 | Target Market | Primary & secondary targeting |
| 5 | Positioning Statement | Positioning framework |
| 6 | Customer Personas | Persona development |
| 7 | Value Proposition | Value creation |
| 8 | USP | Unique Selling Proposition formula |
| 9 | Competitor / Alternative Analysis | Competitive analysis |
| 10 | 7P Marketing Mix | Product, Price, Place, Promotion, People, Process, Physical Evidence |
| 11 | Funnel & Customer Journey | AIDA + Loyalty + Advocacy funnel |
| 12 | Digital Channel Strategy | Channel selection & prioritization |
| 13 | Initial Pricing Recommendation | Pricing strategies |
| 14 | KPI Dashboard | CTR, Conversion Rate, CPL, CAC, ROI, LTV, CPI, eCPM, Retention Rate, etc. |
| 15 | 30-Day Action Plan | Tactical implementation planning |
| 16 | Risks & Assumptions | Risk assessment |
| 17 | Marketing Plan Quality Score | Self-evaluation criteria |

### How to Test

1. **Clone and install:**
   ```bash
   cd D:\InvestmentPlatform\OpenCodeTest
   npm install
   npm run dev
   ```

2. **Load the sample case:**
   - Click **"Load Sample Case Study"** — this fills all 18 form fields with the MarketPilot AI case study (an AI-powered investment feasibility platform)

3. **Generate the plan:**
   - Click **"Generate Marketing Plan"**
   - The built-in sample skips clarification explicitly
   - Custom incomplete inputs receive 3-6 decision-relevant questions
   - The complete baseline is always produced internally; valid AI strategy patches are optional enhancements
   - Scroll through the 17-section output with collapsible sections

4. **Interact with KPIs:**
   - Toggle KPIs on/off
   - Edit target and benchmark values
   - Click "Reset to Recommended" to restore defaults

5. **Export:**
   - Click **"Copy as Markdown"** to copy the full plan as formatted Markdown
   - Use **File → Print** (browser) for a clean, report-only print

6. **Clear and retry:**
   - Click **"Clear Form"** to reset
   - Modify fields and generate again

### Sample Case Study

**MarketPilot AI** — An AI-powered investment feasibility analysis platform targeting B2B industrial engineering firms, financial analysts, and investment committees. Provides faster, more accurate financial modeling, NPV/IRR analysis, and risk assessment for investment decisions.

### Suggested Presentation Talking Points (3–5 minutes)

1. **Opening (30s):** "This is MarketPilot AI — an AI-assisted, course-informed marketing planning tool. It accepts business inputs, checks whether the input is strong enough, and produces a 17-section plan covering segmentation, positioning, the 7P mix, funnel strategy, KPI dashboards, and more."

2. **Problem & Motivation (30s):** "Entrepreneurs and students need quick, structured marketing plans. Instead of staring at a blank page, they can fill in their business data and get an academically grounded starting point in seconds."

3. **Live Demo (2 min):** Load the sample case, click Generate, confirm that it asks zero clarification questions, explain the source-status label, walk through 3-4 key sections (USP, 7P Mix, KPI Dashboard, Quality Score), and show export.

4. **Technical Highlights (1 min):** "Built with React, TypeScript, and Vite. Gemini runs server-side through a Netlify Function, the frontend never receives the API key, and the deterministic engine remains as a reliable fallback."

5. **Closing (30s):** "A working MVP that demonstrates practical application of marketing theory in software. The sample case (MarketPilot AI) shows how an industrial engineering investment tool would be marketed."

### Limitations to Mention During Presentation

- It is AI-assisted, not a fully autonomous marketing consultant
- Generated plans should be reviewed before real-world use
- If Gemini is unavailable, fallback output follows deterministic planning rules
- KPI values are planning assumptions, not campaign data
- Persian localization covers hero text and RTL layout only
- No user accounts or persistent storage beyond localStorage

### Future Development Ideas

- Editable plan sections after generation
- Export to PDF with proper formatting
- Custom branding/template selection
- Full Persian/Arabic localization
- Stronger AI QA tests and deployed Netlify monitoring

---

*Prepared for Marketing Course Submission*
