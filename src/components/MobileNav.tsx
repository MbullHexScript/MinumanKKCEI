import { useLayoutEffect, useRef } from 'react';
import { BookOpen, Heart, Plus, Settings } from 'lucide-react';

type Page = 'recipes' | 'favorites' | 'settings';

export default function MobileNav({ page, onNavigate, onAdd, canEdit }: {
  page: Page; onNavigate: (page: Page) => void; onAdd: () => void; canEdit: boolean;
}) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const spring = useRef({ position: 0, velocity: 0, initialized: false });
  const index = page === 'recipes' ? 0 : page === 'favorites' ? 1 : 3;

  useLayoutEffect(() => {
    const nav = navRef.current!;
    const indicator = indicatorRef.current!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let target = 0;
    let lastTime = 0;
    const render = () => { indicator.style.transform = `translateX(${spring.current.position}px)`; };
    const animate = (time: number) => {
      // Exact critically damped spring: preserve presentation and velocity on retarget.
      const dt = Math.min((time - lastTime) / 1000, .064);
      lastTime = time;
      const state = spring.current;
      const offset = state.position - target;
      const omega = 24;
      const decay = Math.exp(-omega * dt);
      const term = state.velocity + omega * offset;
      state.position = target + (offset + term * dt) * decay;
      state.velocity = (state.velocity - omega * term * dt) * decay;
      if (Math.abs(state.position - target) < .1 && Math.abs(state.velocity) < .1) {
        state.position = target; state.velocity = 0; frame = 0; render(); return;
      }
      render();
      frame = requestAnimationFrame(animate);
    };
    const measure = () => {
      const button = nav.querySelectorAll<HTMLButtonElement>(':scope > button')[index];
      if (!button || !nav.clientWidth) return;
      target = button.offsetLeft - 7;
      if (!spring.current.initialized || reducedMotion.matches) {
        cancelAnimationFrame(frame); frame = 0;
        spring.current = { position: target, velocity: 0, initialized: true };
        render(); return;
      }
      if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(animate); }
    };
    const resize = new ResizeObserver(measure);
    resize.observe(nav);
    reducedMotion.addEventListener('change', measure);
    measure();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); reducedMotion.removeEventListener('change', measure); };
  }, [index]);

  return <nav ref={navRef} className="bottom-nav" aria-label="Navigasi mobile">
    <span ref={indicatorRef} className="nav-indicator" aria-hidden="true"/>
    <button className={page === 'recipes' ? 'active' : ''} aria-current={page === 'recipes' ? 'page' : undefined} onClick={() => onNavigate('recipes')}><BookOpen size={21}/><span>Racikan</span></button>
    <button className={page === 'favorites' ? 'active' : ''} aria-current={page === 'favorites' ? 'page' : undefined} onClick={() => onNavigate('favorites')}><Heart size={21}/><span>Favorit</span></button>
    <button className="mobile-add" disabled={!canEdit} onClick={onAdd}><span><Plus size={25}/></span><span>Tambah</span></button>
    <button className={page === 'settings' ? 'active' : ''} aria-current={page === 'settings' ? 'page' : undefined} onClick={() => onNavigate('settings')}><Settings size={21}/><span>Pengaturan</span></button>
  </nav>;
}
