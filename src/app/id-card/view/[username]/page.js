'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import IDCard from '@/components/IDCard';
import html2canvas from 'html2canvas';

export default function ViewIDCard() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params?.username;

  const idCardFrontRef = useRef(null);
  const idCardBackRef = useRef(null);
  const autoDownloadDoneRef = useRef(false);

  const [idCard, setIdCard] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (username) {
      fetchIDCard();
    }
  }, [username]);

  const fetchIDCard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/id-cards/${username}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ID card not found');
        return;
      }

      setIdCard(data.idCard);
      setQrCodeDataUrl(data.idCard?.qrCodeDataUrl || null);
    } catch (err) {
      console.error('Error fetching ID card:', err);
      setError('Failed to load ID card');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!idCard) return;
    if (!idCardFrontRef.current || !idCardBackRef.current) return;

    setDownloading(true);
    try {
      // Ensure any "downloading"-specific styles are applied before capture
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const frontCard = idCardFrontRef.current;
      const backCard = idCardBackRef.current;

      // Create an offscreen container to place front and back side-by-side
      const downloadContainer = document.createElement('div');
      downloadContainer.style.position = 'fixed';
      downloadContainer.style.left = '-9999px';
      downloadContainer.style.top = '0';
      downloadContainer.style.display = 'flex';
      downloadContainer.style.gap = '24px';
      downloadContainer.style.padding = '24px';
      downloadContainer.style.background = 'transparent';

      const frontClone = frontCard.cloneNode(true);
      const backClone = backCard.cloneNode(true);

      // Ensure both sides are fully visible and not transformed for capture
      frontClone.style.opacity = '1';
      frontClone.style.position = 'relative';
      frontClone.style.transform = 'none';
      backClone.style.opacity = '1';
      backClone.style.position = 'relative';
      backClone.style.transform = 'none';

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

      const dataUrlCombined = canvasCombined.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DSoC-2026-ID-${(idCard.name || username || 'user').replace(/\s+/g, '-')}.png`;
      link.href = dataUrlCombined;
      link.click();

      // Clean up offscreen container
      document.body.removeChild(downloadContainer);

      // Record download (non-blocking)
      fetch('/api/id-cards/download', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: idCard.idNumber }),
      }).catch(() => {});
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const shouldAutoDownload = searchParams?.get('download') === '1';
    if (!shouldAutoDownload) return;
    if (!idCard) return;
    if (autoDownloadDoneRef.current) return;

    autoDownloadDoneRef.current = true;
    handleDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, idCard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4">
        <Navbar />
        <div className="pt-32 pb-8">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading ID card...</p>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }  if (error || !idCard) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-32 pb-8">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-3xl font-bold text-gray-200 mb-2">ID Card Not Found</h1>
              <p className="text-gray-400 mb-6">{error || 'This ID card does not exist'}</p>
              <button
                onClick={() => router.push('/id-card/generate')}
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                Generate ID Card
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4">
      <Navbar />
      <div className="pt-32 pb-8">
        <div className="text-center py-8 mb-8">
          <h1 className="text-4xl md:text-6xl font-bold-custom text-white mb-4">
            ID Card For <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-purple-end)]">DSoC 2026</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-thin-custom max-w-3xl mx-auto">
           Official Digital Credential
          </p>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">

            <div className="flex justify-center mb-8">
              <div ref={idCardFrontRef}>
                <IDCard
                  data={idCard}
                  qrCodeDataUrl={qrCodeDataUrl}
                  onQRCodeGenerated={(dataUrl) => setQrCodeDataUrl(dataUrl)}
                  isDownloading={downloading}
                />
              </div>

              {/* Render back side offscreen so we can include it in downloads */}
              <div className="fixed left-[-9999px] top-0" aria-hidden="true">
                <div ref={idCardBackRef}>
                  <IDCard data={idCard} showBack isDownloading={downloading} />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  // If opened in a new tab/window there may be no history to go back to
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else if (username) {
                    router.push(`/profile/${username}`);
                  } else {
                    router.push('/');
                  }
                }}
                className="px-6 py-3 bg-gray-800 border-2 border-gray-600 text-gray-200 rounded-xl font-bold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
              >
                ← Back to Profile
              </button>
              <button
                onClick={() => {
                  handleDownload();
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download ID Card'}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
