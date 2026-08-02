'use client';

import { useEffect, useState } from 'react';
import { farmStore } from '@/lib/store';
import { AuthUser } from '@/lib/types';
import { LogIn, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '969714135854-8ahcieapvq3go4alruupkrvi8ov6m32q.apps.googleusercontent.com';

// Helper to decode Google JWT ID Token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT:', e);
    return null;
  }
}

export default function GoogleAuthModal({ isOpen, onClose }: GoogleAuthModalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load Google Identity Services SDK script dynamically
    const scriptId = 'google-gsi-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initializeGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });

        // Render official Google button
        const btnContainer = document.getElementById('google-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_dark',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'signin_with',
            width: 280,
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);
    } else {
      initializeGsi();
    }
  }, [isOpen]);

  const handleGoogleResponse = (response: any) => {
    setIsLoading(true);
    setErrorMsg('');

    if (response?.credential) {
      const payload = parseJwt(response.credential);
      if (payload && payload.email) {
        const state = farmStore.getState();
        const authorizedList = state.posAuthorizedEmails || [];
        const userEmail = payload.email.toLowerCase();

        // Strictly check if email exists in POS Authorized Emails list and is Active
        const authMatch = authorizedList.find(
          (a) => a.email.toLowerCase() === userEmail && a.status === 'Active'
        );

        if (authMatch) {
          // Fetch crisp high-resolution Gmail profile picture from Google payload
          let profilePic = payload.picture ? payload.picture.replace(/=s\d+-c/, '=s256-c') : '';
          if (!profilePic) {
            profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(authMatch.name || payload.name || payload.email)}&background=10b981&color=fff`;
          }

          const user: AuthUser = {
            email: payload.email,
            name: authMatch.name || payload.name || payload.email.split('@')[0],
            picture: profilePic,
            role: authMatch.role, // Strictly use the assigned role from POS Authorized Emails
            idToken: response.credential,
          };

          farmStore.setCurrentUser(user);
          setIsLoading(false);
          if (onClose) onClose();
        } else {
          const inactiveMatch = authorizedList.find((a) => a.email.toLowerCase() === userEmail);
          if (inactiveMatch && inactiveMatch.status === 'Inactive') {
            setErrorMsg(`❌ (${payload.email}) ইমেইলটি সাময়িকভাবে ডি-অ্যাক্টিভেট করা আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।`);
          } else {
            setErrorMsg(`❌ (${payload.email}) ইমেইলটি POS পারমিশন তালিকায় অনুমোদিত নয়। অ্যাডমিন কর্তৃক "POS Authorized Emails" তালিকায় আপনার ইমেইল যোগ করা প্রয়োজন।`);
          }
          setIsLoading(false);
        }
      } else {
        setErrorMsg('গুগল অ্যাকাউন্ট থেকে ভ্যালিড তথ্য পাওয়া যায়নি');
        setIsLoading(false);
      }
    } else {
      setErrorMsg('গুগল সাইন ইন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto animate-fadeIn">
      <div className="bg-[#101522] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-md w-full my-auto text-center relative overflow-hidden">
        {/* Glow backdrop decorative effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-emerald-950/80 border border-emerald-500/40 p-1 bg-[#090d16]">
            <img src="/logo.png" alt="AKHI POS Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400">
              AKHI POS PRO
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              সিস্টেমে প্রবেশ করতে Google সাইন ইন করুন
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Official Button Container */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div id="google-btn-container" className="min-h-[44px] flex justify-center items-center">
            {/* Native google button gets rendered here */}
            <div className="animate-pulse text-xs text-gray-400">গুগল সাইন ইন বাটন লোড হচ্ছে...</div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Google OAuth 2.0 প্রটেক্টেড এন্ডপয়েন্ট</span>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    google?: any;
  }
}
