import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setStatus({ type: '', message: '' });
      
      await axios.post('http://your-api-url/auth/reset-password', {
        token,
        password: data.password
      });
      
      setStatus({
        type: 'success',
        message: 'Password successfully reset! Redirecting to login...'
      });
      
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successful! Please login with your new password.' }
        });
      }, 2000);
    } catch (error) {
      setStatus({
        type: 'danger',
        message: 'Failed to reset password. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <Card.Body>
          <div className="auth-header">
            <h2>Reset Password</h2>
            <p>Enter your new password</p>
          </div>

          {status.message && (
            <Alert variant={status.type}>{status.message}</Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
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

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResetPassword;