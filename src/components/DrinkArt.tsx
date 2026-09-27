import { useId } from 'react';

export function DrinkArt({ name, category, foam = false, className = '' }: { name: string; category: string; foam?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  const isMatcha = category === 'Matcha Series';
  const isBerry = /strawberry|berries|velvet|sakura/i.test(name);
  const isDark = category === 'Black Coffee' || /choco|milo|beng/i.test(name);
  const isTea = category === 'Tea' || /thai|nutrisari/i.test(name);
  const isBlue = /midnight splash|mineral|zoda/i.test(name);
  const isAdditional = category === 'Additional';
  const top = isMatcha ? '#8b9d55' : isBlue ? '#91c1c4' : isDark ? '#714632' : isTea ? '#c17b2c' : '#b58a60';
  const bottom = isBerry ? '#aa5259' : isMatcha ? '#d2d6a9' : isBlue ? '#d0e5dd' : isDark ? '#37251f' : '#e1c4a0';
  return <svg className={`drink-art ${className}`} viewBox="0 0 280 230" role="img" aria-label={`Ilustrasi ${name}`}>
    <defs>
      <linearGradient id={`${id}drink`} x1="0" y1="0" x2=".9" y2="1"><stop stopColor={top}/><stop offset=".6" stopColor={top}/><stop offset="1" stopColor={bottom}/></linearGradient>
      <linearGradient id={`${id}glass`}><stop stopColor="#fff" stopOpacity=".3"/><stop offset=".22" stopColor="#fff" stopOpacity=".04"/><stop offset=".8" stopColor="#fff" stopOpacity=".06"/><stop offset="1" stopColor="#fff" stopOpacity=".35"/></linearGradient>
      <linearGradient id={`${id}milk`} x2="0" y2="1"><stop stopColor="#eee0c2"/><stop offset="1" stopColor="#d7be96"/></linearGradient>
      <clipPath id={`${id}cup`}><path d={isAdditional ? 'M84 102h112l-9 73q-2 14-47 14t-47-14z' : 'M83 59h114l-12 130q-2 15-45 15t-45-15z'}/></clipPath>
      <filter id={`${id}shadow`}><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <ellipse cx="142" cy={isAdditional ? 196 : 212} rx="60" ry="8" fill="#000" opacity=".18" filter={`url(#${id}shadow)`}/>
    {!isAdditional && <path d="m166 62 14-42" stroke="#d7ccb9" strokeWidth="6" strokeLinecap="round"/>}
    <g clipPath={`url(#${id}cup)`}>
      <path d="M76 48h130v162H76z" fill={`url(#${id}drink)`}/>
      {(isMatcha || (!isDark && !isTea && !isBlue)) && <path d="M80 108q31-17 61 1t60-6v110H80z" fill={isBerry ? '#ecdfc6' : `url(#${id}milk)`}/ >}
      {isBerry && <path d="M79 164q18-16 40-5t37 3 45-11v60H79z" fill="#b75461"/>}
      {!isAdditional && <g fill="#fff" opacity=".18" stroke="#fff" strokeOpacity=".3">
        <rect x="99" y="69" width="25" height="23" rx="5" transform="rotate(-14 110 80)"/>
        <rect x="137" y="74" width="28" height="24" rx="5" transform="rotate(17 148 85)"/>
        <rect x="160" y="104" width="21" height="24" rx="4" transform="rotate(-8 170 117)"/>
      </g>}
      <path d="M77 49h127v164H77z" fill={`url(#${id}glass)`}/>
      <path d="m92 71 11 113" stroke="#fff" opacity=".28" strokeWidth="3" strokeLinecap="round"/>
      {!isAdditional && <g transform="translate(140 151) rotate(-5)">
        <text x="0" y="0" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="bold" fontSize="38" fill={isDark ? '#efd59c' : '#695384'} letterSpacing="-4">Cei</text>
        <text x="1" y="14" textAnchor="middle" fontFamily="sans-serif" fontSize="5.2" letterSpacing="1.8" fill={isDark ? '#efd59c' : '#695384'}>KEDAI KOPI</text>
      </g>}
    </g>
    <path d={isAdditional ? 'M84 102h112l-9 73q-2 14-47 14t-47-14z' : 'M83 59h114l-12 130q-2 15-45 15t-45-15z'} fill="none" stroke="#efeadc" strokeOpacity=".5" strokeWidth="1.5"/>
    <ellipse cx="140" cy={isAdditional ? 102 : 59} rx="57" ry="11" fill={foam || isAdditional ? '#eee1c5' : top} stroke="#f8efdd" strokeOpacity=".4"/>
    {(foam || isAdditional) && <><path d={isAdditional ? 'M84 102q0-17 24-19 4-17 26-11 22-14 37 8 25 2 25 22' : 'M83 59q0-10 20-13 20-8 37-5 38-3 57 18'} fill="#eee1c5"/><path d={isAdditional ? 'M105 92q35-12 68 0' : 'M106 53q32-7 64 0'} stroke="#c6ae86" fill="none" strokeWidth="1.5" opacity=".6"/></>}
    {!foam && !isAdditional && <ellipse cx="140" cy="59" rx="46" ry="6" fill="none" stroke="#efdaba" strokeOpacity=".3"/>}
  </svg>;
}

export function HeroArt() {
  return <div className="hero-art" aria-hidden="true">
    <span className="hero-orbit"/>
    <span className="hero-star star-one">✳</span><span className="hero-star star-two">✦</span>
    <div className="hero-cup cup-back"><DrinkArt name="Cei Aren" category="Milk Based" /></div>
    <div className="hero-cup cup-front"><DrinkArt name="Strawberry Matcha" category="Matcha Series" foam /></div>
    <span className="hero-stamp">Made with<br/><strong>a little Cei.</strong></span>
  </div>;
}
