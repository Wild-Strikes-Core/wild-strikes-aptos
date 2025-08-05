'use client';

import { useState, useEffect } from 'react';

export function useEmailWhitelist() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const isValidEmail = (email: string): boolean => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = () => {
    console.log('Submit clicked with email:', email); // Debug log
    const trimmedEmail = email.trim();
    
    if (isValidEmail(trimmedEmail)) {
      // Here you would normally send the email to your server
      setError('');
      setIsSuccess(true);
      console.log('Email is valid, showing success message'); // Debug log
      
      // Reset after 3 seconds
      setTimeout(() => {
        setEmail('');
        setError('');
        setIsSuccess(false);
        setShowButton(false);
      }, 3000);
    } else {
      setError('Please enter a valid email address');
      setIsSuccess(false);
      console.log('Email is invalid'); // Debug log
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    console.log('Email value:', value); // Debug log
    
    if (value.trim() === '') {
      setShowButton(false);
      setError('');
    } else {
      setShowButton(true);
      console.log('Submit button should be visible'); // Debug log
      
      if (isValidEmail(value)) {
        setError('');
        console.log('Email is valid - button green'); // Debug log
      } else {
        setError('Please enter a valid email address');
        console.log('Email is invalid - button red'); // Debug log
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return {
    email,
    error,
    isSuccess,
    showButton,
    isValidEmail: isValidEmail(email),
    handleEmailChange,
    handleSubmit,
    handleKeyPress,
  };
}
