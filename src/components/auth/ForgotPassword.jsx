import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setStatus({ type: '', message: '' });
      
      await axios.post('http://your-api-url/auth/forgot-password', data);
      
      setStatus({
        type: 'success',
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    } catch (error) {
      setStatus({
        type: 'danger',
        message: 'Failed to process request. Please try again later.'
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
            <h2>Forgot Password</h2>
            <p>Enter your email to reset your password</p>
          </div>

          {status.message && (
            <Alert variant={status.type}>{status.message}</Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
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

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Reset Password'}
            </Button>

            <div className="text-center">
              <Link to="/login">Back to Login</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ForgotPassword;