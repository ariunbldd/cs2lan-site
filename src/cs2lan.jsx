import { useState, useEffect } from "react";

const ADMIN_PW = "lan2024";
const FEE = 3000;

const C = {
  bg: "#060810", card: "#0B0D1A", card2: "#111425", border: "#1A1E38",
  accent: "#4F79FF", accentBg: "#4F79FF12",
  gold: "#FFB830",
  text: "#DDE1F5", muted: "#454872",
  win: "#00C98D", winBg: "#00C98D12",
  loss: "#FF5252", lossBg: "#FF525212",
};

// ─── Shared storage (neelttei: everyone sees same data) ───
const store = {
  async get(k) {
    try { const r = await window.storage.get(k, true); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async set(k, v) {
    try { await window.storage.set(k, JSON.stringify(v), true); } catch {}
  }
};

const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB", { year:"numeric", month:"short", day:"numeric" }) : "";
const fmtFee = n => n.toLocaleString() + "₮";

const AVATAR_COLORS = ["#4F79FF","#8B5CF6","#00C98D","#FFB830","#FF5252","#06B6D4","#EC4899","#F97316"];
const avatarColor = (name="") => {
  let h=0; for (const c of name) h=((h<<5)-h+c.charCodeAt(0))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
};
const initials = (name="") => name.split(/[\s_\-.]+/).map(w=>w[0]||"").join("").toUpperCase().slice(0,2)||"?";

// ─── UI Primitives ───

const Avatar = ({ name, src, size=44, style }) => {
  const [ok,setOk] = useState(true);
  useEffect(()=>setOk(true),[src]);
  const c = avatarColor(name);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0,
      background:c+"28", border:`2px solid ${c}55`,
      display:"flex", alignItems:"center", justifyContent:"center", ...style }}>
      {src&&ok
        ? <img src={src} alt={name} onError={()=>setOk(false)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        : <span style={{fontSize:size*.36,fontWeight:800,color:c,lineHeight:1}}>{initials(name)}</span>}
    </div>
  );
};

const Card = ({children,style}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,...style}}>
    {children}
  </div>
);

const Btn = ({children,onClick,variant="primary",style,disabled}) => {
  const v = {
    primary:   {background:C.accent,    color:"#fff", border:"none"},
    secondary: {background:"transparent",color:C.text, border:`1px solid ${C.border}`},
    danger:    {background:C.lossBg,    color:C.loss, border:`1px solid ${C.loss}44`},
    success:   {background:C.winBg,     color:C.win,  border:`1px solid ${C.win}55`},
    ghost:     {background:"transparent",color:C.muted,border:"none"},
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:"9px 20px",borderRadius:9,cursor:disabled?"not-allowed":"pointer",
        fontFamily:"inherit",fontSize:13,fontWeight:700,letterSpacing:".3px",
        opacity:disabled?.4:1,transition:"opacity .15s",...v[variant],...style}}>
      {children}
    </button>
  );
};

const Input = ({value,onChange,placeholder,type="text",style,onKeyDown}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
    style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,
      color:C.text,padding:"10px 14px",fontSize:14,fontFamily:"inherit",
      outline:"none",width:"100%",boxSizing:"border-box",...style}}/>
);

const Label = ({children}) => (
  <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:7}}>
    {children}
  </div>
);

const Badge = ({children,color=C.accent}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,
    borderRadius:5,padding:"2px 9px",fontSize:11,fontWeight:700,letterSpacing:".8px",
    textTransform:"uppercase",whiteSpace:"nowrap"}}>{children}</span>
);

const Alert = ({msg,onClose,type="info"}) => {
  if (!msg) return null;
  const col = type==="error"?C.loss:type==="success"?C.win:C.accent;
  return (
    <div style={{background:col+"15",border:`1px solid ${col}44`,borderRadius:10,
      padding:"12px 16px",marginBottom:16,fontSize:13,color:C.text,
      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>}
    </div>
  );
};

const StatBox = ({label,value,color}) => (
  <div style={{background:C.card2,borderRadius:10,padding:"14px 10px",textAlign:"center"}}>
    <div style={{fontSize:22,fontWeight:900,color:color||C.text,lineHeight:1}}>{value}</div>
    <div style={{fontSize:10,color:C.muted,marginTop:6,letterSpacing:"1px",textTransform:"uppercase"}}>{label}</div>
  </div>
);

const SelectField = ({value,onChange,children}) => (
  <select value={value} onChange={onChange}
    style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,
      color:C.text,padding:"10px 14px",fontSize:14,fontFamily:"inherit",width:"100%",outline:"none"}}>
    {children}
  </select>
);

// ─── Fake QR Code (SVG pattern) ───

function QRPattern({seed="x",size=160}) {
  const N=21; const cs=size/N;
  let h=0; for (const c of seed) h=((h<<5)-h+c.charCodeAt(0))|0;
  const rnd=i=>{const x=Math.sin(h*9301+i*49297+233)*10000;return x-Math.floor(x);};
  const cells=[];
  for (let r=0;r<N;r++) for (let c=0;c<N;c++) {
    const isTL=r<7&&c<7,isTR=r<7&&c>N-8,isBL=r>N-8&&c<7;
    if (isTL||isTR||isBL) {
      const lr=isBL?r-(N-7):r, lc=isTR?c-(N-7):c;
      cells.push({r,c,dark:lr===0||lr===6||lc===0||lc===6||(lr>=2&&lr<=4&&lc>=2&&lc<=4)});
    } else {
      cells.push({r,c,dark:rnd(r*N+c)>0.52});
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx="8"/>
      {cells.filter(m=>m.dark).map((m,i)=>(
        <rect key={i} x={m.c*cs+.5} y={m.r*cs+.5} width={cs-1} height={cs-1} fill="#0B0D1A" rx=".5"/>
      ))}
    </svg>
  );
}

// ─── QPay Modal ───

function QPayModal({playerName,eventTitle,onPaid,onClose}) {
  const ref = `LAN-${playerName.slice(0,3).toUpperCase()}-${(Math.random()*9000+1000|0)}`;
  const [done,setDone] = useState(false);

  if (done) return (
    <div style={{position:"fixed",inset:0,background:"#000C",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <Card style={{maxWidth:360,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:16}}>✅</div>
        <div style={{fontWeight:800,fontSize:20,marginBottom:8}}>Баярлалаа!</div>
        <div style={{color:C.muted,fontSize:14,marginBottom:20,lineHeight:1.7}}>
          Таны бүртгэл хадгалагдлаа.<br/>Admin төлбөрийг баталгаажуулсны дараа жагсаалтад харагдана.
        </div>
        <div style={{background:C.card2,borderRadius:10,padding:"14px 16px",marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:6,letterSpacing:"1px"}}>ЛАВЛАХ ДУГААР — ХАДГАЛААРАЙ</div>
          <div style={{fontWeight:900,fontSize:22,color:C.gold,letterSpacing:3}}>{ref}</div>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:20}}>
          Admin-д энэ дугаараа мессеж илгээгээрэй.
        </div>
        <Btn onClick={onClose} style={{width:"100%"}}>Хаах</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"#000C",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card style={{maxWidth:360,width:"100%",padding:0,overflow:"hidden"}}>
        {/* QPay header */}
        <div style={{background:"linear-gradient(135deg,#1a56db,#1e3a8a)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{background:"white",borderRadius:7,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontWeight:900,fontSize:16,color:"#1a56db"}}>Q</span>
            </div>
            <div>
              <div style={{color:"white",fontWeight:800,fontSize:16}}>QPay</div>
              <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>Найдвартай төлбөр</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.2)",border:"none",color:"white",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        <div style={{padding:20}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{eventTitle}</div>
            <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>{playerName} — оролцох хураамж</div>
            <div style={{fontSize:38,fontWeight:900,color:C.text}}>{fmtFee(FEE)}</div>
          </div>

          {/* QR */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <div style={{padding:10,background:"white",borderRadius:14,boxShadow:"0 4px 20px rgba(0,0,0,.4)"}}>
              <QRPattern seed={ref} size={156}/>
            </div>
          </div>

          {/* Payment details */}
          <div style={{background:C.card2,borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:C.muted}}>Хүлээн авагч</span>
              <span style={{fontWeight:700}}>CS2 LAN Tournament</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:C.muted}}>Дүн</span>
              <span style={{fontWeight:700,color:C.accent}}>{fmtFee(FEE)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{color:C.muted}}>Лавлах</span>
              <span style={{fontWeight:700,color:C.gold,letterSpacing:1}}>{ref}</span>
            </div>
          </div>

          {/* Why fee */}
          <div style={{background:"#FFB83010",border:"1px solid #FFB83033",borderRadius:9,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.muted,lineHeight:1.7}}>
            💡 <strong style={{color:C.text}}>Яагаад хураамж вэ?</strong><br/>
            LAN-ийн эцэст хамгийн сайн stats үзүүлсэн тоглогчийн PC-ний түрээсийн зардлыг нийт хuraамжаас нөхөн олгоно. Хамгийн сайн тоглоод үнэгүй тоглоорой! 🏆
          </div>

          <Btn onClick={()=>{onPaid(ref);setDone(true);}} style={{width:"100%"}}>
            ✓ Би QPay-р төлсөн
          </Btn>
          <div style={{textAlign:"center",marginTop:10,fontSize:11,color:C.muted}}>
            QPay апп нээгээд QR уншуулна уу
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Navbar ───

function Navbar({page,setPage,pendingPayments}) {
  const items = [
    {id:"home",    label:"Нүүр"},
    {id:"events",  label:"LAN өдрүүд"},
    {id:"players", label:"Тоглогчид"},
    {id:"admin",   label:"Admin"},
  ];
  return (
    <nav style={{background:"#04050D",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:920,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",overflowX:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:20,paddingRight:20,borderRight:`1px solid ${C.border}`,flexShrink:0,padding:"12px 20px 12px 0"}}>
          <div style={{width:30,height:30,background:C.accent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900}}>⊕</div>
          <span style={{color:C.text,fontWeight:900,fontSize:14,letterSpacing:"1px"}}>CS2 LAN</span>
        </div>
        {items.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{
            background:"none",border:"none",cursor:"pointer",padding:"18px 14px",
            color:page===n.id?C.text:C.muted,fontFamily:"inherit",fontSize:13,fontWeight:600,
            borderBottom:page===n.id?`2px solid ${C.accent}`:"2px solid transparent",
            transition:"color .15s",flexShrink:0,whiteSpace:"nowrap",position:"relative",
          }}>
            {n.label}
            {n.id==="admin"&&pendingPayments>0&&(
              <span style={{position:"absolute",top:10,right:6,background:C.loss,color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {pendingPayments}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Home Page ───

function HomePage({events,matches,registrations,playerList,setPage}) {
  const upcoming = events.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const recentMatches = [...matches].reverse().slice(0,3);
  const allNames = [...new Set(registrations.map(r=>r.playerName))];
  const topPlayers = [...playerList].sort((a,b)=>{
    const ka=a.deaths?a.kills/a.deaths:a.kills, kb=b.deaths?b.kills/b.deaths:b.kills;
    return kb-ka;
  }).slice(0,3);

  return (
    <div>
      {/* Hero */}
      <div style={{textAlign:"center",padding:"52px 0 40px"}}>
        <div style={{fontSize:11,letterSpacing:"3px",color:C.accent,fontWeight:700,marginBottom:16}}>НАЙЗУУДЫН PRIVATE LAN TOURNAMENT</div>
        <h1 style={{margin:0,fontSize:52,fontWeight:900,color:C.text,letterSpacing:"-2px",lineHeight:1.05}}>
          CS2 <span style={{color:C.accent}}>LAN</span>
        </h1>
        <p style={{color:C.muted,marginTop:14,fontSize:15,lineHeight:1.7}}>
          Бүртгүүлэх · Тоглох · Хамгийн сайн тоглогч үнэгүй PC
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}>
          <Btn onClick={()=>setPage("events")} style={{fontSize:14,padding:"11px 28px"}}>LAN-д бүртгүүлэх</Btn>
          <Btn variant="secondary" onClick={()=>setPage("players")} style={{fontSize:14,padding:"11px 28px"}}>Leaderboard</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
        {[
          {label:"Нийт тоглолт", value:matches.length},
          {label:"Тоглогчид",    value:allNames.length},
          {label:"LAN events",   value:events.length},
        ].map(s=>(
          <Card key={s.label} style={{textAlign:"center",padding:"20px 12px"}}>
            <div style={{fontSize:38,fontWeight:900,color:C.accent,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginTop:7}}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
        {/* Next LAN */}
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:"1px",marginBottom:12}}>ДАРААГИЙН LAN</div>
          {upcoming.length>0 ? (
            <Card style={{borderColor:C.accent+"55",background:`linear-gradient(135deg,${C.card},${C.accent}08)`}}>
              <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"1px",marginBottom:10}}>UPCOMING</div>
              <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>{upcoming[0].title}</div>
              <div style={{color:C.muted,fontSize:14,marginBottom:16}}>{fmt(upcoming[0].date)}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:C.win,fontWeight:700}}>
                  {registrations.filter(r=>r.eventId===upcoming[0].id&&r.status==="confirmed").length} баталгаажсан
                </span>
                <Btn onClick={()=>setPage("events")} style={{padding:"7px 14px",fontSize:12}}>Бүртгүүлэх →</Btn>
              </div>
            </Card>
          ) : (
            <Card style={{textAlign:"center",padding:"32px 20px"}}>
              <div style={{color:C.muted,fontSize:14,marginBottom:14}}>Товлосон LAN байхгүй</div>
              <Btn variant="secondary" onClick={()=>setPage("events")} style={{fontSize:12}}>LAN өдөр хүсэх</Btn>
            </Card>
          )}
        </div>

        {/* Top 3 */}
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:"1px",marginBottom:12}}>ТОП ТОГЛОГЧИД</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {topPlayers.length===0
              ? <Card style={{textAlign:"center",padding:"32px 20px"}}><div style={{color:C.muted,fontSize:13}}>Тоглолт бүртгэгдээгүй</div></Card>
              : topPlayers.map((p,i)=>{
                  const kd = p.deaths?p.kills/p.deaths:p.kills;
                  return (
                    <Card key={p.name} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderColor:i===0?C.gold+"44":C.border}}>
                      <span style={{fontSize:i===0?20:16,width:28,textAlign:"center"}}>{["🥇","🥈","🥉"][i]}</span>
                      <Avatar name={p.name} size={32}/>
                      <span style={{fontWeight:700,flex:1,fontSize:14}}>{p.name}</span>
                      <Badge color={i===0?C.gold:C.accent}>KD {kd.toFixed(2)}</Badge>
                    </Card>
                  );
                })
            }
          </div>
        </div>
      </div>

      {/* Recent matches */}
      {recentMatches.length>0&&(
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:"1px",marginBottom:12}}>СҮҮЛИЙН ТОГЛОЛТУУД</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {recentMatches.map(m=>(
              <Card key={m.id} style={{padding:"13px 20px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:12}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:800,color:m.winner===1?C.win:C.loss,marginBottom:2}}>{m.team1Name||"Там 1"}</div>
                  <div style={{fontSize:11,color:C.muted}}>{m.team1Players?.join(", ")||""}</div>
                </div>
                <div style={{fontWeight:900,fontSize:22,textAlign:"center",minWidth:70,color:C.text}}>
                  {m.team1Kills} — {m.team2Kills}
                </div>
                <div>
                  <div style={{fontWeight:800,color:m.winner===2?C.win:C.loss,marginBottom:2}}>{m.team2Name||"Там 2"}</div>
                  <div style={{fontSize:11,color:C.muted}}>{m.team2Players?.join(", ")||""}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Fee explainer */}
      <Card style={{marginTop:24,borderColor:C.gold+"44",background:`linear-gradient(135deg,${C.card},${C.gold}06)`}}>
        <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{fontSize:36}}>🏆</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,marginBottom:6,color:C.gold}}>Хамгийн сайн тоглогчид урамшуулал</div>
            <div style={{fontSize:14,color:C.muted,lineHeight:1.8}}>
              LAN тутамд нэг хүн <strong style={{color:C.text}}>3,000₮</strong> хураамж төлнө.
              Тоглолт дууссаны дараа хамгийн сайн K/D ratio үзүүлсэн тоглогчийн
              <strong style={{color:C.text}}> PC-ний түрээсийн зардлыг</strong> нийт хураамжаас нөхөн олгоно.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Events Page ───

function EventsPage({events,requests,registrations,saveRequests,saveEvents,saveRegistrations}) {
  const [tab,setTab] = useState("upcoming");
  const [showReq,setShowReq] = useState(false);
  const [reqDate,setReqDate] = useState(""); const [reqName,setReqName] = useState(""); const [reqNote,setReqNote] = useState("");
  const [regEventId,setRegEventId] = useState(null);
  const [regName,setRegName] = useState(""); const [regPhone,setRegPhone] = useState("");
  const [pending,setPending] = useState(null);
  const [showQPay,setShowQPay] = useState(false);
  const [msg,setMsg] = useState(""); const [msgType,setMsgType] = useState("info");

  const upcoming = events.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const past = events.filter(e=>new Date(e.date)<new Date()).sort((a,b)=>new Date(b.date)-new Date(a.date));

  const sendReq = () => {
    if (!reqDate||!reqName.trim()) return;
    saveRequests([...requests,{id:uid(),date:reqDate,requestedBy:reqName.trim(),note:reqNote,status:"pending",createdAt:new Date().toISOString()}]);
    setMsg("✓ Хүсэлт илгээгдлээ! Admin батлах хүртэл хүлээнэ үү."); setMsgType("success");
    setReqDate(""); setReqName(""); setReqNote(""); setShowReq(false);
  };

  const startReg = (evId) => { setRegEventId(evId); setRegName(""); setRegPhone(""); };

  const submitReg = (ev) => {
    if (!regName.trim()) return;
    const exists = registrations.find(r=>r.eventId===regEventId&&r.playerName.toLowerCase()===regName.trim().toLowerCase());
    if (exists) { setMsg("Энэ нэрээр аль хэдийн бүртгүүлсэн байна."); setMsgType("error"); return; }
    setPending({eventId:regEventId, playerName:regName.trim(), phone:regPhone.trim(), eventTitle:ev.title});
    setRegEventId(null);
    setShowQPay(true);
  };

  const onPaid = (ref) => {
    saveRegistrations([...registrations,{id:uid(),...pending,paymentRef:ref,status:"pending_payment",registeredAt:new Date().toISOString()}]);
    setMsg(`✓ ${pending.playerName} бүртгэгдлээ! Admin баталгаажуулна. Лавлах: ${ref}`); setMsgType("success");
    setPending(null);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:800}}>LAN Өдрүүд</h2>
        <Btn onClick={()=>setShowReq(!showReq)}>+ LAN өдөр хүсэх</Btn>
      </div>

      <Alert msg={msg} onClose={()=>setMsg("")} type={msgType}/>

      {showReq&&(
        <Card style={{marginBottom:24,borderColor:C.accent+"44"}}>
          <div style={{fontSize:12,fontWeight:700,color:C.accent,letterSpacing:"1px",marginBottom:16}}>LAN ӨДӨР ХҮСЭХ</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div><Label>Огноо</Label><Input type="date" value={reqDate} onChange={e=>setReqDate(e.target.value)}/></div>
            <div><Label>Таны нэр</Label><Input value={reqName} onChange={e=>setReqName(e.target.value)} placeholder="Нэрээ оруулна уу"/></div>
          </div>
          <div style={{marginBottom:16}}><Label>Тайлбар</Label><Input value={reqNote} onChange={e=>setReqNote(e.target.value)} placeholder="Газар, цаг гэх мэт..."/></div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={sendReq} disabled={!reqDate||!reqName.trim()}>Илгээх</Btn>
            <Btn variant="secondary" onClick={()=>setShowReq(false)}>Болих</Btn>
          </div>
        </Card>
      )}

      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
        {[["upcoming","Дараагийн"],["past","Өнгөрсөн"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            background:"none",border:"none",cursor:"pointer",padding:"10px 18px",
            color:tab===id?C.text:C.muted,fontFamily:"inherit",fontSize:13,fontWeight:600,
            borderBottom:tab===id?`2px solid ${C.accent}`:"2px solid transparent"}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {(tab==="upcoming"?upcoming:past).map(ev=>{
          const regs = registrations.filter(r=>r.eventId===ev.id);
          const confirmed = regs.filter(r=>r.status==="confirmed");
          const pendingPay = regs.filter(r=>r.status==="pending_payment");
          const isReg = regEventId===ev.id;
          return (
            <Card key={ev.id} style={{borderColor:C.accent+"33"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>{ev.title}</div>
                  <div style={{color:C.muted,fontSize:14,marginBottom:14}}>{fmt(ev.date)}</div>

                  <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <span style={{display:"flex",alignItems:"center",gap:6,fontSize:13}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:C.win,display:"inline-block"}}/>
                      <strong style={{color:C.win}}>{confirmed.length}</strong>
                      <span style={{color:C.muted}}>баталгаажсан</span>
                    </span>
                    {pendingPay.length>0&&(
                      <span style={{display:"flex",alignItems:"center",gap:6,fontSize:13}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:C.gold,display:"inline-block"}}/>
                        <span style={{color:C.muted}}>{pendingPay.length} хүлээгдэж байна</span>
                      </span>
                    )}
                    <span style={{fontSize:13,color:C.muted}}>🏷 {fmtFee(FEE)} / хүн</span>
                  </div>

                  {confirmed.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {confirmed.map(r=>(
                        <div key={r.id} style={{display:"flex",alignItems:"center",gap:7,background:C.card2,borderRadius:20,padding:"5px 14px"}}>
                          <Avatar name={r.playerName} size={24}/>
                          <span style={{fontSize:13,fontWeight:600}}>{r.playerName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {tab==="upcoming"&&(
                  <div style={{flexShrink:0}}>
                    {!isReg
                      ? <Btn onClick={()=>startReg(ev.id)}>Бүртгүүлэх</Btn>
                      : (
                        <Card style={{padding:16,borderColor:C.accent+"44",minWidth:280}}>
                          <div style={{fontSize:12,fontWeight:700,color:C.accent,letterSpacing:"1px",marginBottom:12}}>БҮРТГЭЛ</div>
                          <div style={{marginBottom:8}}><Label>Нэр / Хоч</Label><Input value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Таны нэр"/></div>
                          <div style={{marginBottom:14}}><Label>Утас (заавал биш)</Label><Input value={regPhone} onChange={e=>setRegPhone(e.target.value)} placeholder="99XXXXXX"/></div>
                          <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.6}}>
                            🏷 Хураамж: <strong style={{color:C.gold}}>{fmtFee(FEE)}</strong><br/>
                            QPay-р төлнө
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <Btn onClick={()=>submitReg(ev)} disabled={!regName.trim()} style={{flex:1}}>Үргэлжлүүлэх →</Btn>
                            <Btn variant="ghost" onClick={()=>setRegEventId(null)}>×</Btn>
                          </div>
                        </Card>
                      )
                    }
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {(tab==="upcoming"?upcoming:past).length===0&&(
          <div style={{textAlign:"center",padding:"52px 0",color:C.muted}}>
            {tab==="upcoming"?"Товлосон LAN байхгүй байна.":"Өнгөрсөн тоглолт байхгүй."}
          </div>
        )}
      </div>

      {showQPay&&pending&&(
        <QPayModal playerName={pending.playerName} eventTitle={pending.eventTitle}
          onPaid={onPaid} onClose={()=>setShowQPay(false)}/>
      )}
    </div>
  );
}

// ─── Players Page (profiles + leaderboard) ───

function PlayersPage({playerList,allPlayerNames,playerProfiles,saveProfiles}) {
  const [selectedName,setSelectedName] = useState(null);
  const [editing,setEditing] = useState(false);
  const [search,setSearch] = useState("");
  const [sort,setSort] = useState("kd");
  const [editAvatar,setEditAvatar] = useState("");
  const [editSteam,setEditSteam] = useState("");
  const [editBio,setEditBio] = useState("");

  const allPlayers = allPlayerNames.map(name=>{
    const s = playerList.find(p=>p.name===name)||{name,kills:0,deaths:0,wins:0,losses:0,matches:0};
    return s;
  });

  const sorted = [...allPlayers].sort((a,b)=>{
    if (sort==="kd") { const ka=a.deaths?a.kills/a.deaths:a.kills,kb=b.deaths?b.kills/b.deaths:b.kills; return kb-ka; }
    if (sort==="wins") return b.wins-a.wins;
    return b.kills-a.kills;
  });

  const filtered = sorted.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
  const kd = p => (p.deaths===0?(p.kills>0?p.kills:0):p.kills/p.deaths).toFixed(2);
  const kdCol = p => { const r=p.deaths?p.kills/p.deaths:p.kills; return r>=1.5?C.win:r>=1?C.text:r===0?C.muted:C.loss; };
  const wr = p => p.matches>0?Math.round(p.wins/p.matches*100):0;

  const startEdit = () => {
    const pr=playerProfiles[selectedName]||{};
    setEditAvatar(pr.avatarUrl||""); setEditSteam(pr.steam||""); setEditBio(pr.bio||"");
    setEditing(true);
  };
  const saveEdit = () => {
    saveProfiles({...playerProfiles,[selectedName]:{avatarUrl:editAvatar.trim(),steam:editSteam.trim(),bio:editBio.trim()}});
    setEditing(false);
  };

  if (selectedName) {
    const p = allPlayers.find(x=>x.name===selectedName);
    const pr = playerProfiles[selectedName]||{};
    const ac = avatarColor(selectedName);
    if (!p) return <Btn variant="ghost" onClick={()=>setSelectedName(null)}>← Буцах</Btn>;
    return (
      <div>
        <button onClick={()=>{setSelectedName(null);setEditing(false);}}
          style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,marginBottom:20,display:"flex",alignItems:"center",gap:6,padding:0}}>
          ← Буцах
        </button>

        <Card style={{marginBottom:16,borderColor:ac+"55",background:`linear-gradient(135deg,${C.card},${ac}0A)`}}>
          <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
            <Avatar name={p.name} src={pr.avatarUrl} size={106} style={{border:`3px solid ${ac}66`}}/>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontSize:30,fontWeight:900,lineHeight:1.1,marginBottom:6}}>{p.name}</div>
              {pr.steam&&<div style={{fontSize:13,color:C.muted,marginBottom:8}}>🎮 {pr.steam}</div>}
              <div style={{marginBottom:12,display:"flex",gap:8,flexWrap:"wrap"}}>
                {p.matches>0&&<Badge color={wr(p)>=60?C.win:wr(p)>=40?C.gold:C.loss}>{wr(p)}% winrate</Badge>}
                {p.matches>0&&<Badge color={ac}>{p.matches} match</Badge>}
              </div>
              {pr.bio&&(
                <div style={{fontSize:14,color:C.muted,lineHeight:1.7,fontStyle:"italic",borderLeft:`3px solid ${ac}55`,paddingLeft:14}}>
                  "{pr.bio}"
                </div>
              )}
              {!pr.bio&&!editing&&<div style={{fontSize:13,color:C.muted+"66",fontStyle:"italic"}}>Bio оруулаагүй байна</div>}
            </div>
            <Btn variant="secondary" onClick={startEdit} style={{fontSize:12,flexShrink:0}}>✏ Засах</Btn>
          </div>
        </Card>

        {editing&&(
          <Card style={{marginBottom:16,borderColor:C.accent+"44"}}>
            <div style={{fontSize:12,fontWeight:700,color:C.accent,letterSpacing:"1px",marginBottom:16}}>ПРОФАЙЛ ЗАСАХ</div>
            <div style={{marginBottom:12}}>
              <Label>Профайл зурагны URL</Label>
              <Input value={editAvatar} onChange={e=>setEditAvatar(e.target.value)} placeholder="https://i.imgur.com/..."/>
              {editAvatar&&(
                <div style={{marginTop:10,display:"flex",gap:10,alignItems:"center"}}>
                  <Avatar name={p.name} src={editAvatar} size={52}/>
                  <span style={{fontSize:12,color:C.muted}}>Урьдчилан харах</span>
                </div>
              )}
            </div>
            <div style={{marginBottom:12}}><Label>Steam нэр</Label><Input value={editSteam} onChange={e=>setEditSteam(e.target.value)} placeholder="Steam username..."/></div>
            <div style={{marginBottom:20}}>
              <Label>Bio</Label>
              <textarea value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="Өөрийгөө товч танилцуул..." rows={3}
                style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"10px 14px",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={saveEdit}>Хадгалах</Btn>
              <Btn variant="secondary" onClick={()=>setEditing(false)}>Болих</Btn>
            </div>
          </Card>
        )}

        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:"1px",marginBottom:12}}>СТАТИСТИК</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          <StatBox label="K/D Ratio" value={kd(p)} color={kdCol(p)}/>
          <StatBox label="Win Rate"  value={wr(p)+"%"} color={wr(p)>=60?C.win:wr(p)>=40?C.gold:p.matches>0?C.loss:C.muted}/>
          <StatBox label="Wins"      value={p.wins}   color={C.win}/>
          <StatBox label="Losses"    value={p.losses} color={C.loss}/>
          <StatBox label="Kills"     value={p.kills}  color={C.accent}/>
          <StatBox label="Deaths"    value={p.deaths} color={C.muted}/>
          <StatBox label="Matches"   value={p.matches} color={C.text}/>
        </div>
        {p.kills+p.deaths>0&&(
          <Card>
            <div style={{fontSize:12,color:C.muted,fontWeight:700,letterSpacing:"1px",marginBottom:12}}>KILL / DEATH ХАРЬЦАА</div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:C.win,minWidth:50}}>{p.kills}K</span>
              <div style={{flex:1,height:8,background:C.card2,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:99,width:`${Math.round(p.kills/(p.kills+p.deaths)*100)}%`,background:`linear-gradient(90deg,${C.win},${C.accent})`}}/>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:C.loss,minWidth:50,textAlign:"right"}}>{p.deaths}D</span>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:800}}>Тоглогчид</h2>
        <div style={{display:"flex",gap:6}}>
          {[["kd","K/D"],["wins","Wins"],["kills","Kills"]].map(([id,label])=>(
            <button key={id} onClick={()=>setSort(id)} style={{
              background:sort===id?C.accent:C.card2,border:`1px solid ${sort===id?C.accent:C.border}`,
              color:sort===id?"#fff":C.muted,borderRadius:7,padding:"6px 14px",
              cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:20,position:"relative"}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:C.muted}}>🔍</span>
        <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Нэр хайх..." style={{paddingLeft:38}}/>
      </div>

      {allPlayers.length===0&&(
        <div style={{textAlign:"center",padding:"60px 0",color:C.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>👤</div>
          LAN-д бүртгүүлсэн тоглогчид энд харагдана
        </div>
      )}

      {filtered.length>0&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"40px 1fr 70px 70px 54px 54px",gap:8,padding:"8px 16px",marginBottom:4}}>
            {["#","Тоглогч","K/D","Kills","W","L"].map((h,i)=>(
              <div key={i} style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:"1px",textAlign:i>1?"center":"left"}}>{h}</div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,marginBottom:8}}/>
          {filtered.map((p,i)=>{
            const pr=playerProfiles[p.name]||{};
            return (
              <div key={p.name} onClick={()=>setSelectedName(p.name)}
                style={{display:"grid",gridTemplateColumns:"40px 1fr 70px 70px 54px 54px",gap:8,
                  padding:"12px 16px",borderRadius:10,cursor:"pointer",border:"1px solid transparent",
                  transition:"background .12s,border-color .12s",alignItems:"center",marginBottom:2}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.card2;e.currentTarget.style.borderColor=C.border;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
                <div style={{textAlign:"center",fontSize:i<3?18:13,fontWeight:800,color:i<3?[C.gold,"#A0A8C0","#C08050"][i]:C.muted}}>
                  {i<3?["🥇","🥈","🥉"][i]:i+1}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Avatar name={p.name} src={pr.avatarUrl} size={36}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{p.matches} match</div>
                  </div>
                </div>
                <div style={{textAlign:"center",fontWeight:800,fontSize:15,color:kdCol(p)}}>{kd(p)}</div>
                <div style={{textAlign:"center",color:C.muted,fontWeight:600}}>{p.kills}</div>
                <div style={{textAlign:"center",color:C.win,fontWeight:700}}>{p.wins}</div>
                <div style={{textAlign:"center",color:C.loss,fontWeight:700}}>{p.losses}</div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Admin Page ───

function AdminPage({isAdmin,setIsAdmin,events,requests,registrations,matches,saveEvents,saveRequests,saveRegistrations,saveMatches}) {
  const [pw,setPw] = useState(""); const [pwErr,setPwErr] = useState("");
  const [tab,setTab] = useState("payments");
  const [msg,setMsg] = useState(""); const [msgType,setMsgType] = useState("info");

  // Match form state
  const [mEventId,setMEventId] = useState("");
  const [mTeam1,setMTeam1] = useState([]); const [mTeam2,setMTeam2] = useState([]);
  const [mName1,setMName1] = useState(""); const [mName2,setMName2] = useState("");
  const [mKills1,setMKills1] = useState(""); const [mKills2,setMKills2] = useState("");
  const [mWinner,setMWinner] = useState(null);

  // Event form
  const [evTitle,setEvTitle] = useState(""); const [evDate,setEvDate] = useState("");

  const login = () => {
    if (pw===ADMIN_PW) { setIsAdmin(true); setPwErr(""); setPw(""); }
    else setPwErr("Нууц үг буруу байна.");
  };

  const approveReq = (req) => {
    saveEvents([...events,{id:uid(),title:`LAN — ${fmt(req.date)}`,date:req.date,createdAt:new Date().toISOString()}]);
    saveRequests(requests.map(r=>r.id===req.id?{...r,status:"approved"}:r));
    setMsg(`✓ LAN event үүслээ: ${fmt(req.date)}`); setMsgType("success");
  };
  const rejectReq = id => saveRequests(requests.map(r=>r.id===id?{...r,status:"rejected"}:r));
  const confirmPayment = id => {
    saveRegistrations(registrations.map(r=>r.id===id?{...r,status:"confirmed",confirmedAt:new Date().toISOString()}:r));
    setMsg("✓ Төлбөр баталгаажлаа."); setMsgType("success");
  };
  const rejectPayment = id => saveRegistrations(registrations.map(r=>r.id===id?{...r,status:"rejected"}:r));
  const addEvent = () => {
    if (!evTitle.trim()||!evDate) return;
    saveEvents([...events,{id:uid(),title:evTitle.trim(),date:evDate,createdAt:new Date().toISOString()}]);
    setMsg("✓ Event нэмэгдлээ."); setMsgType("success"); setEvTitle(""); setEvDate("");
  };
  const deleteEvent = id => saveEvents(events.filter(e=>e.id!==id));

  // Get selectable players for match (confirmed for event, or all confirmed)
  const getPlayers = () => {
    const regs = mEventId
      ? registrations.filter(r=>r.eventId===mEventId&&r.status==="confirmed")
      : registrations.filter(r=>r.status==="confirmed");
    return [...new Set(regs.map(r=>r.playerName))];
  };

  const assignPlayer = (name) => {
    if (mTeam1.includes(name)) { setMTeam1(p=>p.filter(x=>x!==name)); return; }
    if (mTeam2.includes(name)) { setMTeam2(p=>p.filter(x=>x!==name)); return; }
    if (mTeam1.length<=mTeam2.length) setMTeam1(p=>[...p,name]);
    else setMTeam2(p=>[...p,name]);
  };

  const addMatch = () => {
    if ((mTeam1.length===0&&!mName1.trim())||(mTeam2.length===0&&!mName2.trim())||!mWinner) { setMsg("Мэдээлэл дутуу байна."); setMsgType("error"); return; }
    const t1 = mTeam1.length>0?mTeam1:mName1.split(",").map(s=>s.trim()).filter(Boolean);
    const t2 = mTeam2.length>0?mTeam2:mName2.split(",").map(s=>s.trim()).filter(Boolean);
    saveMatches([...matches,{id:uid(),eventId:mEventId,date:new Date().toISOString(),
      team1Players:t1,team2Players:t2,team1Name:mName1||t1.join(", "),team2Name:mName2||t2.join(", "),
      team1Kills:parseInt(mKills1)||0,team2Kills:parseInt(mKills2)||0,winner:mWinner}]);
    setMsg("✓ Тоглолт бүртгэгдлээ!"); setMsgType("success");
    setMTeam1([]); setMTeam2([]); setMName1(""); setMName2(""); setMKills1(""); setMKills2(""); setMWinner(null);
  };

  if (!isAdmin) return (
    <div style={{maxWidth:360,margin:"80px auto"}}>
      <Card>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:12}}>🔐</div>
          <div style={{fontWeight:800,fontSize:18}}>Admin панел</div>
          <div style={{color:C.muted,fontSize:13,marginTop:6}}>Зөвхөн зохион байгуулагчдад</div>
        </div>
        <Label>Нууц үг</Label>
        <Input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Нууц үгээ оруулна уу" style={{marginBottom:8}} onKeyDown={e=>e.key==="Enter"&&login()}/>
        {pwErr&&<div style={{color:C.loss,fontSize:13,marginBottom:8}}>{pwErr}</div>}
        <Btn onClick={login} style={{width:"100%",marginTop:8}}>Нэвтрэх</Btn>
      </Card>
    </div>
  );

  const pendingPay = registrations.filter(r=>r.status==="pending_payment");
  const pendingReqs = requests.filter(r=>r.status==="pending");
  const selPlayers = getPlayers();

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:800}}>⚙ Admin панел</h2>
        <Btn variant="secondary" onClick={()=>setIsAdmin(false)}>Гарах</Btn>
      </div>

      <Alert msg={msg} onClose={()=>setMsg("")} type={msgType}/>

      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:24,overflowX:"auto"}}>
        {[
          ["payments", `Төлбөр (${pendingPay.length})`],
          ["requests", `Хүсэлт (${pendingReqs.length})`],
          ["match",    "Тоглолт оруулах"],
          ["events",   "Events"],
          ["history",  "Тоглолтын түүх"],
        ].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            background:"none",border:"none",cursor:"pointer",padding:"10px 16px",
            color:tab===id?C.text:C.muted,fontFamily:"inherit",fontSize:13,fontWeight:600,
            borderBottom:tab===id?`2px solid ${C.accent}`:"2px solid transparent",whiteSpace:"nowrap"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Payments */}
      {tab==="payments"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {pendingPay.length===0&&registrations.length>0&&<Alert msg="Хүлээгдэж буй төлбөр байхгүй байна." type="info"/>}
          {registrations.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:C.muted}}>Бүртгэл байхгүй.</div>}
          {[...registrations].filter(r=>r.status==="pending_payment"||r.status==="rejected").map(r=>{
            const ev=events.find(e=>e.id===r.eventId);
            return (
              <Card key={r.id} style={{borderColor:r.status==="pending_payment"?C.gold+"55":C.border}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <Avatar name={r.playerName} size={40}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:15}}>{r.playerName}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{ev?.title||"Unknown event"} · {fmtFee(FEE)}</div>
                      <div style={{fontSize:12,color:C.gold,marginTop:2}}>Лавлах: <strong>{r.paymentRef}</strong></div>
                      {r.phone&&<div style={{fontSize:11,color:C.muted}}>📞 {r.phone}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {r.status==="pending_payment"&&<>
                      <Btn variant="success" onClick={()=>confirmPayment(r.id)}>✓ Баталгаажуулах</Btn>
                      <Btn variant="danger"  onClick={()=>rejectPayment(r.id)}>✕</Btn>
                    </>}
                    {r.status==="rejected"&&<Badge color={C.loss}>Татгалзсан</Badge>}
                  </div>
                </div>
              </Card>
            );
          })}
          {/* Show confirmed too */}
          {registrations.filter(r=>r.status==="confirmed").map(r=>{
            const ev=events.find(e=>e.id===r.eventId);
            return (
              <Card key={r.id} style={{opacity:0.7}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Avatar name={r.playerName} size={34}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>{r.playerName}</div>
                    <div style={{fontSize:12,color:C.muted}}>{ev?.title}</div>
                  </div>
                  <Badge color={C.win}>Баталгаажсан</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Requests */}
      {tab==="requests"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {requests.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:C.muted}}>Хүсэлт байхгүй.</div>}
          {[...requests].reverse().map(r=>(
            <Card key={r.id} style={{borderColor:r.status==="pending"?C.accent+"44":C.border}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{fmt(r.date)}</div>
                  <div style={{fontSize:13,color:C.muted}}>{r.requestedBy}{r.note&&` · ${r.note}`}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {r.status==="pending"
                    ? <><Btn variant="success" onClick={()=>approveReq(r)}>✓ Зөвшөөрөх</Btn><Btn variant="danger" onClick={()=>rejectReq(r.id)}>✕</Btn></>
                    : <Badge color={r.status==="approved"?C.win:C.loss}>{r.status==="approved"?"Зөвшөөрсөн":"Татгалзсан"}</Badge>
                  }
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Match entry */}
      {tab==="match"&&(
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.accent,letterSpacing:"1px",marginBottom:20}}>ТОГЛОЛТЫН ҮР ДҮН ОРУУЛАХ</div>
          <div style={{marginBottom:14}}>
            <Label>LAN Event</Label>
            <SelectField value={mEventId} onChange={e=>{setMEventId(e.target.value);setMTeam1([]);setMTeam2([]);}}>
              <option value="">— Сонгох —</option>
              {events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
            </SelectField>
          </div>

          {selPlayers.length>0 ? (
            <div style={{marginBottom:14}}>
              <Label>Тоглогчдыг багт хувиарлах (дарж сонгоно уу)</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8,marginBottom:14}}>
                {selPlayers.map(name=>{
                  const inT1=mTeam1.includes(name), inT2=mTeam2.includes(name);
                  return (
                    <button key={name} onClick={()=>assignPlayer(name)} style={{
                      display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:20,
                      cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,transition:"all .15s",
                      background:inT1?C.accentBg:inT2?C.lossBg:C.card2,
                      border:`1px solid ${inT1?C.accent:inT2?C.loss:C.border}`,
                      color:inT1?C.accent:inT2?C.loss:C.text}}>
                      <Avatar name={name} size={22}/>
                      {name}
                      {inT1&&<span style={{fontSize:10}}>T1</span>}
                      {inT2&&<span style={{fontSize:10}}>T2</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{background:C.accentBg,border:`1px solid ${C.accent}33`,borderRadius:9,padding:"10px 14px"}}>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"1px",marginBottom:6}}>TEAM 1</div>
                  {mTeam1.length===0?<div style={{fontSize:13,color:C.muted}}>Хоосон</div>:mTeam1.map(n=><div key={n} style={{fontSize:13,marginBottom:2}}>• {n}</div>)}
                </div>
                <div style={{background:C.lossBg,border:`1px solid ${C.loss}33`,borderRadius:9,padding:"10px 14px"}}>
                  <div style={{fontSize:11,color:C.loss,fontWeight:700,letterSpacing:"1px",marginBottom:6}}>TEAM 2</div>
                  {mTeam2.length===0?<div style={{fontSize:13,color:C.muted}}>Хоосон</div>:mTeam2.map(n=><div key={n} style={{fontSize:13,marginBottom:2}}>• {n}</div>)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{marginBottom:14}}>
              <div style={{background:C.card2,borderRadius:9,padding:"12px 14px",marginBottom:12,fontSize:13,color:C.muted}}>
                Баталгаажсан тоглогч байхгүй — гараар нэр оруулна уу
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><Label>Team 1 тоглогчид</Label><Input value={mName1} onChange={e=>setMName1(e.target.value)} placeholder="Нэр, нэр, нэр"/></div>
                <div><Label>Team 2 тоглогчид</Label><Input value={mName2} onChange={e=>setMName2(e.target.value)} placeholder="Нэр, нэр, нэр"/></div>
              </div>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div><Label>Team 1 Kills</Label><Input type="number" value={mKills1} onChange={e=>setMKills1(e.target.value)} placeholder="0"/></div>
            <div><Label>Team 2 Kills</Label><Input type="number" value={mKills2} onChange={e=>setMKills2(e.target.value)} placeholder="0"/></div>
          </div>

          <div style={{marginBottom:20}}>
            <Label>Ялагч</Label>
            <div style={{display:"flex",gap:10}}>
              {[1,2].map(t=>(
                <button key={t} onClick={()=>setMWinner(t)} style={{
                  flex:1,padding:"12px",borderRadius:9,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,
                  background:mWinner===t?C.winBg:C.card2,border:`1px solid ${mWinner===t?C.win:C.border}`,
                  color:mWinner===t?C.win:C.text,transition:"all .15s"}}>
                  {mWinner===t?"✓ ":""}Team {t}
                </button>
              ))}
            </div>
          </div>
          <Btn onClick={addMatch} style={{width:"100%"}} disabled={!mWinner||(mTeam1.length===0&&!mName1.trim())||(mTeam2.length===0&&!mName2.trim())}>
            Тоглолт бүртгэх
          </Btn>
        </Card>
      )}

      {/* Events */}
      {tab==="events"&&(
        <div>
          <Card style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:C.accent,letterSpacing:"1px",marginBottom:16}}>ШИНЭ LAN НЭМЭХ</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"end"}}>
              <div><Label>Гарчиг</Label><Input value={evTitle} onChange={e=>setEvTitle(e.target.value)} placeholder="LAN #3"/></div>
              <div><Label>Огноо</Label><Input type="date" value={evDate} onChange={e=>setEvDate(e.target.value)}/></div>
              <Btn onClick={addEvent} disabled={!evTitle.trim()||!evDate}>Нэмэх</Btn>
            </div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {events.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:C.muted}}>Event байхгүй.</div>}
            {[...events].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e=>(
              <Card key={e.id} style={{padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700}}>{e.title}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{fmt(e.date)} · {registrations.filter(r=>r.eventId===e.id&&r.status==="confirmed").length} баталгаажсан</div>
                </div>
                <Btn variant="danger" onClick={()=>deleteEvent(e.id)} style={{padding:"6px 12px",fontSize:12}}>Устгах</Btn>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {tab==="history"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {matches.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:C.muted}}>Тоглолт бүртгэгдээгүй.</div>}
          {[...matches].reverse().map(m=>(
            <Card key={m.id} style={{padding:"13px 18px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto",alignItems:"center",gap:12}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:800,color:m.winner===1?C.win:C.loss}}>{m.team1Name||"Team 1"}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.team1Players?.join(", ")}</div>
                </div>
                <div style={{fontWeight:900,fontSize:20,textAlign:"center",minWidth:70}}>{m.team1Kills} : {m.team2Kills}</div>
                <div>
                  <div style={{fontWeight:800,color:m.winner===2?C.win:C.loss}}>{m.team2Name||"Team 2"}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.team2Players?.join(", ")}</div>
                </div>
                <button onClick={()=>saveMatches(matches.filter(x=>x.id!==m.id))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root ───

export default function App() {
  const [page,setPage] = useState("home");
  const [events,setEvents] = useState([]);
  const [requests,setReqs] = useState([]);
  const [registrations,setRegs] = useState([]);
  const [matches,setMatches] = useState([]);
  const [playerProfiles,setProfiles] = useState({});
  const [isAdmin,setIsAdmin] = useState(false);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      const [e,r,rg,m,pp] = await Promise.all([
        store.get("cs2_events"), store.get("cs2_requests"),
        store.get("cs2_regs"),   store.get("cs2_matches"),
        store.get("cs2_profiles"),
      ]);
      setEvents(e||[]); setReqs(r||[]); setRegs(rg||[]); setMatches(m||[]); setProfiles(pp||{});
      setLoading(false);
    })();
  },[]);

  const saveEvents  = v=>{setEvents(v);  store.set("cs2_events",  v);};
  const saveReqs    = v=>{setReqs(v);    store.set("cs2_requests",v);};
  const saveRegs    = v=>{setRegs(v);    store.set("cs2_regs",    v);};
  const saveMatches = v=>{setMatches(v); store.set("cs2_matches", v);};
  const saveProfiles= v=>{setProfiles(v);store.set("cs2_profiles",v);};

  // Compute player stats from matches
  const playerStats = {};
  const allRegNames = [...new Set(registrations.map(r=>r.playerName))];
  allRegNames.forEach(name=>{ playerStats[name]={name,kills:0,deaths:0,wins:0,losses:0,matches:0}; });

  matches.forEach(m=>{
    const t1=m.team1Players||[], t2=m.team2Players||[];
    const n1=Math.max(t1.length,1), n2=Math.max(t2.length,1);
    t1.forEach(name=>{
      if(!playerStats[name]) playerStats[name]={name,kills:0,deaths:0,wins:0,losses:0,matches:0};
      playerStats[name].kills  +=Math.round(m.team1Kills/n1);
      playerStats[name].deaths +=Math.round(m.team2Kills/n1);
      playerStats[name].matches+=1;
      if(m.winner===1) playerStats[name].wins++; else playerStats[name].losses++;
    });
    t2.forEach(name=>{
      if(!playerStats[name]) playerStats[name]={name,kills:0,deaths:0,wins:0,losses:0,matches:0};
      playerStats[name].kills  +=Math.round(m.team2Kills/n2);
      playerStats[name].deaths +=Math.round(m.team1Kills/n2);
      playerStats[name].matches+=1;
      if(m.winner===2) playerStats[name].wins++; else playerStats[name].losses++;
    });
  });

  const playerList = Object.values(playerStats);
  const allPlayerNames = [...new Set([...allRegNames,...matches.flatMap(m=>[...(m.team1Players||[]),...(m.team2Players||[])])])];
  const pendingPayments = registrations.filter(r=>r.status==="pending_payment").length;

  if (loading) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>
      <div style={{color:C.accent,letterSpacing:"3px",fontSize:14}}>LOADING...</div>
    </div>
  );

  const shared = {events,requests,registrations,matches,saveEvents,saveRequests:saveReqs,saveRegistrations:saveRegs,saveMatches,isAdmin};

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",color:C.text}}>
      <Navbar page={page} setPage={setPage} pendingPayments={pendingPayments}/>
      <div style={{maxWidth:920,margin:"0 auto",padding:"24px 16px 60px"}}>
        {page==="home"    && <HomePage    {...{events,matches,registrations,playerList}} setPage={setPage}/>}
        {page==="events"  && <EventsPage  {...shared}/>}
        {page==="players" && <PlayersPage {...{playerList,allPlayerNames,playerProfiles,saveProfiles}}/>}
        {page==="admin"   && <AdminPage   {...shared} setIsAdmin={setIsAdmin} isAdmin={isAdmin}/>}
      </div>
    </div>
  );
}
