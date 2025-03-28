import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [registerError, setRegisterError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const password = watch('password');

  // Check if admin exists and create one if not
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some(user => user.role === 'admin');

    if (!adminExists) {
      // Create default admin account
      const adminUser = {
        id: Date.now(),
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin@123', // In real app, use hashed password
        role: 'admin',
        isActive: true
      };
      users.push(adminUser);
      localStorage.setItem('users', JSON.stringify(users));
      console.log('Default admin account created');
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      setRegisterError('');
      
      // Get existing users
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check for duplicate email
      const emailExists = existingUsers.some(user => user.email === data.email);
      if (emailExists) {
        throw new Error('An account with this email already exists');
      }

      // Check for duplicate username
      const usernameExists = existingUsers.some(user => user.username === data.username);
      if (usernameExists) {
        throw new Error('This username is already taken');
      }

      // Check if this is admin registration (using admin code)
      const isAdmin = data.adminCode === 'ADMIN123'; // In real app, use secure method

      // Create new user object
      const newUser = {
        id: Date.now(),
        username: data.username,
        email: data.email,
        password: data.password, // In real app, use hashed password
        role: isAdmin ? 'admin' : 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Save user to localStorage
      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Create user session data
      const userData = {
        token: `mock-token-${Date.now()}`,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      };

      // Log the user in
      login(userData);

      // Redirect based on role
      navigate(newUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');

    } catch (error) {
      setRegisterError(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container register-container">
      <Card className="register-card">
        <Card.Body>
          <div className="register-header">
            <h2>Create Account</h2>
            <p>Please fill in your details to register</p>
          </div>

          {registerError && <Alert variant="danger">{registerError}</Alert>}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers and underscores'
                  }
                })}
                isInvalid={!!errors.username}
              />
              {errors.username && (
                <Form.Control.Feedback type="invalid">
                  {errors.username.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
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

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
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

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => 
                    value === password || 'Passwords do not match'
                })}
                isInvalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Admin Code (Optional)</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter admin code if applicable"
                {...register('adminCode')}
              />
              <Form.Text className="text-muted">
                Leave empty for regular user registration
              </Form.Text>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
            >
              Register
            </Button>

            <div className="text-center">
              <p>
                Already have an account?{' '}
                <Link to="/login">Login here</Link>
              </p>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Register;
