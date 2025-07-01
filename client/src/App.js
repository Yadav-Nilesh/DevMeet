import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginCard from './components/LoginCard';
import Signup from './components/SignupCard';
import Room from './pages/Room';
import SignupCard from './components/SignupCard';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupCard onClose={() => {}}/>} />
        <Route path="/login" element={<LoginCard onClose={() => {}} />} />

        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
