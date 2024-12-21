import React from 'react';
import Signup from '../components/Signup';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    console.log('[SignupPage] Signup success, navigating to /signin');
    navigate('/signin');
  };

  return <Signup onSuccess={handleSuccess} />;
}

export default SignupPage;
