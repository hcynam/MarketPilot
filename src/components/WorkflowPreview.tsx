import './WorkflowPreview.css'

const steps = [
  { num: '01', label: 'دریافت اطلاعات', desc: 'مشخصات کسب‌وکار یا محصول را وارد کنید' },
  { num: '02', label: 'شناخت مشتری', desc: 'بازار، بخش‌ها و پرسونای مشتری را مشخص کنید' },
  { num: '03', label: 'برنامه بازاریابی', desc: 'برنامه ساختاریافته ۱۷ بخشی تولید می‌شود' },
  { num: '04', label: 'داشبورد KPI', desc: 'شاخص‌ها، امتیاز کیفیت و برنامه اقدام را ببینید' },
]

function WorkflowPreview() {
  return (
    <section className="workflow">
      <div className="container">
        <h2 className="workflow__title">روند کار</h2>
        <div className="workflow__steps">
          {steps.map((step, i) => (
            <div key={step.num} className="workflow__step">
              <div className="workflow__step-number">{step.num}</div>
              <div className="workflow__step-content">
                <h3 className="workflow__step-label">{step.label}</h3>
                <p className="workflow__step-desc">{step.desc}</p>
              </div>
              {i < steps.length - 1 && <div className="workflow__arrow" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WorkflowPreview
