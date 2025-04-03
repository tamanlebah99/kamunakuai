'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamsProviderProps {
  children: (params: URLSearchParams) => React.ReactNode;
}

function SearchParamsHandler({ children }: SearchParamsProviderProps) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}

export function SearchParamsProvider({ children }: SearchParamsProviderProps) {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandler>{children}</SearchParamsHandler>
    </Suspense>
  );
} 