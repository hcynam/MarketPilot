import './WorkflowPreview.css'
import DecisionThread from './DecisionThread'

const steps = [
  { num: '01', label: 'دریافت اطلاعات', desc: 'مشخصات کسب‌وکار یا محصول را وارد کنید' },
  { num: '02', label: 'شناخت مشتری', desc: 'بازار، بخش‌ها و پرسونای مشتری را مشخص کنید' },
  { num: '03', label: 'برنامه بازاریابی', desc: 'برنامه ساختاریافته ۱۷ بخشی تولید می‌شود' },
  { num: '04', label: 'داشبورد KPI', desc: 'شاخص‌ها، امتیاز کیفیت و برنامه اقدام را ببینید' },
]

function WorkflowPreview() {
  return (
    <section className="workflow" data-mp-reveal>
      <div className="container">
        <h2 className="workflow__title">روند کار</h2>
        <DecisionThread
          className="workflow__steps"
          steps={steps.map(step => ({ marker: step.num, label: step.label, description: step.desc }))}
          ariaLabel="روند کار MarketPilot AI"
        />
      </div>
    </section>
  )
}

export default WorkflowPreview
