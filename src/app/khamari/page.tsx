'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KhamariPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/khamar');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Khamar Management পেজে রিডাইরেক্ট হচ্ছে...
    </div>
  );
}
