import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

import { API_BASE_URL } from "../../config/config";

const DisplayLostItemsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [error, setError] = useState('');

  // Fetch lost items
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/user/lost-items`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        console.log("Fetched data:", data); // Debug log
        
        // Filter lost items that aren't from the current user
        const lostItems = data.filter(item => 
          item.reportType?.toLowerCase() === 'lost' && 
          (!user || item.userId !== user.id)
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

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/user/delete-item/${itemId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete item");
        }

        // Update the local state to remove the deleted item
        setItems(items.filter(item => item.itemId !== itemId));
        setFilteredItems(filteredItems.filter(item => item.itemId !== itemId));
        alert("Item deleted successfully");
      } catch (error) {
        console.error("Error deleting item:", error);
        setError("Failed to delete item");
      }
    }
  };

  const handleInitiateClaim = (item) => {
    console.log("Claiming item:", item);
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Lost Items</h2>

      {error && <Alert variant="danger">{error}</Alert>}

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
                  <Card.Title className="d-flex justify-content-between align-items-start">
                    {item.itemName}
                    <Badge bg={item.status === 'claimed' ? 'secondary' : 'primary'}>
                      {item.status || 'pending'}
                    </Badge>
                  </Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {item.category}
                  </Card.Subtitle>
                  <Card.Text>
                    <strong>Location:</strong> {item.location}<br/>
                    <strong>Description:</strong> {item.itemDescription}<br/>
                    <strong>Date:</strong> {new Date(item.date).toLocaleDateString()}
                  </Card.Text>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary"
                      onClick={() => handleInitiateClaim(item)}
                      disabled={item.status === 'claimed'}
                    >
                      {item.status === 'claimed' ? 'Already Claimed' : 'Claim This Item'}
                    </Button>
                    {/* Add Security Questions button */}
                    {item.reportType?.toLowerCase() === "found" && (
                      <Button 
                        variant="info" 
                        size="md"
                      >
                        <i className="bi bi-shield-lock me-1"></i>
                        Add Questions
                      </Button>
                    )}
                    {/* Delete button */}
                    <Button 
                      variant="outline-danger"
                      onClick={() => handleDelete(item.itemId)}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default DisplayLostItemsPage;
