import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import SkinArt from "../components/SkinArt";
import SkinCard from "../components/SkinCard";
import { Empty, Loading } from "../components/Status";
import { EXPENSIVE_CHANCE, money, rarityOf } from "../lib/rarity";
import useTitle from "../lib/useTitle";
import { useToast } from "../toast";

const CARD = 160;
const GAP = 8;
const STEP = CARD + GAP;
const WIN = 38; // lenta ichida yutuq skin turadigan joy
const TOTAL = 46;

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const randomFrom = (pool) => pool[Math.floor(Math.random() * pool.length)];

function buildReel(pool, won) {
  const src = pool.length ? pool : [won];
  const items = Array.from({ length: TOTAL }, () => randomFrom(src));
  if (won) items[WIN] = won;
  return items;
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const toast = useToast();

  const [box, setBox] = useState(null);
  const [missing, setMissing] = useState(false);
  const [reel, setReel] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | opening | spinning | done
  const [shift, setShift] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [result, setResult] = useState(null);
  const [sold, setSold] = useState(false);
  const [history, setHistory] = useState([]);

  const viewportRef = useRef(null);
  const pending = useRef(null);

  const load = useCallback(
    () =>
      api(`/cases/${id}`)
        .then((b) => {
          setBox(b);
          return b;
        })
        .catch((e) => {
          if (e.status === 404) setMissing(true);
          else toast(e.message, "error");
          return null;
        }),
    [id, toast]
  );

  // Birinchi yuklanganda lenta "oldindan ko'rinish" sifatida to'ldiriladi
  useEffect(() => {
    load().then((b) => b && setReel((prev) => (prev.length ? prev : buildReel(b.skins, null))));
  }, [load]);

  const finish = useCallback(() => {
    const res = pending.current;
    if (!res) return;
    pending.current = null;
    setResult(res);
    setHistory((h) => [res, ...h].slice(0, 8));
    setSold(false);
    setPhase("done");
    refresh();
    load();
  }, [refresh, load]);

  // Animatsiya tugamay qolsa ham natija ko'rsatiladi
  useEffect(() => {
    if (phase !== "spinning") return;
    const t = setTimeout(finish, 7500);
    return () => clearTimeout(t);
  }, [phase, finish]);

  const open = async () => {
    if (!user) return navigate("/login", { state: { from: `/cases/${id}` } });

    setPhase("opening");
    setResult(null);

    let res;
    try {
      res = await api(`/cases/${id}/open`, { method: "POST" });
    } catch (e) {
      toast(e.message, "error");
      setPhase("idle");
      return;
    }

    // Natija serverda aniqlangan; lenta faqat uni ko'rsatadi
    pending.current = res;
    setAnimate(false);
    setShift(0);
    setReel(buildReel(box.skins, res.skin));
    setPhase("spinning");

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const vw = viewportRef.current?.clientWidth ?? 800;
        const target = WIN * STEP + CARD / 2 - vw / 2 + (Math.random() - 0.5) * 100;
        if (reduceMotion()) {
          setShift(target);
          finish();
        } else {
          setAnimate(true);
          setShift(target);
        }
      })
    );
  };

  const sell = async () => {
    try {
      const r = await api(`/users/me/sell/${result.skin._id}`, { method: "POST" });
      toast(r.message);
      setSold(true);
      refresh();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  useTitle(box?.name);

  if (missing) {
    return (
      <Empty title="Keys topilmadi">
        <Link to="/" className="btn" style={{ marginTop: 16 }}>Keyslarga qaytish</Link>
      </Empty>
    );
  }
  if (!box) return <Loading />;

  const rar = rarityOf(box.rarity);
  const sorted = [...box.skins].sort((a, b) => b.skinPrice - a.skinPrice);
  const busy = phase === "opening" || phase === "spinning";
  const canOpen = !busy && box.skins.length > 0;
  const expCount = box.skins.filter((s) => s.skinPrice >= box.expensiveFrom).length;

  return (
    <>
      <div className="head">
        <div>
          <h1 className="display h1">{box.name}</h1>
          <p className="lead">{rar.label} keys, ichida {box.skins.length} ta skin.</p>
        </div>
        <button className="btn" onClick={open} disabled={!canOpen}>
          {busy ? "Ochilmoqda..." : `Keysni ochish ${money(box.price)}`}
        </button>
      </div>

      <div className="odds">
        <div className="odds-bar" role="img" aria-label={`Qimmat skin ehtimoli ${EXPENSIVE_CHANCE} foiz`}>
          <i className="hi" style={{ flexBasis: `${EXPENSIVE_CHANCE}%` }} />
          <i className="lo" />
        </div>
        <div className="odds-legend">
          <span><i className="hi" /><b>{EXPENSIVE_CHANCE}%</b> qimmat skin: {money(box.expensiveFrom)} va undan yuqori ({expCount} ta)</span>
          <span><i className="lo" /><b>{100 - EXPENSIVE_CHANCE}%</b> arzon skin ({box.skins.length - expCount} ta)</span>
        </div>
      </div>

      {box.skins.length === 0 && !result ? (
        <Empty title="Keys bo'sh">Ichidagi hamma skin tushib bo'lgan. Admin yangi skin qo'shishi kerak.</Empty>
      ) : (
        <div className="reel-viewport" ref={viewportRef} aria-label="Keys ochish lentasi">
          <div className="reel-mark" aria-hidden="true" />
          <div
            className="reel"
            onTransitionEnd={(e) => e.target === e.currentTarget && phase === "spinning" && finish()}
            style={{
              transform: `translateX(${-shift}px)`,
              transition: animate ? "transform 6.4s cubic-bezier(0.08, 0.62, 0.1, 1)" : "none",
            }}
          >
            {reel.map((s, i) => (
              <div
                key={i}
                className={`reel-item ${phase === "done" && i === WIN ? "win" : ""}`}
                style={{ "--rar": rarityOf(s.skinRarity).color }}
              >
                <SkinArt skin={s} />
                <div className="cap">
                  {s.skinName}
                  <small className="num">{money(s.skinPrice)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && phase === "done" && (
        <section className="result" style={{ "--rar": rarityOf(result.skin.skinRarity).color }} aria-live="polite">
          <SkinArt skin={result.skin} />
          <div className="stack">
            <div>
              <div className="muted">{result.tier === "expensive" ? "Qimmat skin tushdi" : "Skin tushdi"}</div>
              <h2 className="display h2">{result.skin.skinName}</h2>
              <div className="num" style={{ fontWeight: 800, fontSize: 22 }}>
                {rarityOf(result.skin.skinRarity).label}, {money(result.skin.skinPrice)}
              </div>
            </div>
            <div className="row">
              {sold ? (
                <span className="badge on">Sotildi, pul hamyonga tushdi</span>
              ) : (
                <>
                  <button className="btn ghost" onClick={sell}>Sotish</button>
                  <Link to="/inventory" className="btn ghost">Inventarga o'tish</Link>
                </>
              )}
              <button className="btn" onClick={open} disabled={!canOpen}>Yana ochish {money(box.price)}</button>
            </div>
          </div>
        </section>
      )}

      {history.length > 1 && (
        <>
          <h3 className="h3" style={{ margin: "28px 0 10px" }}>Shu sessiyada tushganlar</h3>
          <div className="hist">
            {history.map((h, i) => (
              <div key={i} className="hist-item" style={{ "--rar": rarityOf(h.skin.skinRarity).color }}>
                <SkinArt skin={h.skin} />
                <span>{h.skin.skinName}</span>
                <b className="num">{money(h.skin.skinPrice)}</b>
              </div>
            ))}
          </div>
        </>
      )}

      <hr className="divider" />
      <h2 className="display h2" style={{ marginBottom: 20 }}>Keys ichida</h2>
      {sorted.length === 0 ? (
        <Empty title="Skin qolmagan" />
      ) : (
        <div className="grid">
          {sorted.map((s) => (
            <SkinCard key={s._id} skin={s} tag={s.skinPrice >= box.expensiveFrom ? "Qimmat" : null} />
          ))}
        </div>
      )}
    </>
  );
}
