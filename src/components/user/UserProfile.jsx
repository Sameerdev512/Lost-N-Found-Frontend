import { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";

const UserProfile = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Load profile data from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfileData(parsedProfile);
      reset(parsedProfile);
    }
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/user/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfileData(data);
      reset(data);
      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify(data));
    } catch (error) {
      showMessage("danger", "Failed to load profile data");
      // Load from localStorage as fallback
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfileData(parsedProfile);
        reset(parsedProfile);
      }
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const role = localStorage.getItem("role")

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      
      try {
        // Try to update via API first
        const response = await fetch("http://localhost:8080/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("API update failed");
        }

        const updatedData = await response.json();
        setProfileData(updatedData);
        localStorage.setItem('userProfile', JSON.stringify(updatedData));
      } catch (apiError) {
        // If API fails, update localStorage only
        console.log("API update failed, falling back to localStorage", apiError);
        const updatedData = {
          ...profileData,
          ...data,
          updatedAt: new Date().toISOString()
        };
        setProfileData(updatedData);
        localStorage.setItem('userProfile', JSON.stringify(updatedData));
      }

      setIsEditing(false);
      showMessage("success", "Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);
      showMessage("danger", "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const userdetails = localStorage.getItem("user");

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg border-0 rounded-3">
            <Card.Header className="bg-gradient-primary text-white py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-1 fw-bold">Profile Details</h3>
                  <p className="mb-0 opacity-75 small">
                    <i className="bi bi-info-circle me-2"></i>
                    Manage your personal information
                  </p>
                </div>
                <Button
                  variant={isEditing ? "light" : "outline-light"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 rounded-pill"
                >
                  {isEditing ? (
                    <>
                      <i className="bi bi-x-lg me-2"></i>Cancel
                    </>
                  ) : (
                    <>
                      <i className="bi bi-pencil-square me-2"></i>Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              {message.text && (
                <Alert
                  variant={message.type}
                  className="mb-4 d-flex align-items-center rounded-3 border-0 shadow-sm"
                >
                  <i className={`bi bi-${message.type === "success" ? "check-circle-fill" : "exclamation-circle-fill"} me-2`}></i>
                  {message.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit(onSubmit)} className="profile-form">
                <Row className="mb-4 g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-primary">
                        <i className="bi bi-person-fill me-2"></i>First Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        {...register("firstName", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "First name must be at least 2 characters"
                          }
                        })}
                        disabled={!isEditing}
                        isInvalid={!!errors.firstName}
                        className="py-2 rounded-3 shadow-sm"
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <Form.Control.Feedback type="invalid">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          {errors.firstName.message}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-primary">
                        <i className="bi bi-person-fill me-2"></i>Last Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        {...register("lastName", {
                          required: "Last name is required",
                          minLength: {
                            value: 2,
                            message: "Last name must be at least 2 characters"
                          }
                        })}
                        disabled={!isEditing}
                        isInvalid={!!errors.lastName}
                        className="py-2 rounded-3 shadow-sm"
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <Form.Control.Feedback type="invalid">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          {errors.lastName.message}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-primary">
                    <i className="bi bi-envelope-fill me-2"></i>Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    {...register("email")}
                    disabled={true}
                    className="py-2 bg-light rounded-3 shadow-sm"
                    placeholder={role=="ADMIN" ? "admin@gmail.com" : "sameer.khatri2022@sait.ac.in"}
                    
                  />
                  <Form.Text className="text-muted mt-2 d-block">
                    <i className="bi bi-shield-lock-fill me-1"></i>
                    Email cannot be changed for security reasons
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-primary">
                    <i className="bi bi-telephone-fill me-2"></i>Phone Number
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    {...register("phoneNumber", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^\d{10}$/,
                        message: "Please enter a valid 10-digit phone number"
                      }
                    })}
                    disabled={!isEditing}
                    isInvalid={!!errors.phoneNumber}
                    className="py-2 rounded-3 shadow-sm"
                    placeholder="Enter 10-digit phone number"
                  />
                  {errors.phoneNumber && (
                    <Form.Control.Feedback type="invalid">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {errors.phoneNumber.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-primary">
                    <i className="bi bi-geo-alt-fill me-2"></i>Address
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    {...register("address", {
                      required: "Address is required",
                      minLength: {
                        value: 10,
                        message: "Please enter a complete address"
                      }
                    })}
                    disabled={!isEditing}
                    isInvalid={!!errors.address}
                    className="py-2 rounded-3 shadow-sm"
                    placeholder="Enter your full address"
                  />
                  {errors.address && (
                    <Form.Control.Feedback type="invalid">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {errors.address.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                {isEditing && (
                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        reset(profileData);
                      }}
                      className="px-4 rounded-pill"
                    >
                      <i className="bi bi-x-circle-fill me-2"></i>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 rounded-pill"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle-fill me-2"></i>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;




