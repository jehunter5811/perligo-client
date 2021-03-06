import axios from "axios";
import { setAlert } from "./alert";
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_PROFILE,
  EMAIL_NOT_VERIFIED, 
  EMAIL_VERIFIED
} from "../actions/types";
import setAuthToken from "../utils/setAuthToken";
import jwt from 'jsonwebtoken';

const ENDPOINT = "http://localhost:4000";

//  Load User
export const checkSession = () => async (dispatch) => {
  const token = localStorage.token;
  if (token) {
    setAuthToken(token);
  }

  try {
    const res = await axios.post(ENDPOINT, {
      query: `mutation {
          checkSession {
          message
        }
      }
    `,
    });
    if(res.data.errors) {
      dispatch({
        type: AUTH_ERROR,
      });
    } else {
      const decoded = jwt.decode(token);
    
      const { user } = decoded;
      
      dispatch({
        type: USER_LOADED,
        payload: { user, token },
      });
    }
  } catch (error) {
    dispatch({
      type: AUTH_ERROR,
    });
  }
};

//  Register
export const register = ({ firstName, lastName, email, password }) => async (
  dispatch
) => {
  try {
    const res = await axios.post(ENDPOINT, {
      query: `mutation {
          createUser(email:"${email}", firstName:"${firstName}", lastName:"${lastName}", password: "${password}") {
          message
        }
      }
    `,
    });

    if (res.data.errors) {
      const { errors } = res.data;
      const { message } = errors[0];
      const realErrors = JSON.parse(message);
      const errorMessage = realErrors.errors[0].message;
      throw new Error(errorMessage);
    }

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data,
    });
  } catch (error) {    
    dispatch(setAlert(error.msg, "error"));

    dispatch({
      type: REGISTER_FAIL,
    });
  }
};

//  Login
export const login = ({email, password}) => async (dispatch) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const res = await axios.post(ENDPOINT, {
      query: `mutation {
        logUserIn(email:"${email}", password: "${password}") {
          message
          body
        }
        }
      `,
    }, config);

    if (res.data.errors) {
      throw new Error('Invalid password/email')
    }
    
    const token = res.data.data.logUserIn.body;
    //  Decode JWT: 
    const decoded = jwt.decode(token);
    
    const { user } = decoded;

    if(!user.emailVerified) {
      dispatch({
        type: EMAIL_NOT_VERIFIED, 
        payload: { user, token }
      })
    } else {
      dispatch({
        type: LOGIN_SUCCESS,
        payload: { user, token },
      });
    }
  } catch (error) {
    dispatch(setAlert(error.message, "error"));

    dispatch({
      type: LOGIN_FAIL,
    });
  }
};

export const resendVerificationEmail = (token) => async (dispatch) => {
  try {
    const res = await axios.post(ENDPOINT, {
      query: `mutation {
        resendVerification(token:"${token}") {
          message
          body
        }
        }
      `,
    });
    
    if (res.data.errors) {
      throw new Error('trouble sending email')
    }

    return res;
  } catch (error) {
    dispatch(setAlert(error.msg, "error"));
  }
}

export const verifyEmail = (token) => async (dispatch) => {
  try {
    const res = await axios.post(ENDPOINT, {
      query: `mutation {
        verifyEmail(token:"${token}") {
          message
          body
        }
        }
      `,
    });

    if (res.data.errors) {
      throw new Error('trouble verifying email')
    }

    const newToken = res.data.data.verifyEmail.body;
    //  Decode JWT: 
    const decoded = jwt.decode(newToken);
    
    const { user } = decoded;
    dispatch({
      type: EMAIL_VERIFIED, 
      payload: {user, token: newToken}
    });
    setTimeout(window.location.replace('/'), 2000)
    
  } catch (error) {
    dispatch(setAlert(error.msg, "error"));
  }
}

//  Logout / Clear Profile
export const logout = () => (dispatch) => {
  dispatch({ type: CLEAR_PROFILE });
  dispatch({ type: LOGOUT });
};
