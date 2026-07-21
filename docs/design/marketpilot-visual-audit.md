# MarketPilot AI — Visual Audit and Design Directions

> تاریخ ممیزی: ۱۴۰۵/۰۴/۲۷ (2026-07-18)  
> دامنه: ظاهر و تجربه بصری، RTL، responsive، accessibility و motion strategy  
> قفل دامنه: هیچ متن، سؤال، ترتیب داده، validation، Business Logic، API، Netlify Function، مدل AI یا قابلیت export در این سند برای تغییر پیشنهاد نشده است.

## 1. Executive Summary

MarketPilot AI از نظر عملکرد، پوشش حالت‌ها و ساختار محتوای خروجی پایه‌ای قوی دارد، اما زبان بصری فعلی هنوز به هویت یک محصول SaaS تجاری متمایز نرسیده است. ترکیب بنفش/فیروزه‌ای، sparkle icon، گرادیان‌ها، pillهای متعدد و کارت‌های تکراری آن را به الگوی آشنای «ابزار AI عمومی» نزدیک می‌کند. مهم‌تر از سلیقه بصری، مسیر قبل از فرم طولانی، خروجی ۱۷ بخشی کم‌تمایز، تراکم KPI و هم‌پوشانی دستیار روی محتوای موبایل، سرعت درک و استفاده روزمره را کاهش می‌دهد.

پیشنهاد اصلی این گزارش، جهت **«نقشه فرمان رشد / Growth Command Map»** است: یک سیستم روشن، تحلیلی و RTL-native با مسیر تصمیم‌گیری قابل دنبال‌کردن، زمینه خنثی واقعی، رنگ اصلی petrol، accent محدود نارنجی سیگنال، تایپوگرافی واحد Vazirmatn و حداقل وابستگی فنی. ویژگی امضادار آن **Decision Thread** است؛ خط سیر مفیدی که ورودی، تحلیل، برنامه و KPI را به‌صورت مرحله‌ای به هم متصل می‌کند و تزئین صرف نیست.

### Audit health score

| بُعد | امتیاز از ۴ | یافته اصلی |
|---|---:|---|
| Accessibility | 2 | selectهای بدون accessible name، checkboxهای کانال پنهان از keyboard، خطاهای نامرتبط با field |
| Performance | 3 | bundle فعلی بسیار سبک است؛ تنها motionهای paint/layout و رندر طولانی خروجی قابل بهبودند |
| Responsive Design | 2 | layout می‌شکند نه، اما launcher روی محتوا می‌افتد و مسیر موبایل بیش از حد طولانی است |
| Theming | 2 | tokenهای پایه وجود دارند ولی رنگ‌ها و stateها در فایل‌ها hard-coded و پراکنده‌اند |
| Anti-Patterns | 1 | هویت generic AI، nested/repeated cards، glow، pill و side-tab accent |
| **مجموع** | **10/20** | **Acceptable؛ بازطراحی بصری معنادار لازم است** |

۱۸ ریشه مسئله ثبت شد: **P0: 0، P1: 7، P2: 9، P3: 2**. جهت پیشنهادی بدون تغییر محتوا یا منطق و با complexity متوسط قابل اجرا است.

## 2. Product and User Context

- محصول یک ابزار task-oriented برای تبدیل اطلاعات کسب‌وکار به برنامه بازاریابی ۱۷ بخشی، KPI و خروجی قابل استفاده است؛ design باید در خدمت تصمیم‌گیری باشد، نه نمایش تکنولوژی AI.
- کاربران محتمل شامل بنیان‌گذار، مدیر رشد، بازاریاب SME، مشاور و تیم‌های کوچک‌اند. استفاده معمول در نور روز، جلسه برنامه‌ریزی یا کار عمیق با گزارش طولانی انجام می‌شود؛ بنابراین light-first، کنتراست بالا و تراکم کنترل‌شده مناسب‌تر از dark-first نمایشی است.
- زبان و جهت اصلی فارسی/RTL است، اما اصطلاحات بازاریابی، فرمول‌ها، نام KPI و اعداد لاتین در متن حضور دارند. سیستم باید bidi و tabular number را آگاهانه مدیریت کند.
- stack فعلی React 19 + Vite 6 است و هیچ کتابخانه UI، chart یا motion در dependencyهای production وجود ندارد؛ این سادگی یک مزیت مهم برای performance است.
- URL زنده `https://fabulous-druid-c6fd9d.netlify.app/` در زمان ممیزی هم در مرورگر درون‌برنامه‌ای و هم با درخواست HEAD با timeout مواجه شد. برای مشاهده رندر، همان source بدون تغییر با Vite dev server اجرا شد؛ build یا deploy انجام نشد.

## 3. Current UI Inventory

| سطح | فایل/محل | وضعیت‌ها و اجزای موجود |
|---|---|---|
| Hero | `src/components/HeroSection.tsx:5-19` | badge، wordmark، subtitle و دو پاراگراف توضیحی؛ چیدمان کاملاً centered |
| روند کار | `WorkflowPreview.tsx:12-27` | چهار مرحله افقی در دسکتاپ و عمودی در موبایل |
| چارچوب تحلیلی | `CourseAlignment.tsx:19-33` | ۱۱ کارت auto-fit برای mapping موضوع به بخش خروجی |
| شروع سریع | `DemoFlow.tsx:14-30` | timeline شش‌مرحله‌ای |
| فرم کسب‌وکار | `BusinessIntakeForm.tsx:139-477` | پنج گروه، progress segmented، text/textarea/select، choice chips، sample/reset/generate |
| AI status | `App.tsx:200-220` | reviewing، generating، internal-only، enhanced، partially-enhanced؛ aria-live و loading motion |
| سؤال‌های تکمیلی | `ClarifyingQuestionsPanel.tsx:57-135` | diagnosis، quality score، required/optional questions، validation و back/final generate |
| خروجی برنامه | `MarketingPlanPreview.tsx:74-247` | header، stale banner، score، چهار export action، ۱۷ accordion که همگی پیش‌فرض بازند |
| KPI | `KpiDashboard.tsx:74-167` | کارت دو ستونه، toggle، priority/frequency/funnel tags، target/benchmark edit، reset و print table |
| دستیار | `assistant/AssistantPanel.tsx:56-169` | launcher ثابت، dialog غیرmodal، empty/suggestion/message/loading/error/retry/clear/composer |
| چاپ و export | `MarketingPlanPreview.tsx:27-69` و print CSS | Markdown copy، Word، print و PDF؛ حالت busy برای PDF |

## 4. Strengths Worth Preserving

- `dir="rtl"` و `lang="fa"` در root تعریف شده‌اند (`App.tsx:194`) و در بخش‌های mixed content از `unicode-bidi: plaintext` استفاده شده است.
- ساختار headingها در مسیر اصلی قابل‌فهم است و accordionها `aria-expanded` دارند.
- فرم، draft محلی، sample، clear، validation و جریان fallback را از UI جدا نگه داشته است؛ این separation باید دست‌نخورده بماند.
- stateهای مهم به‌صورت واقعی پوشش داده شده‌اند: loading، success، partial success، internal fallback، stale output، PDF busy، assistant empty/loading/error/retry و over-limit.
- `aria-live="polite"` برای وضعیت AI و مکالمه و `role="alert"` برای خطای دستیار وجود دارد.
- reduced motion برای status و assistant در CSS لحاظ شده است.
- print stylesheet و جدول مخصوص چاپ KPI نشان می‌دهد خروجی صرفاً نمایشی نیست و باید در بازطراحی محافظت شود.
- bundle production فعلی فقط React/ReactDOM دارد؛ هیچ asset تصویری سنگین یا dependency تزئینی دیده نشد.
- responsive gridها به یک ستون تبدیل می‌شوند و input دستیار در موبایل 16px است تا zoom ناخواسته iOS رخ ندهد.

## 5. Critical UX Problems

| ID | شدت | محل دقیق | علت | اثر کاربری | اصلاح پیشنهادی در محدوده طراحی |
|---|---|---|---|---|---|
| MP-08 | P2 | ترتیب رندر `App.tsx:195-199` و رندر واقعی قبل از فرم | Hero، روند چهارمرحله‌ای، ۱۱ مفهوم تحلیلی و راهنمای شش‌مرحله‌ای همگی پیش از اولین field قرار دارند | کاربر برای شروع task در موبایل چندین viewport و در دسکتاپ چند section را طی می‌کند؛ محصول بیشتر شبیه landing آموزشی دیده می‌شود تا ابزار | بدون حذف یا جابه‌جایی معنایی محتوا، سه بخش را به یک «pre-flight band» کم‌ارتفاع و فشرده تبدیل کنید؛ در موبایل spacing و card treatment را کم کنید تا محتوا سریع‌تر به فرم برسد |
| MP-12 | P2 | `MarketingPlanPreview.tsx:112-244` و `CollapsibleSection:251-273` | ۱۷ بخش با وزن بصری تقریباً یکسان و همگی `defaultOpen=true` هستند | اسکن گزارش، یافتن بخش مهم و بازگشت به KPI زمان‌بر است؛ خروجی به یک دیوار متن تبدیل می‌شود | رفتار و ترتیب را حفظ کنید، اما header فصل‌ها، cadence spacing، شماره‌ها و surfaceها را به سه خانواده «شناخت / استراتژی / اجرا و سنجش» از نظر بصری تفکیک کنید؛ از `content-visibility:auto` برای بخش‌های پایین استفاده شود |
| MP-13 | P2 | `MarketingPlanPreview.tsx:90-108`، `MarketingPlanPreview.css:98-128` | چهار action export با شکل، رنگ و وزن یکسان نمایش داده می‌شوند | در mobile header شلوغ است و hierarchy اقدام مشخص نیست | بدون حذف action، یک action اصلی و سه action ثانویه در یک toolbar واحد بسازید؛ labelها و رفتار بدون تغییر بمانند |
| MP-07 | P1 | `assistant.css:8-28, 581-615` و screenshots در عرض 390px | launcher ثابت فضای زیر خود را برای صفحه reserve نمی‌کند؛ panel تقریباً تمام viewport را می‌پوشاند ولی `aria-modal=false` است؛ پس از close فوکوس صریحاً به launcher برنمی‌گردد (`MarketingAssistant.tsx:20-45`) | متن، مرحله چهارم، سرآیند فرم و KPI زیر launcher قرار می‌گیرند؛ keyboard user ممکن است پس از بستن جای خود را گم کند | bottom safe-space برای محتوای اصلی، launcher کوچک‌تر و متنی-آیکونی پایدار، focus return، و در mobile تبدیل visual panel به sheet تمام‌عرض با پس‌زمینه جداشده؛ semantics و منطق ارسال ثابت بماند |

## 6. Visual Design Problems

### Anti-pattern verdict

ظاهر فعلی در نگاه اول «AI-generated SaaS» تشخیص داده می‌شود. دلیل، وجود هم‌زمان purple/cyan، sparkle glyph، gradient button، glow، badge/pillهای متعدد، کارت‌های سفید تکراری و سایه‌های نرم است. detector خود Impeccable نیز side-tab accent و transition روی width را گزارش کرد.

| ID | شدت | محل دقیق | علت | اثر | اصلاح پیشنهادی |
|---|---|---|---|---|---|
| MP-09 | P2 | `index.css:3-8, 49-54`، `HeroSection.css:1-31`، `assistant.css:8-24` | indigo + cyan + sparkle + gradient زبان کلیشه‌ای ابزار AI را می‌سازند | هویت محصول با ابزارهای عمومی chatbot اشتباه می‌شود و اعتماد B2B/strategy کم می‌شود | پالت خنثی برندشده + petrol اصلی + orange signal محدود؛ wordmark solid و نشانه‌های مرتبط با مسیر تصمیم/بازاریابی، نه sparkle |
| MP-10 | P2 | `CourseAlignment.css:27-44`، `BusinessIntakeForm.css:50-57`، `MarketingPlanPreview.css:8-18, 278-330`، `KpiDashboard.css:58-72` | هر گروه محتوا به کارت border+surface+shadow تبدیل شده و برخی کارت‌ها داخل card اصلی قرار دارند | hierarchy تخت و شلوغ می‌شود؛ کاربر نمی‌داند کدام surface تعاملی یا مهم است | container اصلی را بدون shadow نگه دارید؛ card فقط برای unit مستقل/قابل تعامل؛ report sections با rule و whitespace جدا شوند، نه nested card |
| MP-11 | P2 | tokens در `index.css:1-23` در برابر hard-coded رنگ‌ها در `App.css:11-18, 67-69, 122-137`، `ClarifyingQuestionsPanel.css:5-40` و `assistant.css` | semantic state token کامل نیست و فایل‌ها رنگ خودشان را تعریف می‌کنند | ناهماهنگی، هزینه نگهداری و احتمال contrast regression بالا می‌رود | tokenهای semantic برای surface/text/border/focus/success/warning/error/info و stateهای hover/pressed/disabled تعریف شود |
| MP-14 | P2 | `KpiDashboard.css:3-5, 150-220, 239-274` | KPIها به مجموعه‌ای از card، badge و متن 0.68–0.82rem تبدیل شده‌اند؛ target و benchmark نقطه مقایسه واضح ندارند | داده‌ها تزئینی‌تر از تصمیم‌ساز دیده می‌شوند و scan سخت است | ساختار compact metric row/bullet-comparison؛ target و benchmark در یک محور بصری، value متنی همیشه حاضر و formula در لایه ثانویه |
| MP-17 | P3 | `MarketingPlanPreview.css:244-250, 827-830` | side-tab border سه‌پیکسلی برای highlight | نشانه‌ای عمومی و بدون معنای داده‌ای است | از tint کامل بسیار ملایم، icon/label معنایی یا weight استفاده کنید؛ side stripe حذف شود |

## 7. RTL and Persian Typography Problems

| ID | شدت | محل دقیق | علت | اثر | اصلاح پیشنهادی |
|---|---|---|---|---|---|
| MP-16 | P2 | `index.css:22, 26-28` و font-sizeهای `CourseAlignment.css:53-56`، `KpiDashboard.css:150-220`، `assistant.css:222-233, 442-550` | Segoe UI انتخاب اصلی فارسی است و metadata تا 0.64rem پایین می‌آید | شکل حروف فارسی، baseline mixed text و خوانایی KPI/assistant حرفه‌ای نیست؛ متن‌های 10–12px در موبایل ضعیف‌اند | یک خانواده واحد Vazirmatn Variable با وزن‌های 400/500/600/700، body حداقل 16px، label حداقل 14px و metadata حداقل 13px؛ `font-display:swap` |
| MP-15 | P2 | KPI و report mixed text در `KpiDashboard.tsx:105-140`، `MarketingPlanPreview.tsx:171-202` | واژه‌ها، فرمول‌ها، اعداد و `$` لاتین در جریان RTL بدون role عددی یکپارچه‌اند | alignment و eye tracking در target/benchmark و جدول‌ها ناپایدار است | `dir="auto"` برای مقادیر آزاد، `direction:ltr; unicode-bidi:isolate` برای formula/valueهای لاتین و `font-variant-numeric:tabular-nums` برای اعداد |
| MP-05 | P1 | `BusinessIntakeForm.css:109-113` و token `--text-light` در `index.css:11` | placeholder `#9aa7b8` روی سفید نسبت 2.44:1 و `#94a3b8` روی سفید 2.56:1 دارد | WCAG AA برای متن عادی شکست می‌خورد و روی نمایشگر کم‌کیفیت خوانایی پایین است | placeholder حداقل به neutral با contrast 4.5:1 ارتقا یابد؛ secondary text و disabled state از هم جدا شوند |
| MP-18 | P3 | `MarketingPlanPreview.css:490-495` | quality bar با `transition: width` و gradient بنفش/فیروزه‌ای است | حرکت layout محور و زبان بصری generic ایجاد می‌کند | مقدار نهایی بدون animation width یا با transform scaleX و origin منطقی RTL؛ در reduced motion بدون حرکت |

## 8. Mobile and Responsive Problems

| ID | شدت | محل دقیق | علت | اثر | اصلاح پیشنهادی |
|---|---|---|---|---|---|
| MP-07 | P1 | `assistant.css:581-615` | fixed launcher و panel فضای محتوای scroll را در نظر نمی‌گیرند | در screenshot واقعی 390px، launcher روی workflow، عنوان فرم، متن report و input KPI افتاد | `padding-block-end` سراسری متناسب با launcher/safe-area؛ sheet موبایل با header ثابت و focus return |
| MP-06 | P1 | `BusinessIntakeForm.css:161-190`، `KpiDashboard.css:37-49, 92-115, 198-220, 246-261`، `MarketingPlanPreview.css:105-118` | chipها، reset، checkbox visual 18px، KPI inputs و export pills در چند محل زیر target 44×44 هستند | خطای لمس و دشواری استفاده با یک دست | hit area حداقل 44px بدون بزرگ‌کردن نمای ظاهری؛ فاصله حداقل 8px؛ input mobile حداقل 44px |
| MP-08 | P2 | رندر موبایل بخش‌های پیش‌فرم | desktop-first spacing روی بخش‌های کم‌اهمیت در mobile هم حفظ شده است | time-to-task بالا و fatigue قبل از فرم | gutters 16px، section spacing 32/48، compact timeline و حذف shadowهای غیرضروری؛ ترتیب محتوا ثابت |
| MP-12 | P2 | report mobile در `MarketingPlanPreview.css:545-599` | gridها تک‌ستونه می‌شوند اما همه ۱۷ body طولانی هم‌زمان باز و داخل یک card هستند | scroll بسیار طولانی و launcher مزاحم؛ بازگشت به بخش‌ها دشوار | typography و chapter headers sticky محدود، `scroll-margin-top`، فاصله فصل‌ها و render containment؛ محتوای هیچ فصل حذف یا خلاصه نشود |

## 9. Accessibility Problems

| ID | شدت | محل دقیق | علت | اثر/استاندارد | اصلاح پیشنهادی |
|---|---|---|---|---|---|
| MP-01 | P1 | selectها در `BusinessIntakeForm.tsx:190-224, 283-304, 398-407, 429-438` | `<label>` فاقد `htmlFor` و select فاقد `id` است؛ DOM snapshot comboboxها را بدون نام نشان داد | WCAG 1.3.1 و 4.1.2؛ screen reader نوع/هدف فیلد را نمی‌داند | id پایدار + label association؛ متن label بدون تغییر |
| MP-02 | P1 | `BusinessIntakeForm.css:188-190` | checkbox کانال با `display:none` حذف شده و focus indicator جایگزین ندارد | WCAG 2.1.1 و 2.4.7؛ گزینه‌ها با keyboard قابل انتخاب نیستند | visually-hidden قابل focus، `:focus-visible` روی chip، checked state قابل تشخیص با رنگ+علامت |
| MP-03 | P1 | `BusinessIntakeForm.tsx:163-186, 245-268, 313-336, 415-425` و `useBusinessForm.ts:93-109` | error span id ندارد؛ input `aria-invalid/aria-describedby` ندارد؛ submit focus را به اولین invalid field نمی‌برد | WCAG 3.3.1، 3.3.3 و 4.1.3؛ کاربر keyboard/screen reader علت شکست را پیدا نمی‌کند | error id پایدار، association، summary غیرمزاحم و focus روی اولین invalid field؛ پیام‌ها بدون تغییر |
| MP-04 | P1 | `ClarifyingQuestionsPanel.tsx:185-200, 213-269` | سؤال به‌صورت heading است اما select/input/textarea label programmatic ندارند؛ invalid state به control وصل نیست | WCAG 1.3.1 و 3.3.1 | id از question.id، `aria-labelledby` به متن سؤال، fieldset/legend برای multiChoice و `aria-describedby` برای why/error |
| MP-05 | P1 | contrastهای ذکرشده در بخش 7 | muted و placeholder بیش از حد روشن | WCAG 1.4.3 | neutral ramp جدید و تست pairهای واقعی |
| MP-06 | P1 | controlهای ذکرشده در بخش 8 | hit area کوچک | WCAG 2.5.8 و guidance 44px | hit box 44px و فاصله 8px |
| MP-07 | P1 | `MarketingAssistant.tsx:20-45`، `AssistantPanel.tsx:26-44` | focus ورودی در open انجام می‌شود، اما return focus و separation موبایل کامل نیست | WCAG 2.4.3 و 1.4.10 | ref launcher، بازگرداندن focus، semantics متناسب با sheet/nonmodal و عدم پوشاندن محتوا |

نکات مثبت accessibility: close/send آیکونی aria-label دارند، assistant error از `role=alert` استفاده می‌کند، statusها live هستند، accordion `aria-expanded` دارد و reduced-motion در دو سطح اصلی پیاده شده است.

## 10. Form Experience Audit

فرم از نظر ترتیب منطقی، گروه‌بندی پنج‌گانه، draft و نمونه آزمایشی پایه خوبی دارد. مسئله اصلی آن «فرم بلند» بودن نیست؛ مسئله این است که progress از محتوای هر گروه جداست و پنج کارت بزرگ با وزن برابر، حس یک worksheet طولانی را تشدید می‌کنند.

پیشنهاد visual، بدون تغییر ترتیب یا سؤال:

- دسکتاپ: grid دو ناحیه‌ای؛ سمت راست یک rail باریک و sticky شامل همان پنج عنوان و progress موجود، سمت چپ تمام sectionها با ترتیب فعلی. rail صرفاً وضعیت بصری را منعکس کند.
- هر section به‌جای کارت shadowدار، یک فصل با عنوان قوی، explanation و field groupهای روی surface ساده باشد.
- rowهای دو ستونه فقط برای فیلدهای کوتاه حفظ شوند؛ textareaها تمام عرض و با measure خوانا باشند.
- choice chipها حداقل 44px hit area، focus ring و checked mark داشته باشند؛ رنگ تنها indicator نباشد.
- actions در دسکتاپ به یک action bar کم‌ارتفاع با primary واضح و secondary/ghost تفکیک شوند؛ در موبایل stack فعلی حفظ ولی فاصله launcher رزرو شود.
- validation presentation به field مرتبط شود؛ هیچ متن error یا rule validation تغییر نکند.

ریشه‌های مرتبط: MP-01، MP-02، MP-03، MP-05، MP-06 و MP-08.

## 11. Marketing Plan Output Audit

قوت اصلی محصول همین خروجی ساختاریافته است، اما presentation فعلی ارزش آن را کمتر از واقع نشان می‌دهد. یک card سفید 940px با ۱۷ divider متوالی، report را به accordion list تبدیل کرده است.

اصلاح visual پیشنهادی:

- report از «یک کارت» به «document canvas» تبدیل شود: header گزارش، summary، فصل‌ها و بخش سنجش در یک سطح با whitespace و ruleهای روشن.
- شماره و عنوان فصل در ستون راست و body در ستون اصلی قرار گیرد؛ در mobile بالای body stack شود. ترتیب ۱ تا ۱۷ ثابت می‌ماند.
- سه خانواده فقط با typography و spacing متمایز شوند: فصل‌های ۱–۹ شناخت و جایگاه، ۱۰–۱۳ استراتژی و کانال، ۱۴–۱۷ سنجش و اجرا. هیچ عنوان/محتوا جابه‌جا یا بازنویسی نشود.
- body prose حداکثر 68ch، line-height حدود 1.9 و paragraph spacing واقعی داشته باشد.
- جداول 7P و funnel در desktop grid باقی بمانند و در mobile به key/value rows تبدیل شوند؛ همان داده و ترتیب حفظ شود.
- stale، success و quality از semantic state tokens استفاده کنند، نه palette جداگانه.
- `content-visibility:auto` و `contain-intrinsic-size` برای فصل‌های پایین، رندر اولیه متن بلند را سبک می‌کند و bundle را تغییر نمی‌دهد.

ریشه‌های مرتبط: MP-10، MP-12، MP-13، MP-15، MP-17 و MP-18.

## 12. Assistant UI Audit

دستیار از نظر empty state، suggestions، loading، error/retry، character limit و keyboard shortcut کامل است. ضعف اصلی visual/placement است:

- sparkle و بنفش gradient آن را از «همکار استراتژیک» به «chatbot عمومی» تبدیل کرده است.
- launcher در موبایل محتوای اصلی را می‌پوشاند.
- panel موبایل تقریباً fullscreen است، اما separation پس‌زمینه و focus lifecycle با این حضور بصری هماهنگ نیست.
- bubbleهای کارت‌مانند و سایه‌دار درون panel، nesting را زیاد می‌کنند.

در جهت پیشنهادی، launcher یک control کوچک petrol با icon مرتبط با گفت‌وگو/تصمیم است؛ panel در desktop به یک side sheet 400px روی سمت inline-start و در mobile به sheet edge-to-edge با header/focus روشن تبدیل می‌شود. پیام assistant روی surface ساده و پیام user با tint محدود نمایش داده شود. متن‌ها، suggestions، ارسال، retry، clear و context logic کاملاً ثابت می‌مانند.

## 13. State Design Audit

| State موجود | وضعیت فعلی | جهت visual پیشنهادی |
|---|---|---|
| Idle | فرم و launcher بدون راهنمای state | progress rail خنثی؛ primary action فقط در action bar |
| Reviewing / Generating | shimmer + sparkle + bouncing dots | status strip با progress pulse کوتاه و متن موجود؛ بدون sparkle و بدون shimmer تمام‌سطحی |
| Awaiting clarification | panel card + score card + question cards | diagnostic canvas با score badge کوچک، question groups با border/rule و focus واضح |
| Internal-only | orange card مستقل | warning semantic token با icon و label؛ همان پیام |
| AI enhanced | green card | success semantic token، بدون shadow |
| Partially enhanced | blue card | info semantic token با توضیح موجود |
| Stale output | yellow banner | warning bar در report header با contrast AA |
| Copy success | تغییر label button | label فعلی + state color کوتاه؛ aria-live در implementation phase بررسی شود |
| PDF busy | disabled + label | spinner کوچک CSS در خود button و width ثابت برای جلوگیری از jump |
| Assistant empty | icon/card/suggestions | فضای آرام با suggestion rows، نه کارت‌های متعدد |
| Assistant loading | سه dot دائمی | dot pulse محدود فقط در زمان request؛ reduced-motion = نشانگر ثابت |
| Assistant error/retry | alert card | error surface با retry 44px و focus قابل مشاهده |
| Disabled | opacity عمومی | semantic disabled text/surface/border؛ contrast و cursor ثابت |
| Focus/Hover/Pressed | در بعضی componentها ناقص | state matrix یکپارچه برای تمام controlها |

## 14. Three Design Directions

### Direction A — Growth Command Map / نقشه فرمان رشد

1. **ایده مرکزی و داستان بصری:** محصول مانند یک نقشه تصمیم‌گیری عمل می‌کند؛ هر ورودی به یک تصمیم و هر تصمیم به KPI وصل است.
2. **شخصیت برند:** دقیق، آرام، اجرایی، قابل اعتماد و در عین حال دارای انرژی بازاریابی.
3. **Hero:** چیدمان نامتقارن RTL؛ wordmark و متن در ستون راست، «مسیر سیگنال» ساخته‌شده از همان مراحل فعلی در ستون چپ/پایین؛ بدون illustration سنگین.
4. **فرم:** chapter rail سمت راست + worksheet سمت چپ؛ sectionهای بدون shadow و field groups واضح.
5. **خروجی:** document canvas با شماره فصل در راست، متن در measure محدود و تفاوت visual میان شناخت/استراتژی/اجرا.
6. **KPI و داده:** metric rows و bullet-comparison سبک با target/benchmark متنی؛ بدون library chart.
7. **پنل دستیار:** strategy side sheet با launcher کم‌حجم و placement امن.
8. **رنگ:** petrol `#0E5E5A`، ink `#102A2A`، off-white خنثی `#F4F7F6`، signal orange `#D66A3A` فقط برای نقاط تصمیم.
9. **تایپوگرافی:** Vazirmatn Variable برای فارسی و لاتین UI؛ system monospace فقط برای formula؛ tabular numbers.
10. **spacing/layout:** پایه 4px؛ container 1200، report 960، prose 68ch؛ section rhythm 32/48/72.
11. **آیکون:** SVG outline با stroke 1.75px و گوشه‌های کنترل‌شده؛ icon فقط برای action/state.
12. **motion:** state-driven، 140–220ms، CSS transform/opacity؛ هیچ loop جز هنگام loading.
13. **موبایل:** timeline فشرده، rail به progress header تبدیل می‌شود، report یک ستون و assistant sheet امن.
14. **پیچیدگی:** متوسط.
15. **مزایا/محدودیت‌ها:** بهترین تعادل هویت، وضوح و اجرا؛ نیازمند هماهنگ‌سازی چند CSS module ولی بدون بازنویسی React logic.

**ویژگی امضادار:** **Decision Thread** — یک خط سیر با nodeهای محدود که workflow، progress فرم و chapterهای report را با معنای واقعی «ورودی → تحلیل → برنامه → سنجش» پیوند می‌دهد. این خط grid تزئینی یا side stripe کارت نیست.

**بودجه اجرا:** bundle تقریباً بدون تغییر؛ dependency جدید ندارد؛ اثر موبایل مثبت به‌دلیل حذف shadow/glow و containment؛ regression متوسط و قابل کنترل؛ کاملاً مرحله‌ای.

### Direction B — Strategy Editorial / گزارش استراتژی سردبیری

1. **ایده مرکزی و داستان بصری:** خروجی مانند یک brief حرفه‌ای و قابل ارائه به مدیر/مشتری دیده می‌شود؛ typography و composition نقش اصلی دارند.
2. **شخصیت برند:** متفکر، معتبر، premium و کم‌صدا.
3. **Hero:** مانند cover یک report؛ wordmark بزرگ solid، متن‌ها روی grid نامتقارن و یک rule قوی.
4. **فرم:** شبیه worksheet چاپی دیجیتال با labelهای محکم، خطوط ساده و فصل‌های typographic.
5. **خروجی:** ستون اصلی خوانا، chapter openings واضح، tableهای sober و استفاده حداقلی از card.
6. **KPI و داده:** scorecardهای خطی و جدول مقایسه‌ای، با تأکید روی عدد و تفسیر نه chart.
7. **پنل دستیار:** margin-note/side-note visual در desktop و sheet ساده در mobile.
8. **رنگ:** graphite `#171918`، neutral `#F7F7F5`، oxblood `#7A3140` و saffron `#B87400` فقط برای signal/data.
9. **تایپوگرافی:** Vazirmatn Variable؛ وزن 700 برای فصل‌ها، 400 برای متن؛ no display font دوم.
10. **spacing/layout:** grid دوازده‌ستونه، whitespace بیشتر، prose 64–68ch، borderهای افقی واضح.
11. **آیکون:** بسیار محدود؛ text-first، iconهای 18/20px فقط در export/state.
12. **motion:** کمترین میزان؛ crossfade 160ms و focus/press feedback.
13. **موبایل:** cover کوچک، فصل‌ها با rule، جداول key/value و toolbar export دو ردیفه.
14. **پیچیدگی:** کم تا متوسط.
15. **مزایا/محدودیت‌ها:** بهترین خوانایی گزارش و print-friendly؛ ممکن است فرم برای برخی کاربران کمتر «نرم» یا playful به‌نظر برسد.

**ویژگی امضادار:** **Chapter Ledger** — شماره فصل، عنوان و summary visual در یک ledger راست‌محور که report دیجیتال و نسخه چاپی را هم‌زبان می‌کند.

**بودجه اجرا:** bundle بدون تغییر؛ dependency ندارد؛ performance موبایل عالی؛ regression کم تا متوسط؛ مرحله‌ای و مناسب شروع سریع.

### Direction C — Market Signal Room / اتاق سیگنال بازار

1. **ایده مرکزی و داستان بصری:** فضای یک اتاق فرمان آرام برای دیدن وضعیت بازار، کانال‌ها و KPIها؛ نه terminal و نه dashboard مالی کلیشه‌ای.
2. **شخصیت برند:** فنی، سریع، confident و data-dense.
3. **Hero:** compact dark header با signal bands ساخته‌شده از مراحل واقعی و بدون animation دائمی.
4. **فرم:** dark surface با field groups روشن، progress rail و contrast دقیق.
5. **خروجی:** desktop دو ناحیه‌ای با chapter rail و report surface روشن‌تر؛ mobile تک‌ستونه.
6. **KPI و داده:** dense rows، benchmark markers و semantic signal colors.
7. **پنل دستیار:** command drawer هم‌زبان با محیط و بدون bubbleهای سنگین.
8. **رنگ:** blue-black `#0B1418`، surface `#121F24`، mint `#33C7A7`، amber `#E1A43A` و off-white `#EAF2F0`.
9. **تایپوگرافی:** Vazirmatn؛ data و formula با monospace system؛ اعداد tabular.
10. **spacing/layout:** density بیشتر؛ 8/12/16/24/32، container 1280 و report 980.
11. **آیکون:** outline هندسی با stroke ثابت و signal dots فقط برای status.
12. **motion:** کوتاه 120–180ms؛ no glow loop، no scanning animation.
13. **موبایل:** dark surfaces با کنتراست جداگانه، bottom sheet و KPI rowهای stack شده.
14. **پیچیدگی:** زیاد نسبت به دو گزینه دیگر، چون همه stateها و print باید برای dark system بازبینی شوند.
15. **مزایا/محدودیت‌ها:** متمایز و مناسب data-heavy usage؛ ریسک regression و خستگی در گزارش بلند بالاتر است.

**ویژگی امضادار:** **Signal Bands** — نوارهای باریک وضعیت برای فصل‌های واقعی funnel/KPI که فقط هنگام وجود داده معنا دارند؛ نه grid background و نه radar تزئینی.

**بودجه اجرا:** CSS bundle کمی بزرگ‌تر ولی JS بدون تغییر؛ dependency ندارد؛ mobile performance خوب در صورت حذف shadow/filter؛ regression متوسط تا زیاد؛ فقط به‌صورت مرحله‌ای توصیه می‌شود. نسخه سبک‌تر: dark فقط برای Hero و KPI header، document body روشن باقی بماند.

### مقایسه سریع

| معیار | Growth Command Map | Strategy Editorial | Market Signal Room |
|---|---|---|---|
| تمایز برند | زیاد | زیاد | بسیار زیاد |
| خوانایی فرم/گزارش | بسیار زیاد | بسیار زیاد | متوسط تا زیاد |
| تناسب با MarketPilot | **بسیار زیاد** | زیاد | زیاد |
| complexity | متوسط | کم تا متوسط | زیاد |
| dependency جدید | ندارد | ندارد | ندارد |
| اثر bundle | ناچیز | ناچیز | فقط CSS بیشتر |
| mobile performance | مثبت | بسیار مثبت | خنثی تا مثبت |
| regression risk | متوسط | کم تا متوسط | متوسط تا زیاد |
| اجرای مرحله‌ای | عالی | عالی | ضروری |

## 15. Recommended Direction

**Growth Command Map / نقشه فرمان رشد** جهت اصلی است.

دلایل انتخاب:

- داستان بصری آن مستقیماً از ماهیت محصول می‌آید: تبدیل داده خام به تصمیم و KPI.
- از کلیشه purple AI و کارت‌های تکراری فاصله می‌گیرد، بدون آنکه affordanceهای آشنا را قربانی کند.
- RTL در آن ساختاری است: rail، شماره فصل، direction حرکت و محل assistant از inline axis تبعیت می‌کنند.
- برای فرم بلند و report بلند دو الگوی مرتبط اما متفاوت فراهم می‌کند؛ یک design system واحد، نه یک template تکرارشونده.
- همه قابلیت‌ها، ترتیب سؤال‌ها و محتوای ۱۷ بخش حفظ می‌شوند.
- با CSS فعلی و component structure موجود قابل اجراست و به chart/motion/UI dependency نیاز ندارد.
- می‌توان ابتدا token و accessibility، سپس Hero/form، report/KPI و در پایان assistant/motion را اجرا کرد.

درجه complexity نهایی: **متوسط**. برآورد bundle: **JS production بدون افزایش**؛ CSS احتمالاً چند KB جابه‌جایی/افزایش و یک font variable subset حدود ده‌ها KB با `font-display:swap`. regression risk با phase و screenshot matrix قابل کنترل است.

## 16. Proposed Design Tokens

### Color tokens — Direction A

| Token | مقدار | کاربرد |
|---|---|---|
| `--mp-bg` | `#F4F7F6` | زمینه کل صفحه |
| `--mp-surface` | `#FFFFFF` | فرم، report و sheet |
| `--mp-surface-subtle` | `#EAF0EE` | state/row ثانویه |
| `--mp-ink` | `#102A2A` | heading و متن اصلی |
| `--mp-text` | `#243E3E` | body |
| `--mp-muted` | `#526D6B` | metadata با contrast قابل آزمون |
| `--mp-line` | `#CBD8D5` | divider/border |
| `--mp-primary` | `#0E5E5A` | primary action، selection و focus |
| `--mp-primary-hover` | `#0A4845` | hover/pressed |
| `--mp-accent` | `#D66A3A` | node/insight محدود؛ نه body text روی سفید |
| `--mp-success` | `#147D5A` | success |
| `--mp-warning` | `#8A5A00` | warning |
| `--mp-danger` | `#B42318` | error |
| `--mp-info` | `#285F9E` | info/partial AI |
| `--mp-focus` | `#167B76` | focus ring 3px |

### Type tokens

- `--font-ui: "Vazirmatn", "Segoe UI", Tahoma, sans-serif`
- `--font-data: ui-monospace, "Cascadia Mono", Consolas, monospace`
- اندازه‌ها: `13, 14, 16, 18, 22, 28, 36, 48px`; body موبایل و دسکتاپ 16px.
- line-height: label 1.55، body 1.8، long report 1.9، heading 1.35–1.55.
- وزن‌ها: 400 body، 500 label، 600 action/section، 700 major heading. استفاده از 800 فقط برای wordmark مجاز است.
- اعداد: `font-variant-numeric: tabular-nums`; formulaها LTR-isolated.

### Space, shape and elevation

- spacing: `4, 8, 12, 16, 24, 32, 48, 64, 80px`.
- radius: input 8px، surface 12px، sheet 16px، pill فقط tag و compact control.
- border: یک‌پیکسل solid line؛ card نباید هم‌زمان border و wide shadow داشته باشد.
- elevation: base بدون shadow؛ floating sheet فقط `0 8px 24px rgba(16,42,42,.14)`؛ button shadow حذف.
- containers: page 1200px، document 960px، prose 68ch؛ gutters 16/24/32px.
- z-index: base 0، sticky 20، assistant launcher 40، sheet/scrim 60، toast 80، tooltip 100.

## 17. Proposed Component System

این سیستم نام‌های implementation پیشنهادی است و به معنی تغییر logic نیست:

| Component visual | مسئولیت | stateهای لازم |
|---|---|---|
| `ProductHero` | هویت، title و متن‌های فعلی | default/mobile |
| `DecisionThread` | نمایش همان workflow/progress با nodeهای معنادار | current/completed/upcoming |
| `AnalysisMap` | نمایش compact چارچوب تحلیلی موجود | default/mobile |
| `GuidedIntakeShell` | rail + content فرم | idle/progress/loading |
| `FieldGroup` | عنوان، توضیح و fieldهای یک بخش | complete/incomplete/error |
| `FormControl` | input/textarea/select wrapper | default/hover/focus/filled/error/disabled |
| `ChoiceChip` | channel/multiChoice | unchecked/checked/focus/disabled |
| `ActionBar` | sample/reset/generate یا export | primary/secondary/ghost/loading/disabled |
| `StatusStrip` | AI/fallback/stale/status | info/success/warning/error/loading |
| `ReportCanvas` | header و ۱۷ فصل | default/stale/print |
| `ReportSection` | accordion visual موجود | open/closed/focus |
| `MetricRow` | KPI target/benchmark/formula | enabled/disabled/edited/focus |
| `AssistantLauncher` | بازکردن دستیار بدون overlap | default/hover/focus |
| `AssistantSheet` | گفت‌وگو و composer | empty/loading/error/over-limit/mobile |

قانون سیستم: هیچ component جدید نباید داده را normalize، reorder یا summarize کند؛ فقط props و state موجود را presentation می‌دهد.

## 18. Motion Strategy

`package.json` شامل `motion` یا `framer-motion` نیست. **پیشنهاد این مرحله: dependency جدید نصب نشود.** نیازهای فعلی با CSS پاسخ داده می‌شوند.

| سطح | trigger | property | زمان/easing | CSS یا Motion | reduced motion |
|---|---|---|---|---|---|
| Button/chip | hover/press/focus | color، border، opacity، translateY حداکثر 1px | 120–160ms، ease-out | CSS | بدون translate، state فوری |
| Form field | focus/error/filled | border-color، ring، background | 140ms | CSS | فوری |
| Accordion | open/close | opacity و grid-row در صورت wrapper مناسب | 180–220ms | CSS؛ بدون نیاز به package | body فوری show/hide |
| Output entry | تولید موفق | opacity + translateY 8px فقط روی report header | 220ms | CSS | opacity-only یا فوری |
| Loading | request active | dot opacity/pulse محدود | 900–1200ms loop فقط هنگام loading | CSS | indicator ثابت + status text |
| Assistant open | launcher → sheet | opacity + translateY/inline 8px | 180–220ms | CSS | فوری |
| Assistant close | sheet → launcher | exit ساده | CSS در ساختار فعلی exit واقعی ندارد | فوری |
| KPI edit | value changed | background tint کوتاه | 160ms | CSS | فوری |

Motion فقط وقتی توجیه دارد که در آینده exit transition دستیار، حضور/خروج conditional node یا layout continuity پیچیده تأیید شود. در آن صورت `AnimatePresence` می‌تواند مفید باشد، اما افزودن package احتمالاً ده‌ها KB gzip به JS اضافه می‌کند و باید با bundle measurement و approval جداگانه انجام شود. هیچ stagger سراسری، parallax، glow loop، bounce، elastic یا انیمیشن مسیر دائمی پیشنهاد نمی‌شود. جهت حرکت همیشه از semantics و `dir` مشتق شود، نه فرض `x مثبت = forward`.

## 19. Implementation Phases

1. **Foundation and accessibility — کم‌ریسک:** tokenها، Vazirmatn با swap، contrast، focus، label association، checkbox keyboard و touch target. هیچ layout اصلی تغییر نکند.
2. **Hero and pre-form compression — متوسط:** Hero و سه بخش توضیحی با Growth Command Map بازآرایی visual شوند؛ محتوا و ترتیب DOM حفظ شود.
3. **Guided form — متوسط:** progress rail، section treatment، control states و action bar؛ form state/validation untouched.
4. **Report canvas — متوسط:** header/export hierarchy، typography فصل‌ها، tables و long-content containment؛ export/print snapshotها بررسی شوند.
5. **KPI and data — متوسط:** metric row/bullet comparison بدون chart dependency؛ edit/toggle/reset و print table ثابت.
6. **Assistant and state system — متوسط:** placement امن، focus return، sheet mobile، status strip و motion CSS-only.
7. **Hardening — کم تا متوسط:** viewportهای 375/390/768/1024/1440، landscape، 200% zoom، keyboard، screen reader spot-check، reduced motion، print/PDF/Word/Markdown و low-end mobile.

هر phase باید diff کوچک، screenshot قبل/بعد و checklist مستقل داشته باشد. phase بعد فقط پس از تأیید static direction و regression checks شروع شود.

## 20. Risks and Regression Guardrails

### Guardrails

- schema، prompt، AI adapter، fallback، Netlify Functions و API callها خارج از scope و ممنوع از تغییرند.
- نام، ترتیب، required بودن و validation سؤال‌ها باید با snapshot/fixture فعلی مقایسه شود.
- ترتیب ۱۷ بخش report، متن‌ها، KPIها، action plan و riskها ثابت بماند.
- sample/reset/generate، clarification، stale detection، assistant context و retry باید بدون تغییر رفتار کار کنند.
- PDF، Word، Markdown، copy و print قبل/بعد regression test شوند؛ print CSS به‌طور مستقل بررسی شود.
- هیچ production dependency بدون bundle diff و approval اضافه نشود.
- font باید subset و `font-display:swap` داشته باشد؛ CLS و FOIT کنترل شود.
- contrast pairها با متن واقعی، placeholder، disabled، focus و semantic states بررسی شوند.
- launcher/sheet نباید در 375px، landscape یا safe-area هیچ control یا متن را بپوشاند.
- focus order از ترتیب DOM پیروی کند؛ visual reorder نباید reading order را مختل کند.
- reduced motion باید translation/loop غیرضروری را حذف کند، نه فقط duration را کوتاه کند.
- card nesting، gradient text، glassmorphism، side-tab accent، decorative grid، wide ghost shadow و border-radius بالای 16px برای surfaceها ممنوع بماند.
- performance budget: JS production بدون افزایش در Direction A/B؛ CSS و font با measurement؛ از filter/backdrop/WebGL/canvas/video پرهیز شود.
- `content-visibility:auto` فقط با `contain-intrinsic-size` آزموده شود تا jump ایجاد نکند.

### ریسک‌های اصلی

| ریسک | احتمال/اثر | کنترل |
|---|---|---|
| بازآرایی visual باعث تغییر order keyboard شود | متوسط/زیاد | DOM order ثابت، CSS grid placement محدود و keyboard walkthrough |
| font فارسی باعث CLS یا bundle رشد کند | متوسط/متوسط | variable subset، preload فقط وزن بحرانی، swap و fallback metric نزدیک |
| report redesign چاپ/export را خراب کند | متوسط/زیاد | print fixture، page-break review و عدم دستکاری export serializer |
| dark direction contrast و print را پیچیده کند | زیاد/متوسط | Direction C فقط پس از prototype؛ Direction A پیش‌فرض |
| motion روی low-end mobile jank ایجاد کند | کم/متوسط | CSS transform/opacity، no layout/filter animation، reduced motion |
| hard-coded colorها باقی بمانند | زیاد/متوسط | token migration checklist و search برای hexهای component-level |

### Out-of-scope content observations

موارد زیر فقط مشاهده شده‌اند و **نباید در این بازطراحی بصری اجرا یا وارد backlog پیاده‌سازی شوند**:

- متن فارسی با واژه‌های لاتین مانند `Lead`، `Influencer Marketing`، `Freemium`، فرمول‌ها و واحدهای دلار ترکیب شده است؛ بررسی واژگان و شیوه‌نامه محتوا خارج از scope است.
- برخی paragraphهای output بسیار بلند یا شامل نشانه‌گذاری ناهمگون‌اند؛ کوتاه‌سازی، بازنویسی یا خلاصه‌سازی ممنوع است و فقط measure/line-height/spacing اصلاح می‌شود.
- تکرار توضیح روند در چند بخش ممکن است از منظر content strategy قابل بررسی باشد، اما در این مرحله هیچ متن یا بخش حذف یا جابه‌جا نمی‌شود؛ فقط presentation فشرده‌تر خواهد شد.

---

این سند یک برنامه تحلیل و جهت‌گیری است؛ هیچ تغییر implementation، dependency، build، deploy، commit یا push بخشی از آن نیست.
