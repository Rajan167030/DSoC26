"use client";

import { useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";

async function generateQRCode(profileUrl) {
  return QRCode.toDataURL(profileUrl, {
    width: 300,
    margin: 1,
    color: {
      dark: "#FFFFFF",
      light: "#000000",
    },
  });
}

export default function IDCard({
  data,
  qrCodeDataUrl,
  onQRCodeGenerated,
  showBack = false,
  isDownloading = false,
  ...props
}) {
  // Support both shapes: either a full `data` object or individual props
  const card = data || {
    name: props.name,
    role: props.role,
    photo: props.photo,
    idNumber: props.idNumber,
    profileUrl: props.profileUrl,
    githubUsername: props.githubUsername,
    linkedinUrl: props.linkedinUrl,
    // Allow qrCode via either prop or within data
    qrCode: props.qrCodeDataUrl || props.qrCode,
  };
  const profileUrl = card?.profileUrl;

  useEffect(() => {
    if (!profileUrl || qrCodeDataUrl) return;

    let cancelled = false;

    generateQRCode(profileUrl)
      .then((dataUrl) => {
        if (!cancelled && onQRCodeGenerated) {
          onQRCodeGenerated(dataUrl);
        }
      })
      .catch((error) => {
        console.error("Error generating QR code:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [profileUrl, qrCodeDataUrl, onQRCodeGenerated]);

  const getRoleGradient = (role) => {
    switch (role?.toLowerCase()) {
      case "contributor":
        return "bg-gradient-to-br from-red-800 via-red-500/80 to-red-800";
      case "mentor":
        return "bg-gradient-to-br from-green-800 via-green-500/80 to-green-800";
      case "project-admin":
        return "bg-gradient-to-br from-blue-800 via-blue-500/80 to-blue-800";
      default:
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }
  };

  const getRoleAccent = (role) => {
    switch (role?.toLowerCase()) {
      case "contributor":
        return "#D4AF37"; // Gold
      case "mentor":
        return "#FF6B9D"; // Pink
      case "project admin":
      case "project-admin":
        return "#00F2FE"; // Cyan
      default:
        return "#D4AF37";
    }
  };

  if (showBack) {
    // BACK SIDE - Terms & Conditions
    return (
      <div
        id="id-card-back"
        className={`relative w-[400px] h-[680px] rounded-3xl shadow-2xl overflow-hidden ${getRoleGradient(
          card.role
        )}`}
        style={{
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          {/* <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-20 translate-x-20 animate-pulse"></div> */}
          <div
            className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-20 -translate-x-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              TERMS & CONDITIONS
            </h2>
            <div className="w-16 h-1 bg-white mx-auto rounded-full"></div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-sm font-bold text-white mb-4">
              Usage Guidelines
            </h3>

            <div className="space-y-3 text-xs text-white/90 leading-relaxed">
              <div className="flex gap-2">
                <span className="text-white font-bold mt-0.5">•</span>
                <p>
                  This digital ID card is your official identity for the DSoC
                  2026 program. Keep your credentials secure and do not share
                  with others.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-white font-bold mt-0.5">•</span>
                <p>
                  Valid only for the DSoC 2026 program duration and authorized
                  virtual/physical events.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-white font-bold mt-0.5">•</span>
                <p>
                  Loss or unauthorized access must be reported immediately.
                  Duplication, transfer, or modification is strictly prohibited
                  and may result in disqualification.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-white font-bold mt-0.5">•</span>
                <p>
                  Holder agrees to maintain professional conduct and uphold the
                  program&apos;s code of conduct at all times during participation.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-white font-bold mt-0.5">•</span>
                <p>
                  The QR code provides access to your profile and contribution
                  statistics. Keep this card secure to protect your identity and
                  achievements.
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-white/70">Website:</p>
                  <p className="font-semibold text-white">
                    code.elitecoders.xyz
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/70">Email:</p>
                  <p className="font-semibold text-white">
                    code@elitecoders.xyz
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            <div
              className={`bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full relative `}
            >
              <span
                className={`text-white text-sm font-bold${
                  isDownloading ? " relative  -top-2 " : ""
                }`}
              >
                2026
              </span>
            </div>
            <div className="text-white text-xs">
              <p className="font-bold">DSoC 2026</p>
              <p className="opacity-80">Devnovate</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FRONT SIDE - Dark Modern Design (Photo 3 Style)
  const accentColor = getRoleAccent(card.role);
  const bgcolor = getRoleGradient(card.role);
  const roleText = (card.role || "Participant").replace(/\s+/g, "-");
  const socialUsernameClassName = `text-sm font-mono leading-relaxed${
    isDownloading ? " inline-block pb-3" : ""
  }`;
  const roleBadgeClassName = `mx-auto h-7 px-4 inline-flex items-center justify-center whitespace-nowrap
                       rounded-full text-xs font-bold uppercase tracking-wider
                       text-white border-2 border-white/30${isDownloading ? " pb-3" : ""}`;
  const roleBadgeTextClassName = `relative${isDownloading ? " -top-0.5" : ""}`;
  const yearPillClassName = `h-6 px-3 flex items-center justify-center rounded-full
                         text-xs font-bold leading-none${isDownloading ? " pb-2" : ""}`;

  return (
    <div
      id="id-card"
      className={`relative w-[400px] h-[680px] rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 ${bgcolor}`}
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        // background: getRoleGradient(card.role),
        border: `4px solid ${accentColor}`,
      }}
    >
      {/* Lanyard String - Fabric Strap Style (Picture 1) */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
        {/* White/Gray Fabric Strap */}
        <div className="relative w-8 h-24 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 shadow-lg rounded-sm">
          {/* Fabric texture - light side */}
          <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-white to-gray-200"></div>
          {/* Fabric texture - dark side */}
          <div className="absolute right-0 top-0 w-1.5 h-full bg-gradient-to-b from-gray-300 to-gray-500"></div>
          {/* Center stitching line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-px bg-gray-400 opacity-50"></div>
        </div>

        {/* Metal Clip/Hook */}
        <div className="relative w-10 h-8 bg-gradient-to-b from-gray-300 to-gray-500 rounded-b-xl shadow-xl border-2 border-gray-400">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-b-xl"></div>
          {/* Hook detail */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-gray-600 rounded-sm shadow-inner"></div>
        </div>
      </div>

      {/* Lanyard Hole */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/30 rounded-full border-2 border-white/20 shadow-inner z-20"></div>

      {/* Profile Photo - Large Circular */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
        <div className="relative">
          {/* Animated Glow Ring */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
            style={{ backgroundColor: accentColor }}
          ></div>
          {/* Photo Container */}
          <div
            className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-white shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            }}
          >
            {card.photo ? (
              <Image
                src={card.photo}
                alt={card.name || "Participant photo"}
                fill
                sizes="176px"
                className="object-cover object-center"
                priority
                unoptimized
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <span className="text-white text-8xl font-bold">
                  {card.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {/* Verification Badge */}
          <div
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
            
          </div>
        </div>
      </div>

      {/* Details Section - Dark Card */}
      <div className="absolute bottom-8 left-4 right-4 z-20">
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-white/20 shadow-xl">
          {/* Name Section */}
          <div className="text-center mb-3">
            <h2
              className="text-lg font-bold text-white mb-1.5 tracking-wide leading-relaxed"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              {card.name || "Participant Name"}
            </h2>
            {/* Role Badge */}
            <div
              className={roleBadgeClassName}
              style={{ backgroundColor: accentColor }}
            >
              <span className={roleBadgeTextClassName}>{roleText}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 my-3"></div>

          {/* Social Links */}
          <div className="space-y-2.5 mb-3">
            {card.githubUsername && (
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <span className={socialUsernameClassName}>
                  @{card.githubUsername}
                </span>
              </div>
            )}

            {card.linkedinUrl && (
              <div className="flex  items-center gap-2.5 text-white">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <span className={socialUsernameClassName}>
                  @
                  {(() => {
                    if (!card.linkedinUrl) return "linkedin";
                    const url = card.linkedinUrl;
                    if (url.includes("linkedin.com/in/")) {
                      return (
                        url
                          .split("linkedin.com/in/")[1]
                          ?.split("/")[0]
                          ?.split("?")[0] || "linkedin"
                      );
                    } else if (url.startsWith("http")) {
                      return url.split("/").filter(Boolean).pop() || "linkedin";
                    }
                    return url.replace(/^@/, "");
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 my-3"></div>

          {/* QR and ID Section */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 mb-1 leading-relaxed">
                AUTHENTICITY KEY
              </p>
              <p className="text-sm font-bold text-white font-mono tracking-wider leading-relaxed">
                {card.idNumber || "DSC-2026-XXXX"}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-1.5 rounded-lg shadow-lg flex-shrink-0">
              {qrCodeDataUrl || card.qrCode ? (
                <Image
                  src={qrCodeDataUrl || card.qrCode}
                  alt="QR Code"
                  width={56}
                  height={56}
                  className="w-14 h-14"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-3 pt-2.5 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-white/80 leading-relaxed">
              <div>
                <p className="font-bold leading-relaxed">DSoC 2026</p>
                <p className="opacity-70 leading-relaxed">Devnovate</p>
              </div>
              <div
                className={yearPillClassName}
                style={{ backgroundColor: accentColor }}
              >
                2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
