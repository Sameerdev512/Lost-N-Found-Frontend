import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loginError, setLoginError] = useState('');
  // const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('http://your-api-url/auth/login', data);
      const { token, role } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Redirect based on role
      if (role === 'admin') {
        // navigate('/admin/dashboard');
      } else {
        // navigate('/dashboard');
      }
    } catch (error) {
      setLoginError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please sign in to continue</p>
        </div>

        {loginError && <Alert variant="danger">{loginError}</Alert>}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="form-group">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              isInvalid={!!errors.email}
            />
            {errors.email && (
              <Form.Control.Feedback type="invalid">
                {errors.email.message}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              isInvalid={!!errors.password}
            />
            {errors.password && (
              <Form.Control.Feedback type="invalid">
                {errors.password.message}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="login-button"
          >
            Sign In
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;