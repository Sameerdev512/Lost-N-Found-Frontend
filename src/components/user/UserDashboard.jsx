import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Alert,
  Form,
  Modal,
  Tab,
  Nav
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";

const UserDashboard = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: '',
      name: '',
      category: '',
      location: '',
      description: ''
    }
  });
  const [showSecurityQuestionModal, setShowSecurityQuestionModal] = useState(false);
  const [itemSecurityQuestion, setItemSecurityQuestion] = useState("");
  const [itemSecurityAnswer, setItemSecurityAnswer] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [securityQuestions, setSecurityQuestions] = useState([
    { id: Date.now(), question: '', answer: '' }
  ]);
  const [newSecurityQuestions, setNewSecurityQuestions] = useState([
    { id: Date.now(), question: '', answer: '' }
  ]);

  // Fetch both user's items and lost items
  useEffect(() => {
    try {
      const allItems = JSON.parse(localStorage.getItem('items') || '[]');
      
      // Set user's reported items - show ALL items reported by the user
      const userItems = allItems.filter(item => item.reportedBy === user.email);
      setItems(userItems);

      // Set lost items (show approved and expected items from others, including admin)
      const lostItemsList = allItems.filter(item => 
        item.type === 'lost' && 
        (item.status === 'approved' || item.status === 'expected') &&
        item.reportedBy !== user.email // This includes admin items
      );
      setLostItems(lostItemsList);

      // Set found items (show approved and expected items from others, including admin)
      const foundItemsList = allItems.filter(item =>
        item.type === 'found' && 
        (item.status === 'approved' || item.status === 'expected') &&
        item.reportedBy !== user.email // This includes admin items
      );
      setFoundItems(foundItemsList);
    } catch (error) {
      showMessage('danger', 'Failed to fetch items');
    }
  }, [user.email]);

  // Add a function to check if an item is from admin
  const isAdminItem = (item) => {
    return item.adminProcessedBy && item.adminProcessedBy === item.reportedBy;
  };

  const handleShowModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      Object.keys(item).forEach(key => setValue(key, item[key]));
      // Set existing security questions or initialize with empty one
      if (item.securityQuestions && item.securityQuestions.length > 0) {
        setSecurityQuestions(item.securityQuestions);
      } else {
        setSecurityQuestions([{ id: Date.now(), question: '', answer: '' }]);
      }
    } else {
      reset();
      setSecurityQuestions([{ id: Date.now(), question: '', answer: '' }]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    reset();
    setSecurityQuestions([{ id: Date.now(), question: '', answer: '' }]); // Reset security questions
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const onSubmit = (data) => {
    try {
      const allItems = JSON.parse(localStorage.getItem('items') || '[]');
      
      // Validate security questions if type is "found"
      if (data.type === 'found') {
        const validQuestions = securityQuestions.filter(q => 
          q.question.trim() !== '' && q.answer.trim() !== ''
        );
        
        if (validQuestions.length === 0) {
          showMessage('danger', 'At least one security question is required for found items');
          return;
        }
      }

      if (editingItem) {
        const updatedItems = allItems.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                ...data,
                updatedAt: new Date().toISOString(),
                status: 'pending',
                securityQuestions: data.type === 'found' ? securityQuestions : []
              }
            : item
        );
        localStorage.setItem('items', JSON.stringify(updatedItems));
        // Update items to show all user items
        setItems(updatedItems.filter(item => item.reportedBy === user.email));
        showMessage('success', 'Item updated successfully');
      } else {
        const newItem = {
          id: Date.now(),
          ...data,
          reportedBy: user.email,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          securityQuestions: data.type === 'found' ? securityQuestions : []
        };
        
        const updatedItems = [...allItems, newItem];
        localStorage.setItem('items', JSON.stringify(updatedItems));
        setItems(prev => [...prev, newItem]);
        showMessage('success', 'Item reported successfully');
      }
      handleCloseModal();
    } catch (error) {
      showMessage('danger', 'Operation failed. Please try again.');
    }
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const allItems = JSON.parse(localStorage.getItem('items') || '[]');
        const updatedItems = allItems.filter(item => item.id !== itemId);
        localStorage.setItem('items', JSON.stringify(updatedItems));
        // Update items to show remaining user items
        setItems(prev => prev.filter(item => item.id !== itemId));
        showMessage('success', 'Item deleted successfully');
      } catch (error) {
        showMessage('danger', 'Failed to delete item');
      }
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      expected: 'info',
      resolved: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const handleAddSecurityQuestion = (item) => {
    setSelectedItem(item);
    setShowSecurityQuestionModal(true);
  };

  const handleSaveSecurityQuestion = () => {
    try {
      if (!itemSecurityQuestion.trim() || !itemSecurityAnswer.trim()) {
        setMessage({ type: 'danger', text: 'Question and answer are required' });
        return;
      }

      const allItems = JSON.parse(localStorage.getItem("items") || "[]");
      const newQuestion = {
        id: Date.now(),
        question: itemSecurityQuestion,
        answer: itemSecurityAnswer
      };

      const updatedItems = allItems.map(item => {
        if (item.id === selectedItem.id) {
          const existingQuestions = item.securityQuestions || [];
          return {
            ...item,
            securityQuestions: [...existingQuestions, newQuestion]
          };
        }
        return item;
      });

      localStorage.setItem("items", JSON.stringify(updatedItems));
      
      // Update the items state
      setItems(prevItems => prevItems.map(item => {
        if (item.id === selectedItem.id) {
          const existingQuestions = item.securityQuestions || [];
          return {
            ...item,
            securityQuestions: [...existingQuestions, newQuestion]
          };
        }
        return item;
      }));

      setItemSecurityQuestion("");
      setItemSecurityAnswer("");
      setShowSecurityQuestionModal(false);
      setMessage({ type: 'success', text: 'Security question added successfully' });

    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to add security question' });
    }
  };

  const handleSecurityQuestionChange = (id, field, value) => {
    setSecurityQuestions(questions =>
      questions.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const addSecurityQuestion = () => {
    setSecurityQuestions([...securityQuestions, { id: Date.now(), question: '', answer: '' }]);
  };

  const removeSecurityQuestion = (id) => {
    setSecurityQuestions(questions => questions.filter(q => q.id !== id));
  };

  const handleAddNewQuestion = () => {
    setNewSecurityQuestions([...newSecurityQuestions, { id: Date.now(), question: '', answer: '' }]);
  };

  const handleNewQuestionChange = (id, field, value) => {
    setNewSecurityQuestions(questions =>
      questions.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const handleRemoveNewQuestion = (id) => {
    setNewSecurityQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveSecurityQuestions = () => {
    try {
      // Validate questions
      const invalidQuestions = newSecurityQuestions.some(q => 
        !q.question.trim() || !q.answer.trim()
      );

      if (invalidQuestions) {
        setMessage({ type: 'danger', text: 'All questions and answers are required' });
        return;
      }

      const allItems = JSON.parse(localStorage.getItem("items") || "[]");
      
      const updatedItems = allItems.map(item => {
        if (item.id === selectedItem.id) {
          const existingQuestions = item.securityQuestions || [];
          return {
            ...item,
            securityQuestions: [...existingQuestions, ...newSecurityQuestions]
          };
        }
        return item;
      });

      localStorage.setItem("items", JSON.stringify(updatedItems));
      
      // Update the items state
      setItems(prevItems => prevItems.map(item => {
        if (item.id === selectedItem.id) {
          const existingQuestions = item.securityQuestions || [];
          return {
            ...item,
            securityQuestions: [...existingQuestions, ...newSecurityQuestions]
          };
        }
        return item;
      }));

      setNewSecurityQuestions([{ id: Date.now(), question: '', answer: '' }]);
      setShowSecurityQuestionModal(false);
      setMessage({ type: 'success', text: 'Security questions added successfully' });

    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to add security questions' });
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>My Dashboard</h1>
          <p>Welcome back, {user.username}!</p>
        </Col>
        <Col xs="auto">
          <Button onClick={() => handleShowModal()}>Report New Item</Button>
        </Col>
      </Row>

      {message.text && (
        <Alert variant={message.type} className="mb-4">
          {message.text}
        </Alert>
      )}

      <Tab.Container defaultActiveKey="myItems">
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="myItems">My Reported Items</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="lostItems">Lost Items</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="foundItems">Found Items</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="myItems">
            <Card>
              <Card.Header>
                <h4>My Reported Items</h4>
              </Card.Header>
              <Card.Body>
                {items.length === 0 ? (
                  <Alert variant="info">You haven't reported any items yet.</Alert>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {items.map(item => (
                      <Col key={item.id}>
                        <Card>
                          <Card.Body>
                            <Card.Title className="d-flex justify-content-between align-items-start">
                              {item.name}
                              <Badge bg={item.type === 'lost' ? 'danger' : 'success'}>
                                {item.type}
                              </Badge>
                            </Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                              {item.category}
                            </Card.Subtitle>
                            <Card.Text>
                              <strong>Location:</strong> {item.location}<br/>
                              <strong>Description:</strong><br/>
                              {item.description}
                            </Card.Text>
                            <div className="mb-3">
                              <Badge bg={getStatusBadgeVariant(item.status)}>
                                {item.status}
                              </Badge>
                              <small className="text-muted ms-2">
                                Reported on: {new Date(item.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                            {item.type === 'found' && item.securityQuestions?.length > 0 && (
                              <div className="mb-3">
                                <strong>Security Questions:</strong>
                                <ol className="ps-3 mt-2">
                                  {item.securityQuestions.map((q, index) => (
                                    <li key={index}>{q.question}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleShowModal(item)}
                                disabled={item.status === 'approved' || item.status === 'resolved'}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete(item.id)}
                                disabled={item.status === 'approved' || item.status === 'resolved'}
                              >
                                Delete
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="lostItems">
            <Card>
              <Card.Header>
                <h4>Lost Items</h4>
              </Card.Header>
              <Card.Body>
                {lostItems.length === 0 ? (
                  <Alert variant="info">No lost items found.</Alert>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {lostItems.map(item => (
                      <Col key={item.id}>
                        <Card>
                          <Card.Body>
                            <Card.Title className="d-flex justify-content-between align-items-start">
                              {item.name}
                              <div>
                                <Badge bg={item.type === 'lost' ? 'danger' : 'success'} className="me-1">
                                  {item.type}
                                </Badge>
                                {isAdminItem(item) && (
                                  <Badge bg="info">Admin</Badge>
                                )}
                              </div>
                            </Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                              {item.category}
                            </Card.Subtitle>
                            <Card.Text>
                              <strong>Location:</strong> {item.location}<br/>
                              <strong>Description:</strong><br/>
                              {item.description}
                            </Card.Text>
                            <div className="mb-3">
                              <Badge bg={getStatusBadgeVariant(item.status)} className="me-2">
                                {item.status}
                              </Badge>
                              <small className="text-muted">
                                Reported on: {new Date(item.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                            <Button
                              variant="primary"
                              onClick={() => handleInitiateClaim(item)}
                              className="w-100"
                              disabled={item.status === 'expected'}
                            >
                              {item.status === 'expected' ? 'Item Expected' : 'Claim Item'}
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="foundItems">
            <Card>
              <Card.Header>
                <h4>Found Items</h4>
              </Card.Header>
              <Card.Body>
                {foundItems.length === 0 ? (
                  <Alert variant="info">No found items available.</Alert>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {foundItems.map(item => (
                      <Col key={item.id}>
                        <Card>
                          <Card.Body>
                            <Card.Title className="d-flex justify-content-between align-items-start">
                              {item.name}
                              <div>
                                <Badge bg={item.type === 'lost' ? 'danger' : 'success'} className="me-1">
                                  {item.type}
                                </Badge>
                                {isAdminItem(item) && (
                                  <Badge bg="info">Admin</Badge>
                                )}
                              </div>
                            </Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                              {item.category}
                            </Card.Subtitle>
                            <Card.Text>
                              <strong>Location:</strong> {item.location}<br/>
                              <strong>Description:</strong><br/>
                              {item.description}
                            </Card.Text>
                            <div className="mb-3">
                              <Badge bg={getStatusBadgeVariant(item.status)} className="me-2">
                                {item.status}
                              </Badge>
                              <small className="text-muted">
                                Reported on: {new Date(item.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                            {item.securityQuestions?.length > 0 && (
                              <div className="mb-3">
                                <strong>Security Questions:</strong>
                                <ol className="ps-3 mt-2">
                                  {item.securityQuestions.map((q, index) => (
                                    <li key={index}>{q.question}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            <Button
                              variant="primary"
                              onClick={() => handleAnswerSecurityQuestions(item)}
                              className="w-100"
                              disabled={item.status === 'expected'}
                            >
                              {item.status === 'expected' ? 'Item Expected' : 'Claim This Item'}
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Report/Edit Item Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'Edit Item Report' : 'Report New Item'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Report Type</Form.Label>
              <Form.Select
                {...register('type', { required: 'Please select a type' })}
                isInvalid={!!errors.type}
              >
                <option value="">Select Type</option>
                <option value="lost">Lost Item</option>
                <option value="found">Found Item</option>
              </Form.Select>
              {errors.type && (
                <Form.Control.Feedback type="invalid">
                  {errors.type.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                {...register('name', { required: 'Item name is required' })}
                isInvalid={!!errors.name}
                placeholder="Enter item name"
              />
              {errors.name && (
                <Form.Control.Feedback type="invalid">
                  {errors.name.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                {...register('category', { required: 'Please select a category' })}
                isInvalid={!!errors.category}
              >
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </Form.Select>
              {errors.category && (
                <Form.Control.Feedback type="invalid">
                  {errors.category.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                {...register('location', { required: 'Location is required' })}
                isInvalid={!!errors.location}
                placeholder="Enter location"
              />
              {errors.location && (
                <Form.Control.Feedback type="invalid">
                  {errors.location.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                {...register('description', { required: 'Description is required' })}
                isInvalid={!!errors.description}
                placeholder="Enter detailed description"
              />
              {errors.description && (
                <Form.Control.Feedback type="invalid">
                  {errors.description.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Add Security Questions section that shows only when type is "found" */}
            {watch('type') === 'found' && (
              <div className="mt-4">
                <h5>Security Questions</h5>
                <p className="text-muted small">Add questions that the owner should be able to answer to claim this item</p>
                
                {securityQuestions.map((q, index) => (
                  <div key={q.id} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6>Question {index + 1}</h6>
                      {securityQuestions.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeSecurityQuestion(q.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <Form.Group className="mb-2">
                      <Form.Label>Question</Form.Label>
                      <Form.Control
                        type="text"
                        value={q.question}
                        onChange={(e) => handleSecurityQuestionChange(q.id, 'question', e.target.value)}
                        placeholder="Enter security question"
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group>
                      <Form.Label>Answer</Form.Label>
                      <Form.Control
                        type="text"
                        value={q.answer}
                        onChange={(e) => handleSecurityQuestionChange(q.id, 'answer', e.target.value)}
                        placeholder="Enter answer"
                        required
                      />
                    </Form.Group>
                  </div>
                ))}
                
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={addSecurityQuestion}
                  className="mb-3"
                >
                  + Add Another Question
                </Button>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingItem ? 'Update Report' : 'Submit Report'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add this modal for security questions */}
      <Modal show={showSecurityQuestionModal} onHide={() => setShowSecurityQuestionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Security Question for Found Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={selectedItem?.name || ""}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Security Question</Form.Label>
              <Form.Control
                type="text"
                value={itemSecurityQuestion}
                onChange={(e) => setItemSecurityQuestion(e.target.value)}
                placeholder="Enter security question for this item"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Security Answer</Form.Label>
              <Form.Control
                type="text"
                value={itemSecurityAnswer}
                onChange={(e) => setItemSecurityAnswer(e.target.value)}
                placeholder="Enter answer to the security question"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSecurityQuestionModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveSecurityQuestion}>
            Save Question
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserDashboard;
