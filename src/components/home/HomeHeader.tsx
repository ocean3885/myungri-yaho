'use client';

import React from 'react';
import Image from 'next/image';

export default function HomeHeader() {
  return (
    <header className="relative flex h-14 items-center justify-center">
      <Image
        src="/images/my-logo.png"
        alt="명리야호"
        width={180}
        height={48}
        priority
        className="object-contain"
      />
    </header>
  );
}
