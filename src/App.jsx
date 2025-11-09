import React, { useState, useEffect } from 'react';
import { Search, User, Users, Home, Plus, LogOut, Settings, Clock, Star, Download, ExternalLink, X, Check, UserPlus, MessageCircle } from 'lucide-react';

const GamePlatform = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [friends, setFriends] = useState([]);
  const [page, setPage] = useState('login');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Формы
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [gameForm, setGameForm] = useState({
    title: '',
    description: '',
    price: '',
    coverImage: '',
    screenshots: '',
    licenseLink: '',
    freeLink: ''
  });
  const [friendSearch, setFriendSearch] = useState('');

  // Загрузка данных при старте
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Загрузка пользователей
      const usersResult = await window.storage.list('user:', true);
      if (usersResult && usersResult.keys) {
        const loadedUsers = await Promise.all(
          usersResult.keys.map(async key => {
            try {
              const result = await window.storage.get(key, true);
              return result ? JSON.parse(result.value) : null;
            } catch {
              return null;
            }
          })
        );
        setUsers(loadedUsers.filter(u => u));
      }

      // Загрузка игр
      const gamesResult = await window.storage.list('game:', true);
      if (gamesResult && gamesResult.keys) {
        const loadedGames = await Promise.all(
          gamesResult.keys.map(async key => {
            try {
              const result = await window.storage.get(key, true);
              return result ? JSON.parse(result.value) : null;
            } catch {
              return null;
            }
          })
        );
        setGames(loadedGames.filter(g => g));
      }

      // Проверка текущего пользователя
      try {
        const currentUserResult = await window.storage.get('currentUser', false);
        if (currentUserResult) {
          const user = JSON.parse(currentUserResult.value);
          setCurrentUser(user);
          setPage('home');
          loadFriends(user.id);
        }
      } catch {
        // Пользователь не залогинен
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const loadFriends = async (userId) => {
    try {
      const friendsResult = await window.storage.get(`friends:${userId}`, true);
      if (friendsResult) {
        setFriends(JSON.parse(friendsResult.value));
      }
    } catch {
      setFriends([]);
    }
  };

  const register = async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Пароли не совпадают!');
      return;
    }
    if (registerForm.username.length < 3) {
      alert('Никнейм должен быть минимум 3 символа');
      return;
    }

    const existingUser = users.find(u => u.username === registerForm.username);
    if (existingUser) {
      alert('Пользователь с таким именем уже существует!');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      username: registerForm.username,
      password: registerForm.password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${registerForm.username}`,
      createdAt: new Date().toISOString()
    };

    try {
      await window.storage.set(`user:${newUser.id}`, JSON.stringify(newUser), true);
      await window.storage.set('currentUser', JSON.stringify(newUser), false);
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setPage('home');
      setRegisterForm({ username: '', password: '', confirmPassword: '' });
    } catch (error) {
      alert('Ошибка регистрации: ' + error.message);
    }
  };

  const login = async () => {
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      try {
        await window.storage.set('currentUser', JSON.stringify(user), false);
        setCurrentUser(user);
        setPage('home');
        loadFriends(user.id);
        setLoginForm({ username: '', password: '' });
      } catch (error) {
        alert('Ошибка входа: ' + error.message);
      }
    } else {
      alert('Неверный логин или пароль!');
    }
  };

  const logout = async () => {
    try {
      await window.storage.delete('currentUser', false);
      setCurrentUser(null);
      setPage('login');
      setFriends([]);
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const addGame = async () => {
    if (!gameForm.title || !gameForm.description) {
      alert('Заполните название и описание игры');
      return;
    }

    const newGame = {
      id: Date.now().toString(),
      ...gameForm,
      screenshots: gameForm.screenshots.split(',').map(s => s.trim()).filter(s => s),
      author: currentUser.username,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
      rating: 0,
      reviews: 0
    };

    try {
      await window.storage.set(`game:${newGame.id}`, JSON.stringify(newGame), true);
      setGames([...games, newGame]);
      setGameForm({
        title: '',
        description: '',
        price: '',
        coverImage: '',
        screenshots: '',
        licenseLink: '',
        freeLink: ''
      });
      setPage('home');
      alert('Игра успешно добавлена!');
    } catch (error) {
      alert('Ошибка добавления игры: ' + error.message);
    }
  };

  const addFriend = async (friendUsername) => {
    const friend = users.find(u => u.username === friendUsername);
    if (!friend) {
      alert('Пользователь не найден!');
      return;
    }
    if (friend.id === currentUser.id) {
      alert('Нельзя добавить самого себя!');
      return;
    }
    if (friends.some(f => f.id === friend.id)) {
      alert('Уже в друзьях!');
      return;
    }

    const newFriends = [...friends, { id: friend.id, username: friend.username, avatar: friend.avatar }];
    try {
      await window.storage.set(`friends:${currentUser.id}`, JSON.stringify(newFriends), true);
      setFriends(newFriends);
      setFriendSearch('');
      alert(`${friendUsername} добавлен в друзья!`);
    } catch (error) {
      alert('Ошибка добавления друга: ' + error.message);
    }
  };

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGames = games.filter(game => game.authorId === currentUser?.id);

  // Экран входа/регистрации
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="flex items-center justify-center mb-8">
            <div className="text-4xl font-bold text-blue-400">GameHub</div>
          </div>
          
          {page === 'login' ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Вход</h2>
              <input
                type="text"
                placeholder="Никнейм"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={login}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
              >
                Войти
              </button>
              <button
                onClick={() => setPage('register')}
                className="w-full mt-3 text-blue-400 hover:text-blue-300 transition"
              >
                Нет аккаунта? Зарегистрироваться
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Регистрация</h2>
              <input
                type="text"
                placeholder="Никнейм"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={register}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
              >
                Зарегистрироваться
              </button>
              <button
                onClick={() => setPage('login')}
                className="w-full mt-3 text-blue-400 hover:text-blue-300 transition"
              >
                Уже есть аккаунт? Войти
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Главный интерфейс
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Верхняя панель */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold text-blue-400">GameHub</div>
            <nav className="flex gap-6">
              <button
                onClick={() => setPage('home')}
                className={`flex items-center gap-2 px-3 py-2 rounded transition ${page === 'home' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                <Home size={18} />
                Магазин
              </button>
              <button
                onClick={() => setPage('friends')}
                className={`flex items-center gap-2 px-3 py-2 rounded transition ${page === 'friends' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                <Users size={18} />
                Друзья ({friends.length})
              </button>
              <button
                onClick={() => setPage('myGames')}
                className={`flex items-center gap-2 px-3 py-2 rounded transition ${page === 'myGames' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                <User size={18} />
                Мои игры ({myGames.length})
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {page === 'home' && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Поиск игр..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <button
              onClick={() => setPage('addGame')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <Plus size={18} />
              Добавить игру
            </button>
            
            <div className="flex items-center gap-3">
              <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full" />
              <span className="font-medium">{currentUser.username}</span>
              <button
                onClick={logout}
                className="text-red-400 hover:text-red-300 transition"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Страница магазина */}
        {page === 'home' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Каталог игр</h1>
            {filteredGames.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl mb-2">Пока нет игр в каталоге</p>
                <p>Будь первым, кто добавит игру!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGames.map(game => (
                  <div key={game.id} className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition duration-300 border border-gray-700">
                    <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      {game.coverImage ? (
                        <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">🎮</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{game.title}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{game.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-400 font-bold">{game.price ? `${game.price}₽` : 'Бесплатно'}</span>
                        <span className="text-sm text-gray-500">by {game.author}</span>
                      </div>
                      <div className="space-y-2">
                        {game.licenseLink && (
                          <a
                            href={game.licenseLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition"
                          >
                            <ExternalLink size={16} />
                            Купить лицензию
                          </a>
                        )}
                        {game.freeLink && (
                          <a
                            href={game.freeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition"
                          >
                            <Download size={16} />
                            Скачать бесплатно
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Страница друзей */}
        {page === 'friends' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Друзья</h1>
            
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Добавить друга</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Введите никнейм..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => addFriend(friendSearch)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded flex items-center gap-2 transition"
                >
                  <UserPlus size={18} />
                  Добавить
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(friend => (
                <div key={friend.id} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 border border-gray-700">
                  <img src={friend.avatar} alt="" className="w-16 h-16 rounded-full" />
                  <div className="flex-1">
                    <h3 className="font-bold">{friend.username}</h3>
                    <span className="text-green-400 text-sm">● Онлайн</span>
                  </div>
                </div>
              ))}
            </div>

            {friends.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Users size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl">У вас пока нет друзей</p>
                <p>Добавьте друзей, чтобы делиться играми!</p>
              </div>
            )}
          </div>
        )}

        {/* Мои игры */}
        {page === 'myGames' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Мои игры</h1>
            {myGames.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl mb-2">Вы еще не добавили ни одной игры</p>
                <button
                  onClick={() => setPage('addGame')}
                  className="mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded inline-flex items-center gap-2 transition"
                >
                  <Plus size={20} />
                  Добавить первую игру
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGames.map(game => (
                  <div key={game.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      {game.coverImage ? (
                        <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">🎮</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{game.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{game.description}</p>
                      <div className="text-green-400 font-bold">{game.price ? `${game.price}₽` : 'Бесплатно'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Добавление игры */}
        {page === 'addGame' && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Добавить игру</h1>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название игры *</label>
                  <input
                    type="text"
                    value={gameForm.title}
                    onChange={(e) => setGameForm({...gameForm, title: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: Cyberpunk 2077"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Описание *</label>
                  <textarea
                    value={gameForm.description}
                    onChange={(e) => setGameForm({...gameForm, description: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Расскажите о вашей игре..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Цена (₽)</label>
                  <input
                    type="number"
                    value={gameForm.price}
                    onChange={(e) => setGameForm({...gameForm, price: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Оставьте пустым для бесплатной игры"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL обложки</label>
                  <input
                    type="url"
                    value={gameForm.coverImage}
                    onChange={(e) => setGameForm({...gameForm, coverImage: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Скриншоты (через запятую)</label>
                  <input
                    type="text"
                    value={gameForm.screenshots}
                    onChange={(e) => setGameForm({...gameForm, screenshots: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="url1, url2, url3"
                  />
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="font-bold text-lg mb-4">Ссылки для скачивания</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      <ExternalLink size={16} className="inline mr-2" />
                      Официальная лицензия (Steam, Epic Games и т.д.)
                    </label>
                    <input
                      type="url"
                      value={gameForm.licenseLink}
                      onChange={(e) => setGameForm({...gameForm, licenseLink: e.target.value})}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://store.steampowered.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Download size={16} className="inline mr-2" />
                      Бесплатная версия (Google Drive, Яндекс.Диск и т.д.)
                    </label>
                    <input
                      type="url"
                      value={gameForm.freeLink}
                      onChange={(e) => setGameForm({...gameForm, freeLink: e.target.value})}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={addGame}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition"
                  >
                    Добавить игру
                  </button>
                  <button
                    onClick={() => setPage('home')}
                    className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePlatform;