import NoticeBoard from "../components/Board";
import CondolenceBoard from "../components/CondolenceBoard";

export default function NoticePage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem" }}>
      <section id="general">
        <h2>공고 / 공지</h2>
        <NoticeBoard />
      </section>

      <hr style={{ margin: "2rem 0" }} />

      <section id="condolence">
        <h2>경조사</h2>
        <CondolenceBoard />
      </section>
    </div>
  );
}