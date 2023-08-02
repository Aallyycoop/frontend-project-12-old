import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, useLocation, Link,
} from 'react-router-dom';
import { Navbar, Button } from 'react-bootstrap';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import ChatPage from './ChatPage';
import LoginPage from './LoginPage';
import NotFoundPage from './NotFoundPage';
import { AuthContext, SocketContext } from '../contexts/index.jsx';
import { useAuth } from '../hooks/index.jsx';
import { actions as messagesActions } from '../slices/messagesSlice';
import { actions as channelsActions } from '../slices/channelsSlice';

const AuthProvider = ({ children }) => {
  // console.log('localStorage', localStorage);
  const user = JSON.parse(localStorage.getItem('userId'));

  const [loggedIn, setLoggedIn] = useState(user && user.token);

  const logIn = () => setLoggedIn(true);
  const logOut = () => {
    localStorage.removeItem('userId');
    setLoggedIn(false);
  };

  const getToken = () => {
    if (loggedIn) {
      return user.token;
    }
    return {};
  };

  return (
    /* eslint-disable-next-line */
    <AuthContext.Provider value={{ loggedIn, logIn, logOut, getToken, user }}>
      {children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  return (
    auth.loggedIn ? children : <Navigate to="/login" state={{ from: location }} />
  );
};

const LogOutButton = () => {
  const auth = useAuth();
  return (
    auth.loggedIn
      ? <Button onClick={auth.logOut}>Выйти</Button>
      : null
  );
};

const App = () => {
  const socket = io('ws://localhost:3000');
  const dispatch = useDispatch();

  const { addMessage } = messagesActions;
  const { addChannel } = channelsActions;

  useEffect(() => {
    socket.on('newMessage', (message) => {
      dispatch(addMessage(message));
    });
    return () => {
      socket.off('newMessage');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on('newChannel', (channel) => {
      dispatch(addChannel(channel));
    });
    return () => {
      socket.off('newChannel');
    };
  });

  const sendMessage = useCallback((...args) => new Promise((resolve, reject) => {
    socket.timeout(5000).emit('newMessage', ...args, (err) => {
      /* eslint-disable-next-line */
      if (err) {
        reject(err);
      }
      resolve();
    });
  }), [socket]);

  const newChannel = useCallback((...args) => new Promise((resolve, reject) => {
    socket.timeout(5000).emit('newChannel', ...args, (err, response) => {
      /* eslint-disable-next-line */
      if (err) {
        reject(err);
      }
      console.log('response', response);
      resolve(response);
    });
  }), [socket]);

  const socketApi = useMemo(() => ({ sendMessage, newChannel }), [sendMessage, newChannel]);

  return (
    <SocketContext.Provider value={socketApi}>
      <AuthProvider>
        <BrowserRouter>
          <div className="d-flex flex-column h-100">
            <Navbar className="shadow-sm" bg="white" expand="lg">
              <div className="container">
                <Navbar.Brand as={Link} to="/">Hexlet Chat</Navbar.Brand>
                <LogOutButton />
              </div>
            </Navbar>
            <Routes>
              <Route path="*" element={<NotFoundPage />} />
              <Route
                path="/"
                element={(
                  <PrivateRoute>
                    <ChatPage />
                  </PrivateRoute>
                )}
              />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </SocketContext.Provider>
  );
};

export default App;
