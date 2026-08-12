"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Path = "founder" | "talent";
type AuthMode = "login" | "register";

const projects = [
  { name: "Vozduh", mark: "V", category: "EdTech", title: "Frontend-разработчик", level: "Без опыта", format: "Удалённо", team: "3 человека", accent: "#D6F238" },
  { name: "Locus", mark: "L", category: "AI · Productivity", title: "Junior ML-инженер", level: "Junior", format: "Гибрид", team: "5 человек", accent: "#B8C6FF" },
  { name: "Sreda", mark: "С", category: "SocialTech", title: "UX/UI-дизайнер", level: "Без опыта", format: "Удалённо", team: "2 человека", accent: "#FFB9A8" },
];

const talent = [
  { initials: "АК", name: "Алина Ким", role: "Product designer", level: "Junior", stack: "Figma · Research · JTBD" },
  { initials: "МВ", name: "Миша Ветров", role: "Frontend developer", level: "Без опыта", stack: "React · TypeScript · CSS" },
  { initials: "СА", name: "Саша Алимов", role: "Data analyst", level: "Junior", stack: "Python · SQL · BI" },
];

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

export default function Home() {
  const [path, setPath] = useState<Path>("talent");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [notice, setNotice] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("motisquad-user");
    if (stored) setUserName(stored);
  }, []);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setNotice("");
    setAuthOpen(true);
    setMenuOpen(false);
  };

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const name = String(data.get("name") || email.split("@")[0] || "Участник");
    window.localStorage.setItem("motisquad-user", name);
    setUserName(name);
    setAuthOpen(false);
    setAccountOpen(true);
  };

  const signOut = () => {
    window.localStorage.removeItem("motisquad-user");
    setUserName("");
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
        <div className="eyebrow"><span>Некоммерческое комьюнити</span><b>Для тех, кто хочет создавать</b></div>
        <div className="hero-grid">
          <h1>Find your<br />next build</h1>
          <div className="hero-side">
            <p>Найдите не вакансию,<br />а людей для общего дела.</p>
            <span className="hero-index">01 — место встречи</span>
          </div>
        </div>

        <div className="path-picker" aria-label="Выберите свою роль">
          <div className="path-intro"><span>С чего начнём?</span><p>Выберите, кто вы — мы покажем подходящих людей или проекты.</p></div>
          <button className={path === "talent" ? "path-card active" : "path-card"} onClick={() => selectPath("talent")}>
            <span className="path-number">01</span><strong>Хочу в команду</strong><small>Найти проект и единомышленников</small><i>↘</i>
          </button>
          <button className={path === "founder" ? "path-card active" : "path-card"} onClick={() => selectPath("founder")}>
            <span className="path-number">02</span><strong>Собираю команду</strong><small>Найти начинающих участников</small><i>↘</i>
          </button>
        </div>

        <form className="search-bar" id="search" onSubmit={(event) => { event.preventDefault(); setResultsOpen(true); document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }); }}>
          <label><span>{path === "talent" ? "Роль" : "Специалист"}</span><select aria-label="Специализация"><option>{path === "talent" ? "Любая роль" : "Любая специализация"}</option><option>Разработка</option><option>Дизайн</option><option>Продукт</option><option>Аналитика</option></select></label>
          <label><span>Уровень</span><select aria-label="Уровень опыта"><option>Без опыта</option><option>Junior</option></select></label>
          <label><span>Формат</span><select aria-label="Формат участия"><option>Удалённо</option><option>Гибрид</option><option>Офлайн</option></select></label>
          <button type="submit">{path === "talent" ? "Найти проекты" : "Найти участников"}<span>→</span></button>
        </form>
      </section>

      <section className="signal" aria-label="Сигнал сообщества">
        <div className="signal-label"><strong>Career signal <i /></strong><span>Где прямо сейчас<br />рождаются команды.</span></div>
        <div className="signal-stat stat-one"><b>Разработка</b><span>42%</span></div>
        <div className="signal-stat stat-two"><b>Дизайн</b><span>27%</span></div>
        <div className="signal-stat stat-three"><b>Продукт</b><span>31%</span></div>
        <SignalCanvas />
      </section>

      <section className="metrics" aria-label="Статистика сообщества">
        <div><strong>128</strong><span>активных проектов</span></div>
        <div><strong>406</strong><span>участников в поиске</span></div>
        <div><strong>0 ₽</strong><span>за поиск команды</span></div>
      </section>

      <section className="definition" id="principles">
        <span className="section-kicker">02 — наш принцип</span>
        <p><em>единомышленник</em> — это <strong>человек, который разделяет чьи-то мысли, взгляды, убеждения или цели.</strong> Также это слово может означать соучастника или сообщника в каком-либо общем деле.</p>
        <div className="definition-note">Мотисквад — не биржа вакансий. Здесь нет зарплат, оплаты доступа и найма. Только люди, которые хотят вместе создавать IT-продукты и получать первый реальный опыт.</div>
      </section>

      <section className="catalog" id="projects">
        <div className="section-head">
          <div><span className="section-kicker">03 — свежие совпадения</span><h2>{path === "talent" ? "Проекты ищут людей" : "Люди ищут проекты"}</h2></div>
          <button className="underlined" onClick={() => setResultsOpen(true)}>Смотреть весь каталог <span>↗</span></button>
        </div>
        <div className="catalog-list" id="people">
          {(path === "talent" ? projects : talent).map((item, index) => path === "talent" ? (
            <article className="project-row" key={(item as typeof projects[0]).name}>
              <div className="project-brand" style={{ background: (item as typeof projects[0]).accent }}>{(item as typeof projects[0]).mark}</div>
              <div><span>{(item as typeof projects[0]).name}</span><small>{(item as typeof projects[0]).category}</small></div>
              <h3>{(item as typeof projects[0]).title}</h3>
              <div className="row-meta"><span>{(item as typeof projects[0]).level}</span><span>{(item as typeof projects[0]).format}</span><span>{(item as typeof projects[0]).team}</span></div>
              <button onClick={() => userName ? setAccountOpen(true) : openAuth("register")} aria-label={`Открыть проект ${(item as typeof projects[0]).name}`}>↗</button>
            </article>
          ) : (
            <article className="project-row person-row" key={(item as typeof talent[0]).name}>
              <div className="person-avatar">{(item as typeof talent[0]).initials}</div>
              <div><span>{(item as typeof talent[0]).name}</span><small>{(item as typeof talent[0]).role}</small></div>
              <h3>{(item as typeof talent[0]).stack}</h3>
              <div className="row-meta"><span>{(item as typeof talent[0]).level}</span><span>Открыт к проектам</span></div>
              <button onClick={() => userName ? setAccountOpen(true) : openAuth("register")} aria-label={`Открыть профиль ${(item as typeof talent[0]).name}`}>↗</button>
            </article>
          ))}
        </div>
        {resultsOpen && <div className="result-note">Показаны лучшие совпадения по вашим фильтрам. Создайте профиль, чтобы связаться с командой.</div>}
      </section>

      <section className="steps">
        <span className="section-kicker">04 — как всё устроено</span>
        <div className="steps-grid">
          <h2>Не собеседование.<br />Первый разговор.</h2>
          <ol>
            <li><span>01</span><div><strong>Выберите сторону</strong><p>Расскажите, строите ли вы проект или хотите присоединиться.</p></div></li>
            <li><span>02</span><div><strong>Заполните короткий профиль</strong><p>Навыки, интересы и уровень: без опыта или junior.</p></div></li>
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
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAuthOpen(false)}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Закрыть">×</button>
            <span className="section-kicker">Личный кабинет</span>
            <h2 id="auth-title">{authMode === "register" ? "Сначала познакомимся" : "С возвращением"}</h2>
            <p>{authMode === "register" ? "Создайте профиль участника или основателя — это бесплатно." : "Войдите, чтобы продолжить собирать свою команду."}</p>
            <div className="auth-tabs"><button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Регистрация</button><button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Вход</button></div>
            <form onSubmit={submitAuth}>
              {authMode === "register" && <><label>Как вас зовут<input name="name" required placeholder="Имя и фамилия" autoFocus /></label><fieldset><legend>Кто вы?</legend><label><input type="radio" name="path" value="talent" defaultChecked={path === "talent"} /> Хочу в команду</label><label><input type="radio" name="path" value="founder" defaultChecked={path === "founder"} /> Собираю команду</label></fieldset></>}
              <label>Электронная почта<input name="email" type="email" required placeholder="name@example.ru" autoFocus={authMode === "login"} /></label>
              <label>Пароль<input name="password" type="password" minLength={6} required placeholder="Минимум 6 символов" /></label>
              {notice && <span className="form-notice">{notice}</span>}
              <button className="submit-button" type="submit">{authMode === "register" ? "Создать аккаунт" : "Войти"}<span>→</span></button>
            </form>
            <small className="privacy">Продолжая, вы соглашаетесь бережно относиться к другим участникам сообщества.</small>
          </section>
        </div>
      )}

      {accountOpen && (
        <div className="modal-backdrop account-backdrop" role="presentation" onMouseDown={() => setAccountOpen(false)}>
          <section className="account-panel" role="dialog" aria-modal="true" aria-labelledby="account-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setAccountOpen(false)} aria-label="Закрыть">×</button>
            <span className="section-kicker">Ваш кабинет</span>
            <h2 id="account-title">Привет, {userName}.</h2>
            <p>Профиль создан. Добавьте пару деталей — так совпадения станут точнее.</p>
            <div className="profile-progress"><span><b>Профиль заполнен</b><em>40%</em></span><i><b /></i></div>
            <div className="account-choice"><button className={path === "talent" ? "active" : ""} onClick={() => setPath("talent")}>Ищу команду</button><button className={path === "founder" ? "active" : ""} onClick={() => setPath("founder")}>Собираю команду</button></div>
            <label className="account-field">Ваша специализация<select><option>Выберите направление</option><option>Разработка</option><option>Дизайн</option><option>Продукт</option><option>Аналитика</option></select></label>
            <label className="account-field">Уровень<select><option>Без опыта</option><option>Junior</option></select></label>
            <button className="submit-button" onClick={() => { setAccountOpen(false); setNotice("Профиль сохранён"); }}>Сохранить профиль <span>→</span></button>
            <button className="signout" onClick={signOut}>Выйти из аккаунта</button>
          </section>
        </div>
      )}
    </main>
  );
}
