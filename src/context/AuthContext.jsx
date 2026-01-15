import React, { createContext, useState, useEffect } from 'react';
import { getUsersFromStorage, saveUsersToStorage, getCurrentUserFromStorage, saveCurrentUserToStorage, clearCurrentUserFromStorage } from '../utils/storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const savedUsers = getUsersFromStorage();
    const savedCurrent = getCurrentUserFromStorage();
    if (savedUsers) setUsers(savedUsers);
    if (savedCurrent) setCurrentUser(savedCurrent);
  }, []);

  const persist = (updatedUsers, updatedCurrent = null) => {
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
    if (updatedCurrent) {
      setCurrentUser(updatedCurrent);
      saveCurrentUserToStorage(updatedCurrent);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const register = ({ username, password, fullName, email }) => {
    if (users.find(u => u.username === username)) {
      showNotification('Username already exists', 'error');
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      fullName,
      email,
      accountNumber: 'ACC' + Math.floor(100000000 + Math.random() * 900000000),
      balance: 1000,
      transactions: [{
        id: Date.now(),
        type: 'credit',
        amount: 1000,
        description: 'Welcome bonus',
        date: new Date().toISOString()
      }]
    };

    const updatedUsers = [...users, newUser];
    persist(updatedUsers);
    showNotification('Account created successfully! Welcome bonus: $1000');
    return true;
  };

  const login = ({ username, password }) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      saveCurrentUserToStorage(user);
      showNotification(`Welcome back, ${user.fullName}!`);
      return true;
    }
    showNotification('Invalid credentials', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    clearCurrentUserFromStorage();
    showNotification('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    persist(updatedUsers, updatedUser);
  };

  const deposit = (amount) => {
    if (!currentUser) return false;
    const transaction = {
      id: Date.now(),
      type: 'credit',
      amount: Math.abs(amount),
      description: 'Deposit',
      date: new Date().toISOString(),
    };
    const updatedUser = { ...currentUser, balance: currentUser.balance + amount, transactions: [transaction, ...currentUser.transactions] };
    updateUser(updatedUser);
    showNotification(`Successfully deposited $${amount.toFixed(2)}`);
    return true;
  };

  const withdraw = (amount) => {
    if (!currentUser) return false;
    if (amount > currentUser.balance) {
      showNotification('Insufficient funds', 'error');
      return false;
    }
    const transaction = {
      id: Date.now(),
      type: 'debit',
      amount: Math.abs(amount),
      description: 'Withdrawal',
      date: new Date().toISOString(),
    };
    const updatedUser = { ...currentUser, balance: currentUser.balance - amount, transactions: [transaction, ...currentUser.transactions] };
    updateUser(updatedUser);
    showNotification(`Successfully withdrew $${amount.toFixed(2)}`);
    return true;
  };

  const transfer = ({ type, recipient, amount, mobileNumber, country }) => {
    if (!currentUser) return false;
    if (amount <= 0) { showNotification('Invalid amount', 'error'); return false; }
    if (amount > currentUser.balance) { showNotification('Insufficient funds', 'error'); return false; }

    let description = '';
    let additionalData = {};

    if (type === 'internal') {
      const recip = users.find(u => u.accountNumber === recipient);
      if (!recip) { showNotification('Recipient account not found', 'error'); return false; }
      if (recip.id === currentUser.id) { showNotification('Cannot transfer to your own account', 'error'); return false; }

      const updatedRecipient = {
        ...recip,
        balance: recip.balance + amount,
        transactions: [{
          id: Date.now() + 1,
          type: 'credit',
          amount,
          description: `Transfer from ${currentUser.accountNumber}`,
          date: new Date().toISOString(),
          from: currentUser.accountNumber
        }, ...recip.transactions]
      };

      const updatedUsers = users.map(u => u.id === recip.id ? updatedRecipient : u);
      saveUsersToStorage(updatedUsers);

      description = `Transfer to ${recip.accountNumber}`;
      additionalData = { to: recip.accountNumber };
    } else if (type === 'mobile') {
      description = `Mobile Money to ${mobileNumber}`;
      additionalData = { mobileNumber };
    } else if (type === 'international') {
      description = `International transfer to ${country}`;
      additionalData = { country, recipient };
    }

    const transaction = {
      id: Date.now(),
      type: 'debit',
      amount: Math.abs(amount),
      description,
      date: new Date().toISOString(),
      ...additionalData
    };

    const updatedUser = { ...currentUser, balance: currentUser.balance - amount, transactions: [transaction, ...currentUser.transactions] };
    updateUser(updatedUser);
    showNotification(`Successfully transferred $${amount.toFixed(2)}`);
    return true;
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, notification, register, login, logout, deposit, withdraw, transfer, setNotification }}>
      {children}
    </AuthContext.Provider>
  );
};