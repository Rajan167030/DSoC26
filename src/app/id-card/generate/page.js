"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import IDCard from "../../../components/IDCard";
import Toast from "../../../components/Toast";
import html2canvas from "html2canvas";

export default function GenerateIDPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0: Verification, 1: Form, 2: Preview
  const [loading, setLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  const idCardRef = useRef(null);
  const idCardBackRef = useRef(null);
  const [verificationData, setVerificationData] = useState(null);
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [username, setUsername] = useState("");
  const [toast, setToast] = useState(null);

  // Constants
  const REDIRECT_DELAY_MS = 2000; // Time to show error message before redirect

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    githubUsername: "",
    linkedinUrl: "",
    profileUrl: "",
    photo: "",
    useGithubPhoto: true,
    idNumber: ""
  });

  const [cardData, setCardData] = useState(null);

  // Auto-fetch GitHub photo when username changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.githubUsername && formData.useGithubPhoto) {
        fetchGitHubPhoto(formData.githubUsername);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [formData.githubUsername]);

  const handleVerification = async () => {
    if (!verificationInput.trim()) {
      setVerificationError("Please enter your email or application ID");
      return;
    }

    setLoading(true);
    setVerificationError("");

    try {
      // First check if user already has an ID card
      const checkResponse = await fetch(`/api/id-cards?email=${encodeURIComponent(verificationInput)}`);
      const checkData = await checkResponse.json();

      if (checkData.success && checkData.idCards && checkData.idCards.length > 0) {
        const existingCard = checkData.idCards[0];
        setVerificationError(
          `You already have an ID card (ID: ${existingCard.idNumber}). Redirecting to your profile...`
        );
        setTimeout(() => {
          router.push(existingCard.profileUrl || `/profile/${existingCard.name.toLowerCase().replace(/\s+/g, '')}`);
        }, REDIRECT_DELAY_MS);
        return;
      }

      const response = await fetch("/api/verify-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationInput.includes("@") ? verificationInput : null,
          applicationId: !verificationInput.includes("@") ? verificationInput : null
        })
      });

      const data = await response.json();

      if (data.success && data.verified) {
        setVerificationData(data.application);

        // Fetch user profile to get username
        try {
          const userRes = await fetch(`/api/profile?email=${encodeURIComponent(data.application.email)}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.user?.username) {
              setUsername(userData.user.username);
            }
          }
        } catch (err) {
          console.log('User profile not found, will use generated username');
        }

        // Pre-fill form with application data
        setFormData(prev => ({
          ...prev,
          name: data.application.name || "",
          role: data.application.role || "",
          githubUsername: data.application.githubUsername || "",
          linkedinUrl: data.application.linkedinUrl || ""
        }));
        setStep(1);
      } else {
        setVerificationError(data.message || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError("Failed to verify application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photo: reader.result,
          useGithubPhoto: false
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchGitHubPhoto = async (username = formData.githubUsername) => {
    if (!username) return;

    setPhotoLoading(true);
    try {
      const response = await fetch(`/api/github-photo?username=${username}`);
      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          photo: data.avatar_url,
          useGithubPhoto: true
        }));
      }
    } catch (error) {
      console.error("Error fetching GitHub photo:", error);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleGenerateCard = () => {
    // Validate required fields
    if (!formData.name || !formData.role || !formData.photo) {
      setToast({ message: 'Please fill in all required fields and provide a photo', type: 'error' });
      return;
    }

    // SECURITY: Ensure role matches verified application role
    if (formData.role !== verificationData?.role) {
      setToast({ message: `Security Error: Role cannot be changed. Your approved role is: ${verificationData?.role}`, type: 'error' });
      setFormData(prev => ({ ...prev, role: verificationData?.role }));
      return;
    }

    // Generate unique ID number
    const idNumber = `ECW-2026-${Date.now().toString().slice(-6)}`;

    // Use username-based profile URL if available, otherwise use ID number
    const profileUrl = username
      ? `${window.location.origin}/profile/${username}`
      : `${window.location.origin}/profile/${idNumber}`;

    const card = {
      ...formData,
      idNumber,
      profileUrl,
      applicationId: verificationData?.id,
      email: verificationData?.email
    };

    setCardData(card);
    setStep(2);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCard = async () => {
    if (!idCardRef.current || !idCardBackRef.current) return;

    setLoading(true);
    setIsDownloading(true);

    try {
      // Wait for React to apply `isDownloading` styles before cloning for capture
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const frontCard = idCardRef.current;
      const backCard = idCardBackRef.current;

      // Create an offscreen container to place front and back side-by-side
      const downloadContainer = document.createElement("div");
      downloadContainer.style.position = "fixed";
      downloadContainer.style.left = "-9999px";
      downloadContainer.style.top = "0";
      downloadContainer.style.display = "flex";
      downloadContainer.style.gap = "24px";
      downloadContainer.style.padding = "24px";
      downloadContainer.style.background = "transparent";

      const frontClone = frontCard.cloneNode(true);
      const backClone = backCard.cloneNode(true);

      // Ensure both sides are fully visible and not transformed for capture
      frontClone.style.opacity = "1";
      frontClone.style.position = "relative";
      frontClone.style.transform = "none";
      backClone.style.opacity = "1";
      backClone.style.position = "relative";
      backClone.style.transform = "none";

      downloadContainer.appendChild(frontClone);
      downloadContainer.appendChild(backClone);
      document.body.appendChild(downloadContainer);

      // Wait for DOM to paint
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvasCombined = await html2canvas(downloadContainer, {
        scale: 3,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const dataUrlCombined = canvasCombined.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `DSoC-2026-ID-${formData.name.replace(/\s+/g, "-")}.png`;
      link.href = dataUrlCombined;
      link.click();

      // Clean up offscreen container
      document.body.removeChild(downloadContainer);

      // Save to database and localStorage (using combined image)
      const saveResult = await saveIDCard(cardData, dataUrlCombined);
      if (saveResult === false) {
        // Error already handled in saveIDCard
        setLoading(false);
        return;
      }

      // Record download in database (non-blocking)
      fetch("/api/id-cards/download", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber: cardData.idNumber })
      }).catch(err => {
        console.log("Failed to record download count:", err);
        // Don't show error to user, download was successful
      });

      // Show success message only after everything is done
      setTimeout(() => {
        setToast({ message: 'ID Card downloaded successfully!\n', type: 'success' });
      }, 100);

    } catch (error) {
      console.error("Error downloading card:", error);
      setIsDownloading(false);
      setToast({ message: 'Failed to download ID card. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
      setIsDownloading(false);
    }
  };

  const saveIDCard = async (data, imageUrl) => {
    try {
      // Save to database first
      const response = await fetch("/api/id-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idNumber: data.idNumber,
          name: data.name,
          username: username, // Add username from state
          email: data.email || verificationData?.email,
          role: data.role,
          photo: data.photo,
          githubUsername: data.githubUsername,
          linkedinUrl: data.linkedinUrl,
          profileUrl: data.profileUrl,
          qrCode: qrCodeDataUrl,
          useGithubPhoto: data.useGithubPhoto,
          applicationId: data.applicationId
        })
      });

      // Some infrastructure (e.g. dev server or hosting) may return
      // non-JSON error pages like "Request Entity Too Large".
      // Guard against that to avoid confusing JSON parse errors.
      let result;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response when saving ID card:", text);
        if (text && text.toLowerCase().includes("request entity too large")) {
          throw new Error(
            "ID card data is too large to save. Try again with a smaller image or photo."
          );
        }
        throw new Error("Unexpected response from server while saving ID card");
      }

      if (!result.success) {
        if (response.status === 409) {
          // User already has a card
          console.log("User already has an ID card:", result);
          setToast({ message: `You already have an ID card!\n\nID Number: ${result.existingCard?.idNumber || 'N/A'}\n\nRedirecting to your profile...`, type: 'warning' });
          if (result.existingCard?.profileUrl) {
            setTimeout(() => router.push(result.existingCard.profileUrl), 2000);
          }
          return false;
        } else if (response.status === 403) {
          // Role mismatch or not approved
          setToast({ message: `Security Error: ${result.message}`, type: 'error' });
          return false;
        } else {
          throw new Error(result.message || "Failed to save ID card");
        }
      }

      // Only save to localStorage if database save was successful
      const existingCards = JSON.parse(localStorage.getItem("ecwoc_id_cards") || "[]");
      existingCards.push({
        ...data,
        imageUrl,
        qrCode: qrCodeDataUrl,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("ecwoc_id_cards", JSON.stringify(existingCards));

      console.log("✅ ID card saved successfully:", result.idCard);
      return true;
    } catch (error) {
      console.error("Error saving ID card:", error);
      setToast({ message: `Failed to save ID card: ${error.message}`, type: 'error' });
      return false;
    }
  };

  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-8 max-w-6xl">
        <div className="text-center py-8 mb-8">
          <h1 className="text-4xl md:text-6xl font-bold-custom text-white mb-4">
            ID Card For <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-purple-end)]">DSoC 2026</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-thin-custom max-w-3xl mx-auto">
            Official Digital Credential
          </p>
        </div>

        {step === 0 ? (
          /* Step 0: Verification */
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-lg border border-white/20 mb-16 max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-white text-4xl">verified_user</span>
              </div>
              <h1 className="text-4xl font-bold-custom text-gray-900 mb-2">Verify Your Application</h1>
              <p className="text-gray-600 font-thin-custom">Only approved participants can generate ID cards</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="material-symbols-outlined text-yellow-600 mr-2">info</span>
                <div className="text-sm text-gray-700 font-thin-custom">
                  <strong className="font-bold-custom">Important:</strong> You must have an approved application to generate an ID card.
                  If you haven&apos;t applied yet, please <a href="/apply" className="text-indigo-600 underline">submit your application</a> first.
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="verification" className="block text-gray-900 font-bold-custom mb-2">
                  Email or Application ID
                </label>
                <input
                  type="text"
                  id="verification"
                  value={verificationInput}
                  onChange={(e) => {
                    setVerificationInput(e.target.value);
                    setVerificationError("");
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleVerification()}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="your@email.com or APP-123456789"
                />
                {verificationError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1">error</span>
                    {verificationError}
                  </p>
                )}
              </div>

              <button
                onClick={handleVerification}
                disabled={loading}
                className="w-full px-8 py-4 bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-purple-end)] text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              <button
                onClick={() => router.push("/")}
                className="w-full px-8 py-4 bg-transparent text-indigo-600 font-bold-custom rounded-full border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
              >
                Back to Home
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-bold-custom text-gray-900 mb-3">How to find your Application ID:</h3>
              <ul className="space-y-2 text-sm text-gray-600 font-thin-custom">
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-indigo-500 text-sm mr-2 mt-0.5">check</span>
                  Check your email for the application confirmation
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-indigo-500 text-sm mr-2 mt-0.5">check</span>
                  Your Application ID starts with &quot;APP-&quot; followed by numbers
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-indigo-500 text-sm mr-2 mt-0.5">check</span>
                  You can also use the email you used during application
                </li>
              </ul>
            </div>
          </div>
        ) : step === 1 ? (
          /* Step 1: Form Input */
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-lg border border-white/20 mb-16">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold-custom text-gray-900 mb-2">Generate Your DSoC ID</h1>
                  <p className="text-gray-600 font-thin-custom">Create your personalized DSoC 2026 ID card</p>
                </div>
                <div className="hidden md:flex items-center bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                  <span className="material-symbols-outlined text-emerald-600 mr-2">verified</span>
                  <span className="text-sm font-bold-custom text-emerald-700">Verified</span>
                </div>
              </div>
            </div>

            <form className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-2xl font-bold-custom text-gray-900 mb-4">Personal Information</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-900 font-bold-custom mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-gray-900 font-bold-custom mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="role"
                        name="role"
                        required
                        value={formData.role}
                        readOnly
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-thin-custom cursor-not-allowed"
                        title="Role is locked based on your approved application"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-emerald-600">
                        lock
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-thin-custom mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">info</span>
                      Role is locked based on your approved application
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="githubUsername" className="block text-gray-900 font-bold-custom mb-2">
                      GitHub Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="githubUsername"
                        name="githubUsername"
                        value={formData.githubUsername}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                        placeholder="yourusername"
                      />
                      {photoLoading && (
                        <span className="material-symbols-outlined absolute right-3 top-3 text-indigo-500 animate-spin">
                          progress_activity
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-thin-custom mt-1">
                      {photoLoading ? "Fetching photo..." : "Your photo will be fetched automatically"}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="linkedinUrl" className="block text-gray-900 font-bold-custom mb-2">
                      LinkedIn URL (Optional)
                    </label>
                    <input
                      type="text"
                      id="linkedinUrl"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                      placeholder="linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Section */}
              <div className="border-t border-gray-300 pt-6">
                <h2 className="text-2xl font-bold-custom text-gray-900 mb-4">Profile Photo</h2>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <label className="block text-gray-900 font-bold-custom mb-2">
                      Upload Custom Photo (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold-custom file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-sm text-gray-600 font-thin-custom mt-1">
                      Upload to override GitHub photo
                    </p>
                  </div>

                  {formData.photo && (
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-bold-custom text-gray-900 mb-2">Photo Preview</p>
                      <div className="relative">
                        <img
                          src={formData.photo}
                          alt="Preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500 shadow-lg"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1">
                          <span className="material-symbols-outlined text-white text-lg">check_circle</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleGenerateCard}
                  disabled={!formData.name || !formData.role || !formData.photo}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-purple-end)] text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center">
                    <span className="material-symbols-outlined mr-2">badge</span>
                    Generate ID Card
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-8 py-4 bg-transparent text-indigo-600 font-bold-custom rounded-full border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Preview and Download */
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-lg border border-white/20 mb-16">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold-custom text-gray-900 mb-2">Your DSoC ID Card</h1>
              <p className="text-gray-600 font-thin-custom">Download and share your personalized ID card</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
              {/* ID Card Preview with Flip */}
              <div className="relative perspective-1000">
                {/* Front Card */}
                <div
                  ref={idCardRef}
                  className={`transform transition-all duration-500 ${showCardBack ? 'opacity-0 absolute' : 'opacity-100'}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <IDCard
                    data={cardData}
                    qrCodeDataUrl={qrCodeDataUrl}
                    onQRCodeGenerated={setQrCodeDataUrl}
                    showBack={false}
                    isDownloading={isDownloading}
                  />
                </div>

                {/* Back Card */}
                <div
                  ref={idCardBackRef}
                  className={`transform transition-all duration-500 ${showCardBack ? 'opacity-100' : 'opacity-0 absolute top-0'}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <IDCard
                    data={cardData}
                    qrCodeDataUrl={qrCodeDataUrl}
                    onQRCodeGenerated={setQrCodeDataUrl}
                    showBack={true}
                    isDownloading={isDownloading}
                  />
                </div>

                {/* Flip Button */}
                <button
                  onClick={() => setShowCardBack(!showCardBack)}
                  className="absolute -bottom-14 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold-custom shadow-lg hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">autorenew</span>
                  {showCardBack ? 'Show Front' : 'Show Back'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 lg:max-w-sm w-full mt-16 lg:mt-0">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                  <h3 className="font-bold-custom text-xl text-gray-900 mb-4 flex items-center">
                    <span className="material-symbols-outlined text-emerald-500 mr-2">celebration</span>
                    Your ID is Ready!
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-700 font-thin-custom mb-4">
                    <li className="flex items-start">
                      <span className="material-symbols-outlined text-emerald-500 text-lg mr-2">download</span>
                      Download your ID card as an image
                    </li>
                    <li className="flex items-start">
                      <span className="material-symbols-outlined text-emerald-500 text-lg mr-2">share</span>
                      Share on social media
                    </li>
                    <li className="flex items-start">
                      <span className="material-symbols-outlined text-emerald-500 text-lg mr-2">qr_code</span>
                      QR code links to your profile
                    </li>
                    <li className="flex items-start">
                      <span className="material-symbols-outlined text-emerald-500 text-lg mr-2">badge</span>
                      Use it for DSoC events
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleDownloadCard}
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="material-symbols-outlined mr-2">download</span>
                      Download ID Card
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full px-8 py-4 bg-transparent text-indigo-600 font-bold-custom rounded-full border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    <span className="material-symbols-outlined mr-2">edit</span>
                    Edit Details
                  </span>
                </button>

                <button
                  onClick={() => router.push("/")}
                  className="w-full px-8 py-4 bg-gray-200 text-gray-700 font-bold-custom rounded-full hover:bg-gray-300 transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    <span className="material-symbols-outlined mr-2">home</span>
                    Back to Home
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
