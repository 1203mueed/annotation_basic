import React from 'react';
import Signin from '../components/Signin';
import { useNavigate } from 'react-router-dom';

function SigninPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    console.log('[SigninPage] Sign in success, navigating to /dashboard');
    navigate('/dashboard');
  };

  return <Signin onSuccess={handleSuccess} />;
}

export default SigninPage;
