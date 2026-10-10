import React from 'react';
import { Info } from 'lucide-react';
export default function LiveDataNotice() {
 return <div className="reading-note mb-6"><Info size={17}/><span>Your companies, deals and monitoring records are private to your account; new accounts start empty. Identities are entered manually. Signals, briefings and coverage show only what has been collected and stored for your account — an empty view means nothing was checked, not that nothing changed.</span></div>;
}
