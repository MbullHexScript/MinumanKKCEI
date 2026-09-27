import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-label={title}
    onCancel={event => { event.preventDefault(); closeRef.current(); }}
    onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeRef.current(); } }}>
    <header className="modal-top"><span>{title}</span><button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={21}/></button></header>
    {children}
  </dialog>;
}
