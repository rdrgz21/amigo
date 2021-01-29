import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import themeFile from './util/theme';
import jwtDecode from 'jwt-decode';
import AuthRoute from './util/AuthRoute';
// Redux
import { Provider } from 'react-redux';
import store from './redux/store';
import { SET_AUTHENTICATED, SET_UNAUTHENTICATED } from './redux/types';
import { logoutUser, getUserData } from './redux/actions/userActions';
// Components
import Navbar from './components/Navbar';
// Pages
import home from './pages/home';
import login from './pages/login';
import signup from './pages/signup';
import axios from 'axios';

const theme = createMuiTheme(themeFile);

let authenticated;
const token = localStorage.FBIdToken;

if (token) {
  const decodedToken = jwtDecode(token);
  console.log(decodedToken);
  // If token expired, redirect to login
  if (decodedToken.exp * 1000 < Date.now()){
    store.dispatch(logoutUser())
    window.location.href = '/login'
  } else {
    store.dispatch({ type: SET_AUTHENTICATED });
    axios.defaults.headers.common['Authorization'] = token;
    store.dispatch(getUserData);
  }
}

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <Provider store={store}>
      <h1>Ami語へようこそ！</h1>
      <Router>
        <Navbar />
          <div className="container">
            <Switch>
              <Route exact path="/" component={home} />
              {/* AuthRoute checks if authenticated. If true, redirects to home page */}
              <AuthRoute exact path="/login" component={login} />
              <AuthRoute exact path="/signup" component={signup} />
            </Switch>
          </div>
          </Router>
      </Provider>
      

    </MuiThemeProvider>
  );
}

export default App;
