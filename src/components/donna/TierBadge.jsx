import React from 'react';
/**
 * tier is an integer key. A string or a missing value would index style[tier] as
 * undefined and render an unstyled badge, so coerce before indexing.
 * @param {{tier:any}} props
 */
export default function TierBadge({tier}) {
 const value=Number(tier);const level=Number.isFinite(value)?Math.trunc(value):0;
 const style={1:'border-[#d5c4ae] bg-[#f2e9dc] text-[#735533]',2:'border-[#cfcec2] bg-[#efeee5] text-[#5c6147]',3:'border-[#d8dade] bg-[#f0f1f3] text-[#64707d]',0:'border-[#deded8] bg-[#f7f7f3] text-[#7d8078]'};
 return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.07em] ${style[level]||style[0]}`}>{level?`Tier ${level}`:'No change'}</span>;
}
