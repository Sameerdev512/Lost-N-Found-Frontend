import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Modal, Form, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm, useFieldArray } from 'react-hook-form';

// Add this helper function at the top of your file, after the imports
const formatDateTime = (dateString) => {
  if (!dateString) return "Unknown date/time";
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Add these constants for random images
const lostImages = [
  "https://placehold.co/300x200/dc3545/ffffff?text=Lost+Item",
  "https://placehold.co/300x200/ff6b6b/ffffff?text=Lost+Object"
];

const foundImages = [
  "https://placehold.co/300x200/198754/ffffff?text=Found+Item",
  "https://placehold.co/300x200/40c057/ffffff?text=Found+Object"
];

const claimedImages = [
  "https://placehold.co/300x200/0dcaf0/ffffff?text=Claimed+Item",
  "https://placehold.co/300x200/20c997/ffffff?text=Claimed+Object"
];

const getRandomImage = (reportType, status) => {
  // First check if the item is claimed
  if (status?.toLowerCase() === "claimed") {
    const randomIndex = Math.floor(Math.random() * claimedImages.length);
    return claimedImages[randomIndex];
  }
  
  // If not claimed, use report type to determine image
  const images = reportType?.toLowerCase() === "lost" ? lostImages : foundImages;
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      answers: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers"
  });

  // Watch all answers for debugging
  const watchAnswers = watch("answers");

  useEffect(() => {
    console.log("Current answers:", watchAnswers);
  }, [watchAnswers]);

  const handleLoadItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/all`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }

      const result = await response.json();
      console.log("Items data from backend:", result); // Debug log to check the exact field names
      setItems(result);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  useEffect(() => {
    handleLoadItems();
  }, []);

  const handleClaim = async (item) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/get-all-questions/${item.itemId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const questions = await response.json();
      setSelectedClaimItem(item);
      
      // Reset form and set initial answers array based on questions
      reset({
        answers: questions.map(q => ({
          questionId: q.id,  // Changed from q._id to q.id
          question: q.question,
          answer: ''
        }))
      });
      
      setShowClaimModal(true);
    } catch (error) {
      console.error('Error:', error);
      // Fallback questions for testing
      const dummyQuestions = [
        { id: '1', question: "What color is the item?" },  // Changed from _id to id
        { id: '2', question: "Where did you last see it?" }  // Changed from _id to id
      ];
      
      reset({
        answers: dummyQuestions.map(q => ({
          questionId: q.id,  // Changed from q._id to q.id
          question: q.question,
          answer: ''
        }))
      });
      
      setSelectedClaimItem(item);
      setShowClaimModal(true);
    }
  };

  const onSubmitAnswers = async (data) => {
    const token = localStorage.getItem("token");
    try {
      console.log("Submit Answers Clicked!");
      console.log("Form Data:", data);
      console.log("Selected Item:", selectedClaimItem);
      console.log("Raw Answers Data:", data.answers);
      const formattedAnswers = data.answers.map(answer => ({
        id: answer.questionId,
        question: answer.question,
        answer: answer.answer,
        itemId: selectedClaimItem.itemId
      }));
      console.log("Formatted Answers:", formattedAnswers);

      const response = await fetch(
        `http://localhost:8080/api/user/security-questions/validate/${selectedClaimItem.itemId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formattedAnswers),
        }
      );

      if (!response.ok) {
        alert("Wrong answers");
        // Close modal and reset form
        setShowClaimModal(false);
        setSelectedClaimItem(null);
        reset();
        return;
      }

      const result = await response.json();
      console.log("Validation Result:", result);

      if (result.message === "All answers are correct") {
        alert("You have claimed the product and will get the finder details soon.");
      }else{
        alert(result.message);
      }
      
      // Reset and close modal
      reset();
      setShowClaimModal(false);
      setSelectedClaimItem(null);

    } catch (error) {
      // Close modal and reset form on error
      setShowClaimModal(false);
      setSelectedClaimItem(null);
      reset();
      navigate("/home");
      console.error("Error submitting answers:", error);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  // Filter items based on active tab
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'claimed') return item.status?.toLowerCase() === 'claimed';
    return item.reportType?.toLowerCase() === activeTab;
  });

  const renderItems = (items) => {
    if (items.length === 0) {
      return (
        <Col>
          <Card className="text-center p-4">
            <Card.Text>
              {activeTab === 'claimed' 
                ? "No claimed items found."
                : "No items found in this category."}
            </Card.Text>
          </Card>
        </Col>
      );
    }

    return items.map((item) => {
      console.log("Individual item data:", item); // Debug log for each item
      return (
        <Col key={item.id} md={4} className="mb-4">
          <Card className="h-100 shadow hover-card">
            <div className="position-relative">
              <Card.Img 
                variant="top" 
                src={getRandomImage(item.reportType, item.status)} 
                alt={item.itemName || "Item Image"}
                style={{ height: '200px', objectFit: 'cover' }}
                className="card-img-transition"
              />
              <Badge 
                bg={item.reportType?.toLowerCase() === "lost" ? "danger" : "success"}
                className="position-absolute top-0 end-0 m-2 px-3 py-2"
              >
                {item.reportType || "Unknown"}
              </Badge>
            </div>
            
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Card.Title className="h5 text-primary mb-1">
                  {item.itemName || "Unnamed Item"}
                </Card.Title>
                <Card.Subtitle className="text-muted small">
                  <i className="bi bi-tag-fill me-1"></i>
                  {item.category || "No Category"}
                </Card.Subtitle>
              </div>

              <div className="item-details mb-3">
                <p className="mb-2">
                  <strong><i className="bi bi-geo-alt-fill me-1"></i>Location:</strong><br/>
                  <span className="text-secondary">{item.location || "No Location"}</span>
                </p>
                <p className="mb-2">
                  <strong><i className="bi bi-info-circle-fill me-1"></i>Description:</strong><br/>
                  <span className="text-secondary description-text">
                    {item.itemDescription || "No Description"}
                  </span>
                </p>
                <p className="mb-2">
                  <strong><i className="bi bi-person-fill me-1"></i>Reported By:</strong><br/>
                  <span className="text-secondary">
                    {item.finderOrOwnerName || item.finderOrWonerName || "Anonymous"}
                  </span>
                </p>
                <p className="mb-2">
                  <strong><i className="bi bi-check-circle-fill me-1"></i>Status:</strong>{" "}
                  <Badge bg={
                    item.status === "approved" ? "success" :
                    item.status === "pending" ? "warning" :
                    item.status === "claimed" ? "info" :
                    item.status === "rejected" ? "danger" : "secondary"
                  }
                  className="px-2 py-1"
                  >
                    {item.status || "Unknown"}
                  </Badge>
                </p>
                
                {/* Always show claimed information when status is claimed */}
                {item.status?.toLowerCase() === "claimed" && (
                  <>
                    <p className="mt-2 mb-1">
                      <strong><i className="bi bi-person-check-fill me-1"></i>Claimed By:</strong><br/>
                      <span className="text-secondary">
                        {item.claimedUserName || "Unknown User"}
                      </span>
                    </p>
                    <p className="mb-0">
                      <strong><i className="bi bi-clock-fill me-1"></i>Claimed At:</strong><br/>
                      <span className="text-secondary">
                        {formatDateTime(item.claimedAt)}
                      </span>
                    </p>
                  </>
                )}
              </div>

              <div className="mt-auto">
                <small className="text-muted d-block mb-3">
                  <i className="bi bi-calendar-event me-1"></i>
                  Reported on: {formatDateTime(item.date)}
                </small>
                
                <div className="d-grid gap-2 d-md-flex justify-content-between">
                  <Button 
                    variant="outline-primary" 
                    className="flex-grow-1 me-md-2"
                    onClick={() => handleViewDetails(item)}
                  >
                    <i className="bi bi-eye-fill me-1"></i>View Details
                  </Button>
                  {item.reportType?.toLowerCase() === "found" && item.status !== "claimed" && (
                    <Button 
                      variant="outline-success"
                      className="flex-grow-1"
                      onClick={() => handleClaim(item)}
                    >
                      <i className="bi bi-hand-index-thumb-fill me-1"></i>
                      Claim Item
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      );
    });
  };

  return (
    <>
      <Container className="py-5">
        {/* Welcome section */}
        <Row className="text-center mb-5">
          <Col>
            <h1 className="display-4">Welcome to Lost & Found</h1>
            <p className="lead">Your trusted platform for finding lost items and returning found ones</p>
          </Col>
        </Row>

        {/* Filter Tabs */}
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'all'} 
              onClick={() => setActiveTab('all')}
            >
              All Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'lost'} 
              onClick={() => setActiveTab('lost')}
            >
              Lost Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'found'} 
              onClick={() => setActiveTab('found')}
            >
              Found Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'claimed'} 
              onClick={() => setActiveTab('claimed')}
            >
              Claimed Items
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Items Grid */}
        <Row>
          {renderItems(filteredItems)}
        </Row>

        {/* Claim Modal */}
        <Modal 
          show={showClaimModal} 
          onHide={() => {
            setShowClaimModal(false);
            reset();
          }}
          size="lg"
        >
          <Form onSubmit={handleSubmit(onSubmitAnswers)}>
            <Modal.Header closeButton>
              <Modal.Title>Answer Security Questions</Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
              {selectedClaimItem && (
                <div className="mb-4">
                  <h6>Item Details:</h6>
                  <p className="mb-1"><strong>Name:</strong> {selectedClaimItem.itemName}</p>
                  <p className="mb-1"><strong>Category:</strong> {selectedClaimItem.category}</p>
                  <p className="mb-1"><strong>Location:</strong> {selectedClaimItem.location}</p>
                </div>
              )}

              {fields.map((field, index) => (
                <Form.Group key={field.id} className="mb-4">
                  <Form.Label>
                    <strong>{field.question}</strong>
                  </Form.Label>
                  <Form.Control
                    {...register(`answers.${index}.answer`, {
                      required: "This answer is required"
                    })}
                    type="text"
                    placeholder="Enter your answer"
                    isInvalid={errors.answers?.[index]?.answer}
                  />
                  {errors.answers?.[index]?.answer && (
                    <Form.Control.Feedback type="invalid">
                      {errors.answers[index].answer.message}
                    </Form.Control.Feedback>
                  )}
                  {/* Hidden fields to maintain question data */}
                  <input type="hidden" {...register(`answers.${index}.questionId`)} />
                  <input type="hidden" {...register(`answers.${index}.question`)} />
                </Form.Group>
              ))}
            </Modal.Body>

            <Modal.Footer>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowClaimModal(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
              >
                Submit Answers
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>

      {/* Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Item Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div className="item-details">
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{selectedItem.itemName}</h5>
                  <Badge bg={selectedItem.reportType?.toLowerCase() === "lost" ? "danger" : "success"}>
                    {selectedItem.reportType}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td width="30%"><strong>Status:</strong></td>
                        <td>
                          <Badge bg={
                            selectedItem.status === "approved" ? "success" : 
                            selectedItem.status === "claimed" ? "info" : "warning"
                          }>
                            {selectedItem.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Category:</strong></td>
                        <td>{selectedItem.category}</td>
                      </tr>
                      <tr>
                        <td><strong>Location:</strong></td>
                        <td>{selectedItem.location}</td>
                      </tr>
                      <tr>
                        <td><strong>Report Date:</strong></td>
                        <td>{formatDateTime(selectedItem.date)}</td>
                      </tr>
                      <tr>
                        <td><strong>Description:</strong></td>
                        <td>{selectedItem.itemDescription}</td>
                      </tr>
                      <tr>
                        <td><strong>Reported By:</strong></td>
                        <td>{selectedItem.finderOrOwnerName || selectedItem.finderOrWonerName || "Anonymous"}</td>
                      </tr>
                      {selectedItem.status?.toLowerCase() === "claimed" && (
                        <>
                          <tr>
                            <td><strong>Claimed By:</strong></td>
                            <td>{selectedItem.calimedUsername || "Unknown User"}</td>
                          </tr>
                          <tr>
                            <td><strong>Claimed At:</strong></td>
                            <td>{formatDateTime(selectedItem.claimedAt)}</td>
                          </tr>
                        </>
                      )}
                      {selectedItem.additionalDetails && (
                        <tr>
                          <td><strong>Additional Details:</strong></td>
                          <td>{selectedItem.additionalDetails}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HomePage;

