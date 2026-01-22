"use client";
import TiltedCard from "./TiltedCard";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";

export default function TeamMentors() {
  const { sectionVariant, fadeInUp, staggerContainer, cardVariant } =
    useMotionPref();
  return (
    <motion.section
      variants={sectionVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-10 mb-20 shadow-lg border border-white/20"
    >
      <motion.h2
        variants={fadeInUp}
        className="text-4xl font-bold-custom text-gray-900 text-center mb-10"
      >
        Meet the Team &amp; Mentors
      </motion.h2>
      <motion.div
        variants={staggerContainer}
        className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <div className="h-full">
          <TiltedCard
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="auto"
            imageWidth="auto"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={false}
          >
            <div className="bg-gray-900/80 rounded-2xl p-6 text-center shadow-md border border-white/10 h-full">
              <img
                alt="Team Lead"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-violet-300 shadow-md"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGzDYBx3jK9chdvMWvCsccfXLkJJvU3dT_sjwyT2gdn9o0kRJ4E2ZYF-17A8TLalTF6YQmUjpxlvt43S-Ad5Rfd-UrWbsXS6Fc31TrGPNAjE_hJLhv-sRLWiS32fARyk0m2VWH03WJFf_bsm-xMx62AIA9hTa358qwy9Sjydwt9oR3haf2JZ4ESfEaV3ti_qr3dZpcB9RskVoIvVb4TUJ_fUVajEMRum6cc6g6f-yjmKF8xEnkT6sp53KWowORLe4aisVgD0wwyuA"
              />
              <h3 className="font-bold-custom text-lg text-white">Alex Chen</h3>
              <p className="font-thin-custom text-violet-600 mb-3">
                Program Lead
              </p>
              <p className="font-thin-custom text-gray-300 text-sm mb-3">
                Leading strategic direction and partnerships. Ex-Google,
                open-source enthusiast.
              </p>
              <div className="flex justify-center space-x-3 text-gray-400">
                <a className="hover:text-violet-700 transition-colors" href="#">
                  <img
                    alt="LinkedIn"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsFR2D3zRZnqC_Zx6kKZakpsSwiu7npCOj2SdeyezV5AiNouLBL8711WuZdg0gcs6TZXkJIssouDrhF8QfJqRjfmnJ7uYd9iCfZT5kko3b16yeVW-BGOKf9h4ZkWgCQ68I8GP_75k-P8JTPGIRcYxbZABnJRCMM6S8jbXg5cRKl-folTM8hNG9Qfh7a0pLDc6O0yRkWz69WgArrgTb9hKFJ9YQ6iJ9l5oufSLj4nFeyLGH5irUdVMosImbDpPBJ0ooL7OY-fSlNCE"
                  />
                </a>
                <a className="hover:text-violet-700 transition-colors" href="#">
                  <img
                    alt="GitHub"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB_sJ7DQBpLPpUNebEqXZYUIYnRKW_3Jhs7zDeKo5pgNXnvN3RnkIQN98Fd536NcPqM03WNHuWraRJ6ejGC2B2hAAQXtaCEuyI-1C25dffJK--e0hIO8GKQZHHVm5-WMk_ASjrPnJ1ijvDVBcYdHqA-6oOHXWLv2FXGPBr2YqS_qx4lhUrBtxdt2mPAfsQDi-exdEYG8lxu42B9aMaeWyHuy-QczCNDsEfSqqg9aKIuR5xPQDBH2InZPySMeuHBiuDPFKkYIpUGS4"
                  />
                </a>
                <a className="hover:text-violet-700 transition-colors" href="#">
                  <img
                    alt="Twitter"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuACWtIHXWdBdqqgF2Ml4D1cm_onIvY2gvZBoyaE92rdak70Vq0l0Cm-Xbnj7a-VSxIDaXFPSxVkoMOyLFBYKJRm8IZFM1sv19Q8SAZ5iz2wLYxn-ZKX0ZBJxFvENAyCkDz4k6BqGNKgAuYNiiz6iRhbJezRCMYFPSkHFEncPThSjMkOtK0y7AkAJBuRTVpmzP5Ki3OLkgfHaPP8cfyrjUxna_vBj5TsfONBSkh-KoyAtmN1_gbZSXKyIO8nPIdeGqulIex_xAcTM0c"
                  />
                </a>
              </div>
            </div>
          </TiltedCard>
        </div>
        <div className="h-full">
          <TiltedCard
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="auto"
            imageWidth="auto"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={false}
          >
            <div className="bg-gray-900/80 rounded-2xl p-6 text-center shadow-md border border-white/10 h-full">
              <img
                alt="Jess Smith"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-300 shadow-md"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4ZI6stTlknYRV-lgaRIjWsUsX6Z-HCtzD0wNiitENdqZHWR0Pz2VmlmH2-2370EGrvBJ-BvzjExjtj0m7CCrkkHjsAHpd0OxLIFxniXHdz0iL_FzZGPBNDJ2czE9fEiak8WwrV9IyRUCvEzHPChW52XRH1O3_qvCUK7O4ULDRFsapz1QLmgLo8EhYIPtR8YW2v_KrYJUvTC-Ae-HEfD8Mp6W2FY7sb2zH77ym486tBsD1mCJ7ExiTZm1NhdIUF0R_BLMIfG62efQ"
              />
              <h3 className="font-bold-custom text-lg text-white">
                Jess Smith
              </h3>
              <p className="font-thin-custom text-blue-600 mb-3">
                Backend Mentor
              </p>
              <p className="font-thin-custom text-gray-300 text-sm mb-3">
                Specializes in Python, Django, and AWS serverless architectures.
                5+ years experience.
              </p>
              <div className="flex justify-center space-x-3 text-gray-400">
                <a className="hover:text-blue-700 transition-colors" href="#">
                  <img
                    alt="LinkedIn"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH6pbPGokfDtHvI95xuA1ZYKQzYEft29-oGIftlvBkv0fxiyCyuch_wwV8s7f0KsEiA0Hehnb2-dlbfCKUtf92yqUF3OlHDAhKeWyeeFkrmlwfZF1PhdZ-_gLZrFZIL6RzAKuGT2k5_JqqqtzgaRIHduA_N4mKXH7-JGCgknGJJbIeiZCrFn9b47ujgYPemrID6_X0S27TeX5B8GMMZhWA45OnvDRCOsN3G1JB0ubQGlQcSFaW2BngDkSBYQ0IG90z5LTc1Ll4Q94"
                  />
                </a>
                <a className="hover:text-blue-700 transition-colors" href="#">
                  <img
                    alt="GitHub"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl2yH0WCt6xzxgB08lFjCy_kP2EHZcuWi3b3cZxvcXvXij8i3nQDoxpVJYxi2yQx90GXgbCeynrc0kDsXEPF8ofhvJ3sUtv6VAvjyMS3rd4NERdQ20N58a8WLQUSSjXkImXqR5Avy23e0K347ro3micPHpFFgJec_23akUyj88ODRuS3iWS9v5qDImTZHTuBdvF2l_k1LctqDthgPNVS1OfEsvf4TyBEg1kl2gQUrGk5w4_eBC-r3HnqIVGFPkwUdFSLxshhdDecI"
                  />
                </a>
                <a className="hover:text-blue-700 transition-colors" href="#">
                  <img
                    alt="Twitter"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6ViQ3GYrCXulmrMT7gGKKDbwv9YCFsNFUbhxljeYklMVq7OSGTToMAvVGeIL3LPDIlaeJ0yFsCmntEpxkwwTkkvIzXFOCyzdkNefGAmStLh1iCwTo9vTa9vNziJ_aJRhGxfGfk_6xF0lgf-pdRwj2qrEf9iMYsduKfIWSmW4sGR1MDaCxvD1pONn98vibuJP35wMgBmW1EA3_JA5tlvM08QE7fvTjPI3hFzDbldFfrEpWxGyo98HO91y2EpPwTpYbGYXzsLapl-M"
                  />
                </a>
              </div>
            </div>
          </TiltedCard>
        </div>
        <div className="h-full">
          <TiltedCard
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="auto"
            imageWidth="auto"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={false}
          >
            <div className="bg-gray-900/80 rounded-2xl p-6 text-center shadow-md border border-white/10 h-full">
              <img
                alt="Jana Shanis"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-pink-300 shadow-md"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_4FrY2EsqF1L2LOLCNtWCrE7IDmpsWGAejEuVqdulyoPcUHLVrlb_2Aux49thA85xIdqUp_3M2oPGGcCTLvxVnpGM3ojk5voR39LLA0Wtc-rPdq0bVMWj23zg9HJNIYaSmmmLPumAHLNDEIQ_mFa821F0oNym3QEnRWo4To3IDyWf4QJ0z0agLtjgEq_v3l-mWaW-3obQyXvxm3Tx4-WjUFxzBfYULQ-Pp6ElYGVDDV0ShmFlYoBXzh_WRjyOnbD1KLLbqwIeHqc"
              />
              <h3 className="font-bold-custom text-lg text-white">
                Jana Shanis
              </h3>
              <p className="font-thin-custom text-pink-600 mb-3">
                Frontend Mentor
              </p>
              <p className="font-thin-custom text-gray-300 text-sm mb-3">
                Expert in React, TypeScript, and modern UI/UX development. Lead
                at a FinTech startup.
              </p>
              <div className="flex justify-center space-x-3 text-gray-400">
                <a className="hover:text-pink-700 transition-colors" href="#">
                  <img
                    alt="LinkedIn"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwkCjU-YTxEQpuady8tiWsG-2o3HowUewFXO4RFH3wzX3I9Km_wPjHlhPdbUeCsiBO5WbgcMfompI1XQ37eK3Zg5gdHy-2WctRIPC4B2QRBTMFyiiSUbRn-oU72WWEUk1eVVttrPvNHr5QtSEJ1thw9k5AQuRTQtLn4vj07X_GQp6wi1L9R8kJesvxGdXr9cRJP4FlFjgRGeOKpBubQW3HYu9oB6nSG3Aym4EiDC9wPyNqv5I90gwsMxNFVQ209Jhvoli_kI2LuNE"
                  />
                </a>
                <a className="hover:text-pink-700 transition-colors" href="#">
                  <img
                    alt="GitHub"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBfke9ELZRvuR-EjAJcEfptZ8C_PA9AiLTrFMBsmXTLXfMpB7ghN6u5YjNu86hbq1Bq73okvnjR2akLLRKagzssL81YPH7vRHPv7kjPZ8Az8r2De78u1mGfVkXIMvSvYSp0lBee7hpbzVfUEjdcbD1828j7Tke7YeW8jcwAna7XDa7e11m7EpKI9cWndwqu7CBmAhc1wowm7glD-dgqe4TN09Fj8YXYw_OMPjSg70oPZfoz9sHoi8yz0yIHwxHKZxJIUtJ4nkYbBQ"
                  />
                </a>
                <a className="hover:text-pink-700 transition-colors" href="#">
                  <img
                    alt="Twitter"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDN68Ukb7zM2Dyw8QIsCpf8_n-fMTBOK2M840ghUzvhtt9VsEE6RTF8MZsWpK9sAKzFSa3pTspUtE5e_PYtl3Q9ZFEeOUrdejgRzf63jSHXoPzMSEY2iaZCIUn_9VQAHG4vVOcJygygb25A1uOBJsYtvF6VgdNypa3rvXMUq8r4ioqWvY_JFAPwV4ri0Aipz60b-j12WFo8wuVnBB3pRkKg_4161tlmNAAZonBvPv0H5vRipwRQziMCPEYAmvsXsNOACVF_cpJBI5I"
                  />
                </a>
              </div>
            </div>
          </TiltedCard>
        </div>
        <div className="h-full">
          <TiltedCard
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="auto"
            imageWidth="auto"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={false}
          >
            <div className="bg-gray-900/80 rounded-2xl p-6 text-center shadow-md border border-white/10 h-full">
              <img
                alt="Ram Martin"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-emerald-300 shadow-md"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzIDt9HpiSXZ91sWdgYvDY9HRMGaYQvJ8IA4FGdyYY_ql7Zq1p2BSu9v4Z3JXzzxWTaSPuAPeihQHEueQanOa85CNY__c7H2CxYnmr6-g3ka8dx8xYGrmgGbUeuDPTkmmD8Ua28xYb7tP-e-Y6QKESlG37va9ZMQhe-OtdEUyaSqi3_vxtRzwm7LOnp4RmjEEf4PdrgzYSxLMZ0Dd_RJQO9CB_s5LTqD0B7mjAcqmRzMydhZ0MObZuusla6We5TzIpXVX1h0hpo3Y"
              />
              <h3 className="font-bold-custom text-lg text-white">
                Ram Martin
              </h3>
              <p className="font-thin-custom text-emerald-600 mb-3">
                DevOps Mentor
              </p>
              <p className="font-thin-custom text-gray-300 text-sm mb-3">
                Specialist in CI/CD, Docker, Kubernetes, and cloud
                infrastructure on Azure.
              </p>
              <div className="flex justify-center space-x-3 text-gray-400">
                <a
                  className="hover:text-emerald-700 transition-colors"
                  href="#"
                >
                  <img
                    alt="LinkedIn"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-bp7B_75wkoxW2k-CMRomAskjJWBCQAlVqrTylWR9OgONV0OQalu9Sc_LSXgLxz6bPSEFnR7jEaTyxWElca9QPmndC2OvJNInICcb9TyOs_4GaPawhnjHElJgsXHEOKrLmuhte4mzEK9yDXrnJ03bNwEMYNIcL-mVcE5tCnEmbt75jXlIO37JfI0AbQVEI4qRpMzpXhyrxX8D5RsN_mk4TuNk_n2YZci-wYmY6Sp-f9k8bnfvXUbYjZTJnbHXFzeziwdPpGZ1mOo"
                  />
                </a>
                <a
                  className="hover:text-emerald-700 transition-colors"
                  href="#"
                >
                  <img
                    alt="GitHub"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAZreyiznB05ejdoTR_cuHbA9HJR7qzp-ffQg1b-wIAseYETd3JccJxrYRuwZANoXQhO0MF9mITTqvugqgWA2juGztChJox6OOXb2K_957m9gs8LgD4EVyDcuUcuO87ij0GMqofxwrAkMf3t3g4rRZpX4JFcBpCHttkUS2z0vtUxG0q5VENWyUci-Lh78-WteMcQ5gzDrSJOJqHX4DYJWpbGaeelxFao-kjVZaXWAW0ouS-A_aMoDsFin-Lt45t1juU-o1E11txaA"
                  />
                </a>
                <a
                  className="hover:text-emerald-700 transition-colors"
                  href="#"
                >
                  <img
                    alt="Twitter"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCReyBhEip9Q-Ra8UsPGo0dMnzY0NBAH2LJc5l_2T0I7GPZZm10KgTr3VfodmFxQ3houjH0YJNsOj4tK3DQY_tI4vg69324CeOWQrcX7b8w48-Rt8alRNVj0A2IUw2Ypm1X6HsOm4rK6yYTE5Z1aM2Ug5F5IFxq95eSHl455Kvlb0yTCnsd7ivyMHud8R7vCIlulMuAGYt-TXJxIJvNZemyLslPzkaeZdY9wXXfVupN9cVp78QXSwhMo0ITTVnCbRnS4T23NVqBbbo"
                  />
                </a>
              </div>
            </div>
          </TiltedCard>
        </div>
        <div className="h-full">
          <TiltedCard
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="auto"
            imageWidth="auto"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={false}
          >
            <div className="bg-gray-900/80 rounded-2xl p-6 text-center shadow-md border border-white/10 h-full">
              <img
                alt="Jamun Name"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-gray-300 shadow-md"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOP1wxtQx-61W9U9dgYIwhtsOTnHmezannKGwCk3Mzyz5yGli-APJPdb6I8KPN8QJaUksaaWDI6sDVu8voRgkg2jHQpklwguuIMu3k5dWtb1f8Yukekr-b1mxxv0PBl4uCoNrQJknw6sk2D7x7ZaFXZPqrhSdkieNZaekFWa2J7TJPS1cuUEGo0OIzmllvfpvMsIZnQGOwjO7HZ-MUUw255rFVz2-V20KjX4a0HRZJ7gzK6CSIJ_6yZcDQ7gbe0d28p8m6XqEiWMk"
              />
              <h3 className="font-bold-custom text-lg text-white">
                Sofia Rodriguez
              </h3>
              <p className="font-thin-custom text-gray-600 mb-3">
                AI/ML Mentor
              </p>
              <p className="font-thin-custom text-gray-300 text-sm mb-3">
                Focuses on machine learning, data science, and TensorFlow.
                Senior researcher.
              </p>
              <div className="flex justify-center space-x-3 text-gray-400">
                <a className="hover:text-gray-700 transition-colors" href="#">
                  <img
                    alt="LinkedIn"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1wniVReum0c6MmEEIXEJTCmLFn8-F7CyiNQxvV_Pb5CzEqbPsmpm7_o6nmhUh_RaDhff10NZjVvMnWE09pIotQxs0SdPoC2giuiRaOJfGxCthhBegqB71crTUwDeAuzrXQD-Bh8iFFTUU8lKB_fZCQEDpKAGOVU1Ji9xnjylgSa92HhrruAu4yp25WkFWukbNDNKlQUNsBmU5_hNJVmJ9X4nlzhkHcWR0gIY78PvPHDtJRJzm2is-fnUgs_AzPPhAUL_OylOKXDw"
                  />
                </a>
                <a className="hover:text-gray-700 transition-colors" href="#">
                  <img
                    alt="GitHub"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZPMQ1f5KJwLg43QkFaTRuT5bRzwYQSI3iOWSft12Sw46qRJ05Jvkl0j8BgKfqUouTHbZW_EW2i_IQaXNXdElXFIjCK1q7YItNReNDrgshRTMe6HioWKsxhjQjR7LoX6jJ0rd_kVTZ5NVUCcjXatfiMwJPD34hf10zkA5E9j6-mAiQTIIlqyVAzvVgx_Y0TEY7L30dnzK1LsQJBH_B6dr3YlYcigUZfJGnE-AuJD3AfhKCvVLpFOqn-H4DqxZB_-P_YeOHAmC8-PQ"
                  />
                </a>
                <a className="hover:text-gray-700 transition-colors" href="#">
                  <img
                    alt="Twitter"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLiUmFF198XcsibLnohQ-vK7cYFHA9La6-Su4M-lX_UjybkmMYUb7p7WxfHJdjES_WNrj1D3R7Y6nv7aId8jF1PqwtrfGzXceFG_Sx7YlzPEU5uxL8zjuykdP4eR5aj4CrrOZMUI8ajL7r0kFxbT_jQvSwgPxLIO9Q_87E-QPAQETzEx2zoZKQ6bIPzXNy_tju4Y3-IkrOc_I6ZnsuyRhd3QMKDOv-_814blB3smsEBQXD4U7MULhsUKIhMAP-dr_R05FMtKTa3tA"
                  />
                </a>
              </div>
            </div>
          </TiltedCard>
        </div>
        <div className="h-full">
          <TiltedCard
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="auto"
            imageWidth="auto"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={false}
          >
            <div className="bg-gray-900/80 rounded-2xl p-6 text-center shadow-md border border-white/10 h-full">
              <img
                alt="Tanna Gamola"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-red-300 shadow-md"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdIbyliUGHcTYpgoSIJ4C4lagsO7pD59Qu1gcqsC76sjV1vYN4VI_YAhUfi8klx4xne6ap_YSYr5LOTiLgloOG6pChEZGZ2Ay2707IsWgY7FpoynbeVcw6DRi-wHAK3V4OtL0wz_4N_78VQHuzJXM1_Jc7_hJmXLeS876ZRAM1BSkRP_v8rOITnD1aBQV2D6NhdhWS2qs1vowzLGzZPb2Xu9770qn6jBZNWlBG7GIhjjBNd-3aYaceAno-VDag9096MpE8xz4lBEI"
              />
              <h3 className="font-bold-custom text-lg text-white">
                Marco Rossi
              </h3>
              <p className="font-thin-custom text-red-600 mb-3">
                Cybersecurity Mentor
              </p>
              <p className="font-thin-custom text-gray-300 text-sm mb-3">
                Specialized in network security, ethical hacking, and blockchain
                vulnerabilities.
              </p>
              <div className="flex justify-center space-x-3 text-gray-400">
                <a className="hover:text-red-700 transition-colors" href="#">
                  <img
                    alt="LinkedIn"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjL-0xNgkOHysLULnHwOGbjNU_VcTLGIhfO1W2UrLW0PRBUELAHgc0qgt_KdQGjA_pVQG2S4HTb2xZcWpjerggJU2fuoztKdCqcDhNcOBFB4N8b9HP1ZG2Zu0Jfy0txabPN9Hn_3ZryV8A_dUikFT4FXrMSGE02G_EJ8YqPVURdDz1LfSm00ILiSJqZVwmekkccOJAQBD9NEOrBiJqOISsbMu29bw3mM-b7a72suSNJP9we2s_P_VSjN3pqZtwaGW3IDxVnIC8Tks"
                  />
                </a>
                <a className="hover:text-red-700 transition-colors" href="#">
                  <img
                    alt="GitHub"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwFnN261RtB5iLp2E_R5-wpT63vwDrIldRZ589uDOWHs9U_vDpooml-WG70My7y-lEIIV01ywNbLS6AVxppIDYdkjuyvXj_6d-Ji2TiRY36fsMnG86SFnp2M98ov8Cz1bbjGBcKONRZeLynSQta9gdQIOTrzS3lJbDu2G4TQZ8jkIE2JditSQMPS0MCKkuUWvg-3_CADAEPKVggkOvlcq3003tEj0nZoaCAB2xaumFTC8lJ5MT4uegbsN-iXy46LC6mQBziimirys"
                  />
                </a>
                <a className="hover:text-red-700 transition-colors" href="#">
                  <img
                    alt="Twitter"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-4U0bhzvRfmf3osNgXn-uXS1CvEBeiP-sio3IRdf21MdyYBvbW5ihvORfCQBFjeZdFilofFr_7ZweNoj1VGESxcB1P0hFIKzCXf7edtCXuNidpGvMRqXqRYXMDhU1xXeqHp62Z_RabrFQmfCau2KB7ccllej3Aa1fwM5vDjokp_veg7ckvYV_-lu79_KuGJ9RU5eQESxNwTRBjoPpUdaJ9_-Doj-ffSENYvEkbrXLi_ZlPXd6ZnKmNju_UwitcczSNNfndwGf7uQ"
                  />
                </a>
              </div>
            </div>
          </TiltedCard>
        </div>
      </motion.div>
    </motion.section>
  );
}
