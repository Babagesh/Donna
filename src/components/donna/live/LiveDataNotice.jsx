import React from 'react';
import { Info } from 'lucide-react';
export default function LiveDataNotice() {
 return <div className="reading-note mb-6"><Info size={17}/><span>Live agreements are stored in MongoDB and isolated to your signed-in account. Monitoring, briefings, and Ask Donna elsewhere remain fictional samples; no collectors or external registry checks are connected.</span></div>;
}