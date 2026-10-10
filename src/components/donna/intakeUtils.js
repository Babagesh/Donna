export const fields = ['counterparty_name','country','deal_class','annual_value_usd','start_date','end_date','notice_days','share_pct','substitutability','owner_email','watch_terms'];
export function validateDeal(row) {
 const d={...row};
 for (const k of fields.slice(0,6)) if(!String(d[k]??'').trim()) throw new Error(`${k.replaceAll('_',' ')} is required.`);
 if(!['they_pay_us','we_pay_them','tied'].includes(d.deal_class)) throw new Error('Deal class must be they_pay_us, we_pay_them, or tied.');
 if(!/^[A-Za-z]{2}$/.test(d.country)) throw new Error('Use a two-letter country code.');
 for(const k of ['annual_value_usd','notice_days','share_pct']) {if(d[k]!==''&&d[k]!=null){d[k]=Number(d[k]);if(!Number.isFinite(d[k])||d[k]<0)throw new Error(`${k} must be a non-negative number.`);}}
 if(d.share_pct>100)throw new Error('Share cannot exceed 100%.');
 for(const k of ['start_date','end_date']) if(!/^\d{4}-\d{2}-\d{2}$/.test(d[k])||Number.isNaN(Date.parse(d[k]))||new Date(d[k]).toISOString().slice(0,10)!==d[k])throw new Error('Use valid YYYY-MM-DD dates.');
 if(d.end_date<d.start_date)throw new Error('End date cannot be before start date.');
 if(d.substitutability&&!['week','quarter','hard'].includes(d.substitutability))throw new Error('Substitutability must be week, quarter, or hard.');
 if(d.owner_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.owner_email))throw new Error('Enter a valid owner email.');
 d.country=d.country.toUpperCase();return d;
}
export function parseCSV(text) {
 const rows=[];let row=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('CSV contains an unclosed quoted field.');
 if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
 const header=rows.shift()?.map(v=>v.trim());if(!header||fields.slice(0,6).some(k=>!header.includes(k)))throw new Error('CSV is missing required columns. Download the template for the expected format.');
 if(new Set(header).size!==header.length)throw new Error('CSV contains duplicate column names.');
 const records=rows.filter(r=>r.some(v=>v.trim())).map((r,i)=>{if(r.length!==header.length)throw new Error(`Row ${i+2}: column count does not match the header.`);try{return validateDeal(Object.fromEntries(header.map((h,j)=>[h,r[j].trim()])));}catch(e){throw new Error(`Row ${i+2}: ${e.message}`);}});
 if(!records.length||records.length>100)throw new Error('Import between 1 and 100 deals at a time.');return records;
}
export function downloadText(text,name,type='text/markdown'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}