import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <section style={{ padding: '48px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>연주를 평가받고 싶다면?</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
          악보와 프로 연주를 기준으로 점수와 피드백을 받아보세요.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
          <span className="step-dot active">1</span>
          <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>악보</span>
          <span className="step-dot">2</span>
          <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>참조 연주</span>
          <span className="step-dot">3</span>
          <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>본인 연주</span>
        </div>
        <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 32px', color: 'var(--text-muted)' }}>
          <li>악보를 업로드하고</li>
          <li>참조할 프로 연주(YouTube) 링크를 넣고</li>
          <li>본인 연주(YouTube 또는 동영상 파일)를 넣으면 Gemini가 100점 만점으로 평가해 드립니다.</li>
        </ul>
        <Link to="/step/1" className="btn btn-primary">평가 시작하기</Link>
      </section>
    </div>
  );
}
