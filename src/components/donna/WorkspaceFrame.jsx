import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, FileText, Inbox, ListChecks, Layers3, ArrowUpRight, PanelLeftClose, Menu, X, ChevronDown, ShieldCheck, LayoutGrid } from 'lucide-react';
import { useDemo } from '@/components/donna/DemoStore';
import { UserButton } from '@clerk/clerk-react';
import useClerkIdentity from '@/components/donna/live/useClerkIdentity';
const demoLinks=[['/demo','Sample book',BookOpen],['/briefings','Sample briefings',FileText],['/intake','Demo deal intake',Inbox],['/review','Demo resolution review',ListChecks],['/coverage','Sample coverage',Layers3],['/sign-in','Sign in to my book',LayoutGrid]];
// `/` is the monitoring book once signed in past the second factor; the deal
// list moved to `/deals`. Both need a link, or the one that isn't the landing
// route is unreachable by navigation.
const liveLinks=[['/','Book',BookOpen],['/live-briefings','Briefings',FileText],['/live-coverage','Source coverage',Layers3],['/deals','Agreements',LayoutGrid],['/live-intake','Add deals',Inbox],['/live-review','Entity review',ListChecks]];
export default function WorkspaceFrame(){
 const [open,setOpen]=useState(false);const {pathname}=useLocation();const {deals}=useDemo();const reviews=deals.filter(d=>d.status==='needs_review').length;
 // Safe when Clerk is unconfigured: a bare useUser() here threw without a
 // provider above it, so a missing key whited out every page with chrome.
 const {user,isLoaded,isSignedIn}=useClerkIdentity();
 /*
  * One exception to rendering the chrome, and it exists so that WorkspaceLayout
  * can sit OUTSIDE ClerkGate on `/` without wrecking the landing page.
  *
  * The layout has to be outside the gate, or the gate's waiting states --
  * loading, Clerk sign-in, second factor -- render with no sidebar and the app
  * looks unnavigable. But `/` signed out is the public landing page, which
  * brings its own header and brand and is emphatically not a "PRIVATE
  * WORKSPACE": wrapping it in this frame would double the brand and mislabel
  * it. So for that one state the frame steps aside and renders the page alone.
  *
  * While Clerk is still loading we keep the chrome, so the gate's "Loading
  * sign-in" state is navigable, as are the signed-in states after it.
  */
 if(pathname==='/'&&isLoaded&&!isSignedIn) return <Outlet/>;
 // `/deals` exactly must count as live. Matching only '/deals/' meant the deal
 // list rendered the FICTIONAL DEMO sidebar on a page showing real records --
 // the one confusion this product cannot afford.
 const live=pathname==='/'||pathname.startsWith('/sign-in')||pathname.startsWith('/sign-up')||pathname.startsWith('/live-')||pathname==='/deals'||pathname.startsWith('/deals/');const links=live?liveLinks:demoLinks;
 const section=links.find(([p])=>p===pathname)?.[1]||(pathname.startsWith('/sign-in')?'Sign in':pathname.startsWith('/sign-up')?'Create account':pathname.startsWith('/deals/')?'Deal details':pathname.startsWith('/live-company/')?'Company details':pathname.startsWith('/live-briefing/')?'Briefing':pathname.startsWith('/live-evidence/')?'Evidence record':pathname.startsWith('/company')?'Sample company':pathname.startsWith('/evidence')?'Sample evidence':pathname==='/plan'?'Implementation plan':'Sample briefing');
 return <div className="workspace"><aside className={`sidebar ${open?'sidebar-open':''}`}><Link to={live?'/':'/demo'} className="brand" onClick={()=>setOpen(false)}><span className="brand-mark">d</span><span>donna<span className="brand-period">.</span></span></Link><button className="mobile-close" onClick={()=>setOpen(false)} aria-label="Close navigation"><X size={20}/></button><div className="workspace-label"><span className="workspace-avatar">D</span><div><strong>Donna workspace</strong><small>Counterparty intelligence</small></div><ChevronDown size={13}/></div><div className="nav-caption">WORKSPACE</div><nav>{links.map(([path,label,Icon])=><NavLink end={path==='/'} key={path} to={path} onClick={()=>setOpen(false)} className={({isActive})=>`nav-link ${isActive?'nav-active':''}`}><Icon size={17}/><span>{label}</span>{path==='/review'&&reviews>0&&<b className="nav-count">{reviews}</b>}</NavLink>)}</nav><div className="sidebar-bottom"><div className="evidence-principle"><ShieldCheck size={19}/><p>Evidence before inference.<br/><span>Every observation has a source.</span></p></div><NavLink to="/plan" className="nav-link" onClick={()=>setOpen(false)}><FileText size={16}/><span>Implementation plan</span><ArrowUpRight size={14}/></NavLink><div className="sidebar-profile"><span className="profile-avatar">DA</span><div><strong>{live?(user?.fullName||user?.primaryEmailAddress?.emailAddress||'Clerk account'):'Demo analyst'}</strong><small>{live?'Your private workspace':'Public sample workspace'}</small></div><PanelLeftClose size={16}/></div></div></aside>{open&&<button className="nav-overlay" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
 <div className="workspace-main"><header className="topbar"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={()=>setOpen(true)} aria-label="Open navigation"><Menu size={19}/></button><span className="text-[#898d83]">Workspace</span><span className="text-[#c4c6bc]">/</span><span>{section}</span></div><div className="flex items-center gap-4"><span className="demo-label">{live?'PRIVATE WORKSPACE':'FICTIONAL DEMO'}</span>{live && user && <UserButton afterSignOutUrl="/" />}<span className="hidden sm:block text-[#898d83]">{live?new Date().toLocaleDateString('en-GB',{timeZone:'UTC'}):'10 Oct 2026'} <span className="mx-1">·</span> UTC</span></div></header><main className="page-container"><Outlet/></main><footer className="workspace-footer"><span>Observed facts. Traceable evidence. No health verdicts.</span><span>{live?'Account-scoped MongoDB records · Coverage copied from stored collection runs':'Fictional monitoring data · Live agreements stored separately'}</span></footer></div></div>;
}