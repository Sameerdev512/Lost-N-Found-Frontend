import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, InputGroup, Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const DisplayLostItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Categories for filter dropdown
  const categories = ['Electronics', 'Documents', 'Accessories', 'Others'];

  // Fetch lost items and security questions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch('http://localhost:8080/api/user/lost-items', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        const lostItems = data.filter(item => 
          item.reportType === 'lost' && 
          (!user || item.reportedBy !== user.email)
        );
        
        setItems(lostItems);
        setFilteredItems(lostItems);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to fetch items');
      }
    };

    fetchData();
  }, [user]);

  // Handle search and filter
  useEffect(() => {
    const filtered = items.filter(item => {
      const matchesSearch = 
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    setFilteredItems(filtered);
  }, [searchTerm, selectedCategory, items]);

  // Initialize claim process
  const handleInitiateClaim = async (item) => {
    if (!user) {
      setError('Please log in to claim items');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/user/security-questions/${item.itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security questions');
      }

      const questions = await response.json();
      setSecurityQuestions(questions);
      setSelectedItem(item);
      setAnswers({});
      setError('');
      setShowClaimModal(true);
    } catch (error) {
      console.error('Error fetching security questions:', error);
      setError('Failed to fetch security questions');
    }
  };

  // Handle claim submission
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/user/security-questions/validate/${selectedItem.itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(Object.values(answers).map(answer => ({
          ...answer,
          itemId: selectedItem.itemId
        })))
      });

      const result = await response.json();

      if (result.message === "All answers are correct") {
        setSuccess('Claim submitted successfully!');
        setShowClaimModal(false);
      } else {
        setError('One or more answers are incorrect');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setError('Failed to submit claim');
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Lost Items</h2>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Search and Filter Section */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <InputGroup>
                <Form.Control
                  placeholder="Search by name, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Items Display */}
      <Row>
        {filteredItems.length === 0 ? (
          <Col>
            <Alert variant="info">No lost items found</Alert>
          </Col>
        ) : (
          filteredItems.map(item => (
            <Col key={item.itemId} md={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{item.itemName}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {item.category}
                  </Card.Subtitle>
                  <Card.Text>
                    <strong>Location:</strong> {item.location}<br/>
                    <strong>Description:</strong> {item.itemDescription}<br/>
                    <strong>Date Lost:</strong> {new Date(item.date).toLocaleDateString()}
                  </Card.Text>
                  <Button 
                    variant="primary"
                    onClick={() => handleInitiateClaim(item)}
                    disabled={item.status === 'claimed'}
                  >
                    {item.status === 'claimed' ? 'Already Claimed' : 'Claim This Item'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Claim Modal */}
      <Modal show={showClaimModal} onHide={() => setShowClaimModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Claim Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleClaimSubmit}>
            {securityQuestions.map((question, index) => (
              <Form.Group key={question.id} className="mb-3">
                <Form.Label>Question {index + 1}: {question.question}</Form.Label>
                <Form.Control
                  type="text"
                  required
                  onChange={(e) => setAnswers({
                    ...answers,
                    [question.id]: {
                      id: question.id,
                      question: question.question,
                      answer: e.target.value
                    }
                  })}
                />
              </Form.Group>
            ))}
            <Button type="submit" variant="primary">
              Submit Claim
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DisplayLostItems;
