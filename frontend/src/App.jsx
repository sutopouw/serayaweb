// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SubmitForm from './pages/SubmitForm';
import AdminPanel from './pages/AdminPanel';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit/:linkId" element={<SubmitForm />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;