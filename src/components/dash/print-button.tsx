'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({ label = 'Print / Save PDF' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn btn-dark btn-md gap-2">
      <Printer size={15} /> {label}
    </button>
  );
}
