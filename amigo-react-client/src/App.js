import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
// Components
import Navbar from './components/Navbar';
// Pages
import home from './pages/home';
import login from './pages/login';
import signup from './pages/signup';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: "rgba(21, 132, 103, 1)",
      main: "rgba(25, 113, 99, 1)",
      dark: "rgba(6, 84, 70, 1)",
      contrastText: "#fff"
    },
    secondary: {
      light: "rgba(255, 194, 51, 1)",
      main:"rgba(250, 220, 172, 1)",
      dark:"rgba(178, 125, 0, 1)",
      contrastText: "#fff"
    },
    error: {
      light: "#e57373",
      main: "#f44336",
      dark:"#d32f2f",
      contrastText: "#fff"
    },
    typography: {
      useNextVariants: "true"
    }
  }
});

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <div className="App">
      <h1>Ami語へようこそ！</h1>
      <Router>
      <Navbar />
        <div className="container">
          <Switch>
            <Route exact path="/" component={home} />
            <Route exact path="/login" component={login} />
            <Route exact path="/signup" component={signup} />
          </Switch>
        </div>
      </Router>
    </div>
    </MuiThemeProvider>
  );
}

export default App;
