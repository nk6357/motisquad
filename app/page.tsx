"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Path = "founder" | "talent";
type AuthMode = "login" | "register";
type Project = { id:string;name:string;category:string;title:string;description:string;specialization:string;level:string;format:string;teamSize:number };
type Talent = { id:string;name:string;role:string;specialization:string;level:string;format:string;bio:string;stack:string };
type User = { id:string;name:string;role:Path;email?:string };

function SignalCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);

      for (let line = 0; line < 22; line += 1) {
        const lime = line > 10;
        context.beginPath();
        context.strokeStyle = lime ? `rgba(190, 220, 20, ${0.17 + line * 0.006})` : `rgba(17, 17, 15, ${0.08 + line * 0.006})`;
        context.lineWidth = 0.75;
        for (let x = -20; x <= width + 20; x += 4) {
          const phase = line * 4.8;
          const y = height * 0.54 + Math.sin(x / 110 + line * 0.16) * (34 + line * 1.2) + Math.cos(x / 47 + line * 0.12) * 7 + phase - 54;
          if (x === -20) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }

      const count = Math.max(28, Math.floor(width / 24));
      for (let i = 0; i < count; i += 1) {
        const x = ((i * 83) % (width + 40)) - 20;
        const baseY = height * 0.53 + Math.sin(x / 91) * 42;
        const length = 12 + ((i * 47) % 92);
        context.beginPath();
        context.strokeStyle = "rgba(17,17,15,.17)";
        context.moveTo(x, baseY - length / 2);
        context.lineTo(x, baseY + length / 2);
        context.stroke();
        context.beginPath();
        context.fillStyle = i % 3 === 0 ? "#D6F238" : i % 5 === 0 ? "#77776E" : "#11110F";
        context.arc(x, baseY - length / 2, i % 3 === 0 ? 2.2 : 1.6, 0, Math.PI * 2);
        context.fill();
      }
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return <canvas ref={ref} className="signal-canvas" aria-label="Визуализация активности сообщества" />;
}

function PublishForm({role,name,onSaved}:{role:Path;name:string;onSaved:()=>Promise<void>}){
  const [status,setStatus]=useState("");
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setStatus("Сохраняем…");const data=new FormData(event.currentTarget);
    const common={specialization:String(data.get("specialization")),level:String(data.get("level")),published:data.get("published")==="on"};
    const payload=role==="founder"?{...common,name:String(data.get("projectName")),category:String(data.get("category")),title:String(data.get("title")),description:String(data.get("description")),teamSize:Number(data.get("teamSize"))}:{...common,name:String(data.get("name")),role,bio:String(data.get("bio")),stack:String(data.get("stack"))};
    const response=await fetch(role==="founder"?"/api/projects":"/api/profile",{method:role==="founder"?"POST":"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok){setStatus(result.error||"Не удалось сохранить");return}setStatus("Опубликовано");await onSaved()};
  return <form className="publish-form" onSubmit={submit}>
    {role==="founder"?<>
      <label className="account-field">Название проекта<input name="projectName" required minLength={2} maxLength={80} placeholder="Например, Locus" /></label>
      <label className="account-field">Категория<input name="category" required minLength={2} maxLength={80} placeholder="EdTech, AI, SocialTech…" /></label>
      <label className="account-field">Кого ищете<input name="title" required minLength={3} maxLength={120} placeholder="Frontend-разработчик" /></label>
      <label className="account-field">О проекте<textarea name="description" required minLength={20} maxLength={1600} placeholder="Идея, этап и что предстоит сделать вместе" /></label>
      <label className="account-field">Сейчас в команде<input name="teamSize" type="number" min={1} max={50} defaultValue={1} required /></label>
    </>:<>
      <label className="account-field">Имя<input name="name" required minLength={2} maxLength={80} defaultValue={name} /></label>
      <label className="account-field">Навыки<input name="stack" maxLength={220} placeholder="React · TypeScript · Figma" /></label>
      <label className="account-field">О себе<input name="bio" maxLength={700} placeholder="Что интересно создавать и какой опыт уже есть" /></label>
    </>}
    <label className="account-field">{role==="talent"?"Ваша роль":"Кого ищете"}<select name="specialization" defaultValue="" required><option value="" disabled>Выберите роль</option><option>Разработка</option><option>Дизайн</option><option>Продукт-менеджмент</option><option>Аналитика</option><option>Продвижение</option><option>Продажи</option><option>Юриспруденция</option><option>Другая роль</option></select></label>
    <label className="account-field">Уровень<select name="level"><option>Без опыта</option><option>Есть опыт</option></select></label>
    <div className="remote-note"><strong>Только удалённо</strong><span>мотисквад объединяет ребят из разных городов РФ, поэтому все команды работают дистанционно.</span></div>
    <label className="publish-check"><input name="published" type="checkbox" defaultChecked /> Опубликовать в общем каталоге</label>
    {status&&<span className="form-notice">{status}</span>}<button className="submit-button" type="submit">{role==="founder"?"Опубликовать проект":"Опубликовать профиль"}<span>→</span></button>
  </form>
}

export default function Home() {
  const [path, setPath] = useState<Path>("talent");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [challengeId,setChallengeId]=useState("");
  const [challengeEmail,setChallengeEmail]=useState("");
  const [projects,setProjects]=useState<Project[]>([]);
  const [talent,setTalent]=useState<Talent[]>([]);
  const [stats,setStats]=useState({projects:0,talent:0});
  const [loading,setLoading]=useState(true);
  const userName=user?.name||"";

  useEffect(() => {
    void fetch("/api/public",{cache:"no-store"}).then(response=>response.json()).then(data=>{setProjects(data.projects||[]);setTalent((data.profiles||[]).filter((item:Talent)=>item.role==="talent"));setStats(data.stats||{projects:0,talent:0})}).finally(()=>setLoading(false));
    void fetch("/api/auth/me",{cache:"no-store"}).then(async response=>{
      if(response.status===401){const refreshed=await fetch("/api/auth/refresh",{method:"POST"});if(refreshed.ok)return fetch("/api/auth/me",{cache:"no-store"})}
      return response;
    }).then(response=>response?.ok?response.json():null).then(data=>{if(data?.user){setUser(data.user);setPath(data.user.role)}}).catch(()=>{});
  }, []);

  const loadPublic=async (filters?:URLSearchParams)=>{setLoading(true);try{const response=await fetch(`/api/public${filters?`?${filters}`:""}`,{cache:"no-store"});const data=await response.json();if(response.ok){setProjects(data.projects);setTalent(data.profiles.filter((item:Talent)=>item.role==="talent"));setStats(data.stats)}}finally{setLoading(false)}};

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setNotice("");
    setAuthOpen(true);
    setChallengeId("");
    setMenuOpen(false);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setNotice("Отправляем код…");
    const payload=authMode==="register"?{name:String(data.get("name")),email:String(data.get("email")),password:String(data.get("password")),role:String(data.get("path"))}:{email:String(data.get("email")),password:String(data.get("password"))};
    const response=await fetch(`/api/auth/${authMode==="register"?"register":"login"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await response.json();if(!response.ok){setNotice(result.error||"Не удалось продолжить");return}setChallengeId(result.challengeId);setChallengeEmail(result.email);setNotice("");
  };

  const verifyCode=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const data=new FormData(event.currentTarget);setNotice("Проверяем код…");const response=await fetch("/api/auth/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({challengeId,code:String(data.get("code"))})});const result=await response.json();if(!response.ok){setNotice(result.error||"Неверный код");return}setUser(result.user);setPath(result.user.role);setAuthOpen(false);setAccountOpen(true);setNotice("")};

  const signOut = async () => {
    await fetch("/api/auth/logout",{method:"POST"});setUser(null);
    setAccountOpen(false);
  };

  const selectPath = (next: Path) => {
    setPath(next);
    setResultsOpen(false);
    document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="мотисквад — на главную">
          <span>моти</span>сквад<i />
        </a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Главная навигация">
          <a href="#projects" onClick={() => setMenuOpen(false)}>Проекты</a>
          <a href="#people" onClick={() => setMenuOpen(false)}>Участники</a>
          <a href="#principles" onClick={() => setMenuOpen(false)}>Как это работает</a>
        </nav>
        <div className="header-actions">
          {userName ? (
            <button className="text-button" onClick={() => setAccountOpen(true)}>Кабинет <span>↗</span></button>
          ) : (
            <button className="text-button desktop-login" onClick={() => openAuth("login")}>Войти</button>
          )}
          <button className="join-button" onClick={() => userName ? setAccountOpen(true) : openAuth("register")}>{userName ? userName : "Создать аккаунт"}</button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Открыть меню" aria-expanded={menuOpen}><span /><span /></button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>Сервис для молодых и амбициозных ребят из РФ</span><b>Для тех, кто хочет создавать</b></div>
        <div className="hero-grid">
          <h1>Find your<br />team</h1>
          <div className="hero-side">
            <p>Найдите не вакансию,<br />а людей для общего дела.</p>
            <span className="hero-index">01 — место встречи</span>
          </div>
        </div>

        <div className="path-picker" aria-label="Выберите свою роль">
          <div className="path-intro"><span>С чего начнём?</span><p>Выберите, кто вы — мы покажем подходящих людей или проекты со всей России.</p></div>
          <button className={path === "talent" ? "path-card active" : "path-card"} onClick={() => selectPath("talent")}>
            <span className="path-number">01</span><strong>Хочу в команду</strong><small>Найти проект и единомышленников</small><i>↘</i>
          </button>
          <button className={path === "founder" ? "path-card active" : "path-card"} onClick={() => selectPath("founder")}>
            <span className="path-number">02</span><strong>Собираю команду</strong><small>Найти начинающих участников</small><i>↘</i>
          </button>
        </div>

        <form className="search-bar" id="search" onSubmit={(event) => { event.preventDefault();const data=new FormData(event.currentTarget);void loadPublic(new URLSearchParams({specialization:String(data.get("specialization")),level:String(data.get("level"))})); setResultsOpen(true); document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }); }}>
          <label><span>{path === "talent" ? "Роль" : "Специалист"}</span><select key={path} name="specialization" aria-label="Специализация" defaultValue={path === "talent" ? "Не указано" : "Любая специализация"}><option>{path === "talent" ? "Не указано" : "Любая специализация"}</option><option>Разработка</option><option>Дизайн</option><option>Продукт-менеджмент</option><option>Аналитика</option><option>Продвижение</option><option>Продажи</option><option>Юриспруденция</option><option>Другая роль</option></select></label>
          <label><span>Уровень</span><select name="level" aria-label="Уровень опыта"><option>Без опыта</option><option>Есть опыт</option></select></label>
          <div className="search-remote"><span>Формат</span><strong>Только удалённо</strong><small>Команды по всей РФ</small></div>
          <button type="submit">{path === "talent" ? "Найти проекты" : "Найти участников"}<span>→</span></button>
        </form>
      </section>

      <section className="signal" aria-label="Сигнал сообщества">
        <div className="signal-label"><strong>Right people for right team <i /></strong><span>Где прямо сейчас<br />рождаются команды.</span></div>
        <div className="signal-stat stat-one"><b>Разработка</b><span>вместе</span></div>
        <div className="signal-stat stat-two"><b>Дизайн</b><span>вместе</span></div>
        <div className="signal-stat stat-three"><b>Продукт</b><span>вместе</span></div>
        <SignalCanvas />
      </section>

      <section className="metrics" aria-label="Статистика сообщества">
        <div><strong>{loading?"—":stats.projects}</strong><span>активных проектов сейчас</span></div>
        <div><strong>{loading?"—":stats.talent}</strong><span>участников в поиске сейчас</span></div>
        <div><strong>0 ₽</strong><span>за поиск команды</span></div>
      </section>

      <section className="definition" id="principles">
        <span className="section-kicker">02 — наш принцип</span>
        <p><em>единомышленник</em> — это <strong>человек, который разделяет чьи-то мысли, взгляды, убеждения или цели.</strong> также это слово может означать соучастника или сообщника в каком-либо общем деле.</p>
        <div className="definition-note">Мотисквад — сервис для молодых и амбициозных ребят из РФ. Это не биржа вакансий: здесь нет зарплат, оплаты доступа и найма. Только люди, которые хотят удалённо создавать IT-продукты и получать первый реальный опыт.</div>
      </section>

      <section className="catalog" id="projects">
        <div className="section-head">
          <div><span className="section-kicker">03 — свежие совпадения</span><h2>{path === "talent" ? "Проекты ищут людей" : "Люди ищут проекты"}</h2></div>
          <button className="underlined" onClick={() => setResultsOpen(true)}>Смотреть весь каталог <span>↗</span></button>
        </div>
        <div className="catalog-list" id="people">
          {(path === "talent" ? projects : talent).map((item) => path === "talent" ? (
            <article className="project-row" key={(item as Project).id}>
              <div className="project-brand" style={{ background: "#D6F238" }}>{(item as Project).name.slice(0,1).toUpperCase()}</div>
              <div><span>{(item as Project).name}</span><small>{(item as Project).category}</small></div>
              <h3>{(item as Project).title}</h3>
              <div className="row-meta"><span>{(item as Project).level}</span><span>{(item as Project).format}</span><span>{(item as Project).teamSize} в команде</span></div>
              <button onClick={() => user ? setAccountOpen(true) : openAuth("register")} aria-label={`Открыть проект ${(item as Project).name}`}>↗</button>
            </article>
          ) : (
            <article className="project-row person-row" key={(item as Talent).id}>
              <div className="person-avatar">{(item as Talent).name.split(" ").map(v=>v[0]).join("").slice(0,2)}</div>
              <div><span>{(item as Talent).name}</span><small>{(item as Talent).specialization}</small></div>
              <h3>{(item as Talent).stack||"Готов рассказать о навыках"}</h3>
              <div className="row-meta"><span>{(item as Talent).level}</span><span>{(item as Talent).format}</span></div>
              <button onClick={() => user ? setAccountOpen(true) : openAuth("register")} aria-label={`Открыть профиль ${(item as Talent).name}`}>↗</button>
            </article>
          ))}
        </div>
        {!loading && (path==="talent"?projects:talent).length===0 && <div className="empty-state"><strong>Пока здесь пусто.</strong><span>{path==="talent"?"Станьте первым основателем, который опубликует проект.":"Станьте первым участником, который откроет профиль для команды."}</span><button onClick={()=>user?setAccountOpen(true):openAuth("register")}>Опубликоваться →</button></div>}
        {resultsOpen && <div className="result-note">Показаны лучшие совпадения по вашим фильтрам. Создайте профиль, чтобы связаться с командой.</div>}
      </section>

      <section className="steps">
        <span className="section-kicker">04 — как всё устроено</span>
        <div className="steps-grid">
          <h2>Не собеседование.<br />Первый разговор.</h2>
          <ol>
            <li><span>01</span><div><strong>Выберите сторону</strong><p>Расскажите, строите ли вы проект или хотите присоединиться.</p></div></li>
            <li><span>02</span><div><strong>Заполните короткий профиль</strong><p>Выберите роль, расскажите о навыках и укажите уровень: без опыта или есть опыт.</p></div></li>
            <li><span>03</span><div><strong>Найдите совпадение</strong><p>Напишите человеку и обсудите идею — без посредников.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="final-cta">
        <span>Может быть, ваша команда<br />уже почти собралась.</span>
        <button onClick={() => userName ? setAccountOpen(true) : openAuth("register")}>Создать профиль <i>→</i></button>
      </section>

      <footer><a className="brand" href="#top"><span>моти</span>сквад<i /></a><p>Сообщество для первых IT-проектов.<br />Екатеринбург · 2026</p><div><a href="#projects">Проекты</a><a href="#people">Участники</a><button onClick={() => openAuth("login")}>Войти</button></div></footer>

      {authOpen && (
        <div className="modal-backdrop" role="button" tabIndex={0} aria-label="Закрыть окно" onKeyDown={(event)=>{if(event.key==="Escape"||event.key==="Enter")setAuthOpen(false)}} onMouseDown={() => setAuthOpen(false)}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Закрыть">×</button>
            <span className="section-kicker">Личный кабинет</span>
            <h2 id="auth-title">{challengeId?"Проверьте почту":authMode === "register" ? "Сначала познакомимся" : "С возвращением"}</h2>
            <p>{challengeId?`Мы отправили шестизначный код на ${challengeEmail}.`:authMode === "register" ? "Создайте защищённый профиль участника или основателя — это бесплатно." : "После пароля мы подтвердим вход одноразовым кодом из письма."}</p>
            {!challengeId&&<div className="auth-tabs"><button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Регистрация</button><button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Вход</button></div>}
            {challengeId?<form onSubmit={verifyCode} className="code-form">
              <label>Код из письма<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="000000" autoComplete="one-time-code" /></label>
              {notice&&<span className="form-notice">{notice}</span>}<button className="submit-button" type="submit">Подтвердить и войти <span>→</span></button>
              <button type="button" className="signout" onClick={()=>setChallengeId("")}>Изменить данные</button>
            </form>:<form onSubmit={submitAuth}>
              {authMode === "register" && <><label>Как вас зовут<input name="name" required placeholder="Имя и фамилия" /></label><fieldset><legend>Кто вы?</legend><label><input type="radio" name="path" value="talent" defaultChecked={path === "talent"} /> Хочу в команду</label><label><input type="radio" name="path" value="founder" defaultChecked={path === "founder"} /> Собираю команду</label></fieldset></>}
              <label>Электронная почта<input name="email" type="email" required placeholder="name@example.ru" /></label>
              <label>Пароль<input name="password" type="password" minLength={12} maxLength={128} required placeholder="От 12 символов, буквы и цифры" autoComplete={authMode==="register"?"new-password":"current-password"} /></label>
              {notice && <span className="form-notice">{notice}</span>}
              <button className="submit-button" type="submit">{authMode === "register" ? "Создать аккаунт" : "Войти"}<span>→</span></button>
            </form>}
            <small className="privacy">Продолжая, вы соглашаетесь бережно относиться к другим участникам сообщества.</small>
          </section>
        </div>
      )}

      {accountOpen && (
        <div className="modal-backdrop account-backdrop" role="button" tabIndex={0} aria-label="Закрыть кабинет" onKeyDown={(event)=>{if(event.key==="Escape"||event.key==="Enter")setAccountOpen(false)}} onMouseDown={() => setAccountOpen(false)}>
          <section className="account-panel" role="dialog" aria-modal="true" aria-labelledby="account-title">
            <button className="modal-close" onClick={() => setAccountOpen(false)} aria-label="Закрыть">×</button>
            <span className="section-kicker">Ваш кабинет</span>
            <h2 id="account-title">Привет, {userName}.</h2>
            <p>{user?.role==="founder"?"Опубликуйте проект — он сразу попадёт в реальный каталог.":"Откройте профиль — основатели увидят вашу карточку в каталоге."}</p>
            <PublishForm role={user?.role||"talent"} name={userName} onSaved={async()=>{await loadPublic();setAccountOpen(false)}} />
            <button className="signout" onClick={signOut}>Выйти из аккаунта</button>
          </section>
        </div>
      )}
    </main>
  );
}
