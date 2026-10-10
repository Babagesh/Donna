import React from 'react';
import { Info } from 'lucide-react';
export default function LiveDataNotice() {
 return <div className="reading-note mb-6"><Info size={17}/><span>Your companies and deals are private to your account; new accounts start empty. Identities are entered manually. External monitoring and live news are not connected yet.</span></div>;
}