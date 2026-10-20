import Modal from "./Modal";

export default function Confirm({ title, text, yes = "Ha, o'chirish", onYes, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      {text && <p className="muted" style={{ margin: 0 }}>{text}</p>}
      <div className="row">
        <button className="btn danger" onClick={onYes}>{yes}</button>
        <button className="btn ghost" onClick={onClose}>Bekor qilish</button>
      </div>
    </Modal>
  );
}
