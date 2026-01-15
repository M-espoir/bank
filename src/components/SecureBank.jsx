import React, { useState, useEffect } from 'react';
import { CreditCard, Send, History, UserPlus, LogIn, LogOut, Smartphone, Globe, Users } from 'lucide-react';

const SecureBank = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('login');
  const [notification, setNotification] = useState(null);

  // Login/Register Form States
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    password: '', 
    fullName: '', 
    email: '' 
  });

  // Transaction Form States
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferForm, setTransferForm] = useState({
    type: 'internal',
    recipient: '',
    amount: '',
    mobileNumber: '',
    country: ''
  });

  useEffect(() => {
    const savedUsers = localStorage.getItem('bankUsers');
    const savedCurrentUser = localStorage.getItem('currentUser');
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
    if (savedCurrentUser) {
      setCurrentUser(JSON.parse(savedCurrentUser));
      setActiveTab('dashboard');
    }
  }, []);

  const saveToStorage = (updatedUsers, updatedCurrentUser = null) => {
    localStorage.setItem('bankUsers', JSON.stringify(updatedUsers));
    if (updatedCurrentUser) {
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (users.find(u => u.username === registerForm.username)) {
      showNotification('Username already exists', 'error');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      username: registerForm.username,
      password: registerForm.password,
      fullName: registerForm.fullName,
      email: registerForm.email,
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
    setUsers(updatedUsers);
    saveToStorage(updatedUsers);
    showNotification('Account created successfully! Welcome bonus: $1000');
    setRegisterForm({ username: '', password: '', fullName: '', email: '' });
    setActiveTab('login');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(
      u => u.username === loginForm.username && u.password === loginForm.password
    );

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      showNotification(`Welcome back, ${user.fullName}!`);
      setActiveTab('dashboard');
      setLoginForm({ username: '', password: '' });
    } else {
      showNotification('Invalid credentials', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('login');
    showNotification('Logged out successfully');
  };

  const updateUserBalance = (amount, type, description, additionalData = {}) => {
    const transaction = {
      id: Date.now(),
      type,
      amount: Math.abs(amount),
      description,
      date: new Date().toISOString(),
      ...additionalData
    };

    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance + amount,
      transactions: [transaction, ...currentUser.transactions]
    };

    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
    saveToStorage(updatedUsers, updatedUser);
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      updateUserBalance(amount, 'credit', 'Deposit');
      showNotification(`Successfully deposited $${amount.toFixed(2)}`);
      setDepositAmount('');
    }
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= currentUser.balance) {
      updateUserBalance(-amount, 'debit', 'Withdrawal');
      showNotification(`Successfully withdrew $${amount.toFixed(2)}`);
      setWithdrawAmount('');
    } else if (amount > currentUser.balance) {
      showNotification('Insufficient funds', 'error');
    }
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    const amount = parseFloat(transferForm.amount);

    if (amount <= 0) {
      showNotification('Invalid amount', 'error');
      return;
    }

    if (amount > currentUser.balance) {
      showNotification('Insufficient funds', 'error');
      return;
    }

    let description = '';
    let additionalData = {};

    if (transferForm.type === 'internal') {
      const recipient = users.find(u => u.accountNumber === transferForm.recipient);
      if (!recipient) {
        showNotification('Recipient account not found', 'error');
        return;
      }
      if (recipient.id === currentUser.id) {
        showNotification('Cannot transfer to your own account', 'error');
        return;
      }

      const updatedRecipient = {
        ...recipient,
        balance: recipient.balance + amount,
        transactions: [{
          id: Date.now() + 1,
          type: 'credit',
          amount,
          description: `Transfer from ${currentUser.accountNumber}`,
          date: new Date().toISOString(),
          from: currentUser.accountNumber
        }, ...recipient.transactions]
      };

      const updatedUsers = users.map(u => 
        u.id === recipient.id ? updatedRecipient : u
      );
      setUsers(updatedUsers);
      saveToStorage(updatedUsers);

      description = `Transfer to ${recipient.accountNumber}`;
      additionalData = { to: recipient.accountNumber };
    } else if (transferForm.type === 'mobile') {
      description = `Mobile Money to ${transferForm.mobileNumber}`;
      additionalData = { mobileNumber: transferForm.mobileNumber };
    } else if (transferForm.type === 'international') {
      description = `International transfer to ${transferForm.country}`;
      additionalData = { country: transferForm.country, recipient: transferForm.recipient };
    }

    updateUserBalance(-amount, 'debit', description, additionalData);
    showNotification(`Successfully transferred $${amount.toFixed(2)}`);
    setTransferForm({ type: 'internal', recipient: '', amount: '', mobileNumber: '', country: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}> 
          {notification.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard size={32} />
                <h1 className="text-3xl font-bold">SecureBank</h1>
              </div>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}
            </div>
          </div>

          {!currentUser ? (
            <div className="p-6">
              <div className="flex gap-4 mb-6 border-b">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`pb-3 px-4 font-semibold ${
                    activeTab === 'login'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  <LogIn className="inline mr-2" size={18} />
                  Login
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`pb-3 px-4 font-semibold ${
                    activeTab === 'register'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  <UserPlus className="inline mr-2" size={18} />
                  Register
                </button>
              </div>

              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Create Account
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-6 text-white mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm opacity-90">Welcome back</p>
                    <h2 className="text-2xl font-bold mb-1">{currentUser.fullName}</h2>
                    <p className="text-sm opacity-90">Account: {currentUser.accountNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Available Balance</p>
                    <p className="text-3xl font-bold">${currentUser.balance.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mb-6 border-b overflow-x-auto">
                {['dashboard', 'transfer', 'history'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-4 font-semibold whitespace-nowrap ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {tab === 'dashboard' && <CreditCard className="inline mr-2" size={18} />}
                    {tab === 'transfer' && <Send className="inline mr-2" size={18} />}
                    {tab === 'history' && <History className="inline mr-2" size={18} />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'dashboard' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 text-green-800">Deposit</h3>
                    <form onSubmit={handleDeposit} className="space-y-4">
                      <input
                        type="number"
                        step="0.01"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        Deposit
                      </button>
                    </form>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 text-red-800">Withdraw</h3>
                    <form onSubmit={handleWithdraw} className="space-y-4">
                      <input
                        type="number"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                      >
                        Withdraw
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'transfer' && (
                <div className="max-w-2xl mx-auto">
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setTransferForm({ ...transferForm, type: 'internal' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        transferForm.type === 'internal'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Users size={18} />
                      Internal
                    </button>
                    <button
                      onClick={() => setTransferForm({ ...transferForm, type: 'mobile' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        transferForm.type === 'mobile'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Smartphone size={18} />
                      Mobile Money
                    </button>
                    <button
                      onClick={() => setTransferForm({ ...transferForm, type: 'international' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        transferForm.type === 'international'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Globe size={18} />
                      International
                    </button>
                  </div>

                  <form onSubmit={handleTransfer} className="space-y-4 bg-gray-50 p-6 rounded-lg">
                    {transferForm.type === 'internal' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recipient Account Number
                        </label>
                        <input
                          type="text"
                          value={transferForm.recipient}
                          onChange={(e) => setTransferForm({ ...transferForm, recipient: e.target.value })}
                          placeholder="ACC123456789"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    )}

                    {transferForm.type === 'mobile' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={transferForm.mobileNumber}
                          onChange={(e) => setTransferForm({ ...transferForm, mobileNumber: e.target.value })}
                          placeholder="+1234567890"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    )}

                    {transferForm.type === 'international' && (
                      <> 
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            value={transferForm.country}
                            onChange={(e) => setTransferForm({ ...transferForm, country: e.target.value })}
                            placeholder="United States"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recipient Account/IBAN
                          </label>
                          <input
                            type="text"
                            value={transferForm.recipient}
                            onChange={(e) => setTransferForm({ ...transferForm, recipient: e.target.value })}
                            placeholder="GB29NWBK60161331926819"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      Transfer Money
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Transaction History</h3>
                  <div className="space-y-3">
                    {currentUser.transactions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No transactions yet</p>
                    ) : (
                      currentUser.transactions.map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              {txn.type === 'credit' ? (
                                <div className="text-green-600">↓</div>
                              ) : (
                                <div className="text-red-600">↑</div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{txn.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(txn.date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p
                            className={`font-bold ${
                              txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {txn.type === 'credit' ? '+' : '-'}${txn.amount.toFixed(2)}
                          </p>
                        </div>
                      ))
                    )} 
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecureBank;