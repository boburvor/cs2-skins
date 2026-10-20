import SkinArt from "./SkinArt";
import { money, rarityOf } from "../lib/rarity";

export default function SkinCard({ skin, tag, dim, children }) {
  const rar = rarityOf(skin.skinRarity);
  return (
    <article className={`skin ${dim ? "is-gone" : ""}`} style={{ "--rar": rar.color }}>
      {tag && <span className="tag">{tag}</span>}
      <SkinArt skin={skin} />
      <div className="body">
        <div className="name">{skin.skinName}</div>
        <div className="meta">
          <b>{rar.label}</b>
          <span className="price num">{money(skin.skinPrice)}</span>
        </div>
        {children && <div className="actions">{children}</div>}
      </div>
    </article>
  );
}
