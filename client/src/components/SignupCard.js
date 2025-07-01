import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import SpotlightButton from './SpotlightButton';

export default function SignupCard({ onClose }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('https://devmeet-five.vercel.app/api/signup', form);
      alert('Signup successful! Please login.');
      onClose();            // close modal
      navigate('/');   // redirect after signup
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md p-6 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-md border border-white/30 relative"
      >
        {/* ❌ Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-center mb-6 text-white">Sign Up</h2>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-5">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-2xl bg-white bg-opacity-20 text-white placeholder-white/80 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-2xl bg-white bg-opacity-20 text-white placeholder-white/80 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-2xl bg-white bg-opacity-20 text-white placeholder-white/80 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <SpotlightButton
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-3xl transition duration-200"
          >
            Sign Up
          </SpotlightButton>
        </form>
      </motion.div>
      

    </div>
  );
}
