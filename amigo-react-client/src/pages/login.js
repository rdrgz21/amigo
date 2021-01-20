import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import AppIcon from '../images/translator.svg';
import axios from 'axios';

// MUI stuff
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

const styles = {
    form: {
        textAlign: 'center'
    },
    image: {
        width: '40%',
        margin: '20px auto 20px auto'
    },
    pageTitle: {
        margin: '0 auto 20px auto'
    },
    textField: {
        margin: '10px auto 10px auto'
    },
    button: {
        margin: '20px auto 20px auto',
        position: 'relative'
    },
    customError: {
        color: 'red',
        fontSize: '0.8rem',
        marginTop: '10px'
    },
    progress: {
        position: 'absolute'
    }
}

function Login(props) {
    const { classes } = props;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = (event) => {
        console.log("Submitting");
        event.preventDefault();
        setLoading(true);
        const userData = {
            email: email,
            password: password
        };
        axios.post('/login', userData)
            .then(res => {
                console.log(res.data);
                setLoading(false);
                props.history.push('/');
            })
            .catch(err => {
                setErrors(err.response.data);
                setLoading(false);
            });
    };

    const handleChange = (event) => {
        const textField = event.target.name;
        const inputText = event.target.value
        if (textField === "email") {
            setEmail(inputText);
        } else if (textField === "password") {
            setPassword(inputText)
        } else {
            return;
        }
    };

    return (
        <Grid container className={classes.form}>
            <Grid item sm />
            <Grid item sm>
                <img className={classes.image} src={AppIcon} alt="Translator Icon" />
                <Typography variant="h2" className={classes.pageTitle}>
                    Login
                </Typography>
                <form noValidate onSubmit={handleSubmit}>
                    <TextField id="email" name="email" type="email" label="Email" className={classes.textField}
                        value={email} helperText={errors.email} error={errors.email ? true : false} onChange={handleChange} fullWidth />
                    <TextField id="password" name="password" type="password" label="Password" className={classes.textField}
                        value={password} helperText={errors.password} error={errors.password ? true : false} onChange={handleChange} fullWidth />
                    {errors.general && (
                        <Typography variant="body2" className={classes.customError}>
                            {errors.general}
                        </Typography>
                    )}
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        className={classes.button}
                        disabled={loading}
                    >
                        Login
                        {loading && (
                            <CircularProgress size={30} className={classes.progress} />
                        )}
                    </Button>
                    <br />
                    <small>Don't have an account? Sign up <Link to="/signup">here</Link></small>
                </form>
            </Grid>
            <Grid item sm />
        </Grid>
    )
}

Login.propTypes = {
    classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Login);
