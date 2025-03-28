import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, InputGroup } from 'react-bootstrap';
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
        // Get items from localStorage
        const storedItems = JSON.parse(localStorage.getItem('items') || '[]');
        
        // Filter for approved lost items only
        const lostItems = storedItems.filter(item => 
          item.type === 'lost' && 
          item.status === 'approved' &&
          (!user || item.reportedBy !== user.email) // Show all items if not logged in, otherwise exclude user's own items
        );
        
        console.log('Fetched lost items:', lostItems); // Debug log
        
        setItems(lostItems);
        setFilteredItems(lostItems);

        // Get security questions
        const storedQuestions = JSON.parse(localStorage.getItem('securityQuestions') || '[]');
        setSecurityQuestions(storedQuestions.filter(q => q.active));
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
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    console.log('Filtered items:', filtered); // Debug log
    setFilteredItems(filtered);
  }, [searchTerm, selectedCategory, items]);

  // Initialize claim process
  const handleInitiateClaim = (item) => {
    if (!user) {
      setError('Please log in to claim items');
      return;
    }
    setSelectedItem(item);
    setAnswers({});
    setError('');
    setShowClaimModal(true);
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
            <Col key={item.id} md={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{item.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {item.category}
                  </Card.Subtitle>
                  <Card.Text>
                    <strong>Location:</strong> {item.location}<br/>
                    <strong>Description:</strong> {item.description}<br/>
                    <strong>Date Lost:</strong> {new Date(item.createdAt).toLocaleDateString()}
                  </Card.Text>
                  {item.claimStatus === 'pending' ? (
                    <Badge bg="warning">Claim Pending</Badge>
                  ) : (
                    <Button 
                      variant="primary"
                      onClick={() => handleInitiateClaim(item)}
                    >
                      Claim This Item
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Add your claim modal here if needed */}
    </Container>
  );
};

export default DisplayLostItems;
