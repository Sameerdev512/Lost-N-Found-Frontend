import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Tab,
  Nav,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSecurityQuestionModal, setShowSecurityQuestionModal] = useState(false);
  const [itemSecurityQuestions, setItemSecurityQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    answer: ''
  });

  // Fetch data
  useEffect(() => {
    const fetchData = () => {
      try {
        setLoading(true);
        // Get users from localStorage
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
        setUsers(storedUsers.filter(u => u.username !== "admin")); // Exclude default admin

        // Get items from localStorage
        const storedItems = JSON.parse(localStorage.getItem("items") || "[]");
        setItems(storedItems.filter(item => item.status === "pending"));

        // Get security questions from localStorage
        const storedQuestions = JSON.parse(localStorage.getItem("securityQuestions") || "[]");
        setSecurityQuestions(storedQuestions);

      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle user status toggle
  const handleUserStatus = (userId) => {
    try {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, isActive: !u.isActive };
        }
        return u;
      });

      // Update localStorage
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const finalUsers = allUsers.map(u => {
        if (u.id === userId) {
          return { ...u, isActive: !u.isActive };
        }
        return u;
      });

      localStorage.setItem("users", JSON.stringify(finalUsers));
      setUsers(updatedUsers);
      setSuccessMessage("User status updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      setError("Failed to update user status");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle item approval/rejection
  const handleItemStatus = (itemId, status) => {
    try {
      // Update items in localStorage
      const allItems = JSON.parse(localStorage.getItem("items") || "[]");
      const updatedItems = allItems.map(item => 
        item.id === itemId ? { ...item, status } : item
      );

      localStorage.setItem("items", JSON.stringify(updatedItems));
      setItems(items.filter(item => item.id !== itemId));
      setSuccessMessage(`Item ${status} successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      setError("Failed to update item status");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle adding new security question
  const handleAddQuestion = (e) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      if (!newQuestion.trim()) {
        setError("Question text cannot be empty");
        return;
      }

      const newQuestionObj = {
        id: Date.now(),
        text: newQuestion,
        active: true,
        createdAt: new Date().toISOString()
      };

      const updatedQuestions = [...securityQuestions, newQuestionObj];
      localStorage.setItem("securityQuestions", JSON.stringify(updatedQuestions));
      setSecurityQuestions(updatedQuestions);
      setNewQuestion("");
      setShowModal(false);
      setSuccessMessage("Security question added successfully");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      setError("Failed to add security question");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle security question status toggle
  const handleQuestionStatus = (questionId) => {
    try {
      const updatedQuestions = securityQuestions.map(q => {
        if (q.id === questionId) {
          return { ...q, active: !q.active };
        }
        return q;
      });

      localStorage.setItem("securityQuestions", JSON.stringify(updatedQuestions));
      setSecurityQuestions(updatedQuestions);
      setSuccessMessage("Question status updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      setError("Failed to update question status");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle security question deletion
  const handleDeleteQuestion = (questionId) => {
    try {
      const updatedQuestions = securityQuestions.filter(q => q.id !== questionId);
      localStorage.setItem("securityQuestions", JSON.stringify(updatedQuestions));
      setSecurityQuestions(updatedQuestions);
      setSuccessMessage("Question deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      setError("Failed to delete question");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle adding security question to found item
  const handleAddItemSecurityQuestion = (item) => {
    setSelectedItem(item);
    setItemSecurityQuestions(item.securityQuestions || []);
    setCurrentQuestion({ question: '', answer: '' });
    setShowSecurityQuestionModal(true);
  };

  // Handle saving security question for item
  const handleSaveItemSecurityQuestion = () => {
    try {
      if (!currentQuestion.question.trim() || !currentQuestion.answer.trim()) {
        setError("Question and answer are required");
        return;
      }

      const allItems = JSON.parse(localStorage.getItem("items") || "[]");
      const updatedItems = allItems.map(item => {
        if (item.id === selectedItem.id) {
          const existingQuestions = item.securityQuestions || [];
          return {
            ...item,
            securityQuestions: [...existingQuestions, {
              id: Date.now(),
              question: currentQuestion.question,
              answer: currentQuestion.answer
            }],
            status: "approved"
          };
        }
        return item;
      });

      localStorage.setItem("items", JSON.stringify(updatedItems));
      setItems(items.filter(item => item.id !== selectedItem.id));
      
      // Reset the form
      setCurrentQuestion({ question: '', answer: '' });
      setSuccessMessage("Security question added successfully");
      
      // Don't close the modal to allow adding more questions
      if (window.confirm("Question added successfully. Do you want to add another question?")) {
        setCurrentQuestion({ question: '', answer: '' });
      } else {
        setShowSecurityQuestionModal(false);
      }

    } catch (err) {
      setError("Failed to add security question");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Add this new function to handle viewing existing questions
  const handleViewQuestions = (item) => {
    setSelectedItem(item);
    setItemSecurityQuestions(item.securityQuestions || []);
  };

  if (loading) return <div>Loading...</div>;

  const renderItemsTable = () => (
    <Table responsive>
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Category</th>
          <th>Type</th>
          <th>Reported By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.category}</td>
            <td>
              <Badge bg={item.type === "lost" ? "danger" : "success"}>
                {item.type}
              </Badge>
            </td>
            <td>{item.reportedBy}</td>
            <td>
              {item.type === "found" ? (
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="info"
                    onClick={() => handleAddItemSecurityQuestion(item)}
                  >
                    Add Questions
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleItemStatus(item.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleItemStatus(item.id, "rejected")}
                  >
                    Reject
                  </Button>
                  {item.securityQuestions?.length > 0 && (
                    <Badge bg="success" className="d-flex align-items-center">
                      {item.securityQuestions.length} questions
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleItemStatus(item.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleItemStatus(item.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}

      <Tab.Container defaultActiveKey="users">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="users">Users Management</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="items">
                  Items Approval{" "}
                  {items.length > 0 && (
                    <Badge bg="danger">{items.length}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="security">Security Questions</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="users">
                <Card>
                  <Card.Header>
                    <h4>Registered Users</h4>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                              <Badge bg={user.role === "admin" ? "danger" : "info"}>
                                {user.role}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={user.isActive ? "success" : "warning"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant={user.isActive ? "warning" : "success"}
                                className="me-2"
                                onClick={() => handleUserStatus(user.id)}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="items">
                <Card>
                  <Card.Header>
                    <h4>Pending Items</h4>
                  </Card.Header>
                  <Card.Body>
                    {items.length === 0 ? (
                      <Alert variant="info">No pending items to review</Alert>
                    ) : renderItemsTable()}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="security">
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4>Security Questions</h4>
                    <Button onClick={() => setShowModal(true)}>
                      Add New Question
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {securityQuestions.length === 0 ? (
                      <Alert variant="info">No security questions added yet</Alert>
                    ) : (
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {securityQuestions.map((question) => (
                            <tr key={question.id}>
                              <td>{question.text}</td>
                              <td>
                                <Badge bg={question.active ? "success" : "warning"}>
                                  {question.active ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  variant={question.active ? "warning" : "success"}
                                  className="me-2"
                                  onClick={() => handleQuestionStatus(question.id)}
                                >
                                  {question.active ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {/* Modal for adding new security question */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Security Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddQuestion}>
            <Form.Group>
              <Form.Label>Question</Form.Label>
              <Form.Control
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter security question"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddQuestion}>
            Add Question
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add new Modal for item security question */}
      <Modal show={showSecurityQuestionModal} onHide={() => setShowSecurityQuestionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Security Questions for Found Item</Modal.Title>
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
            
            {/* Show existing questions if any */}
            {selectedItem?.securityQuestions?.length > 0 && (
              <div className="mb-3">
                <h6>Existing Questions:</h6>
                {selectedItem.securityQuestions.map((q, index) => (
                  <div key={q.id} className="mb-2 p-2 border rounded">
                    <strong>Q{index + 1}:</strong> {q.question}
                  </div>
                ))}
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>New Security Question</Form.Label>
              <Form.Control
                type="text"
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  question: e.target.value
                })}
                placeholder="Enter security question for this item"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Answer</Form.Label>
              <Form.Control
                type="text"
                value={currentQuestion.answer}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  answer: e.target.value
                })}
                placeholder="Enter answer to the security question"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSecurityQuestionModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveItemSecurityQuestion}>
            Add Question
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
