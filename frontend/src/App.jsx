import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Step1 from './pages/Step1';
import Step2 from './pages/Step2';
import Step3 from './pages/Step3';
import Evaluating from './pages/Evaluating';
import Result from './pages/Result';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';

function Layout({ children }) {
  return (
    <>
      <header className="layout-header">
        <Link to="/" className="brand">연주 평가기</Link>
        <nav className="nav">
          <Link to="/history">이력 보기</Link>
          <Link to="/settings">설정</Link>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/step/1" element={<Step1 />} />
        <Route path="/step/2" element={<Step2 />} />
        <Route path="/step/3" element={<Step3 />} />
        <Route path="/evaluating" element={<Evaluating />} />
        <Route path="/result" element={<Result />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<HistoryDetail />} />
      </Routes>
    </Layout>
  );
}
