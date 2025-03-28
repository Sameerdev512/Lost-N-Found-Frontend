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
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch both user's items and lost items
  useEffect(() => {
    try {
      const allItems = JSON.parse(localStorage.getItem('items') || '[]');
      
      // Set user's reported items
      const userItems = allItems.filter(item => 
        item.reportedBy === user.email && 
        item.status !== 'rejected'
      );
      setItems(userItems);

      // Set lost items (excluding user's own)
      const lostItemsList = allItems.filter(item => 
        item.type === 'lost' && 
        item.status === 'approved' &&
        item.reportedBy !== user.email
      );
      setLostItems(lostItemsList);
    } catch (error) {
      showMessage('danger', 'Failed to fetch items');
    }
  }, [user.email]);

  const handleShowModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      Object.keys(item).forEach(key => setValue(key, item[key]));
    } else {
      reset();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    reset();
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const onSubmit = (data) => {
    try {
      const allItems = JSON.parse(localStorage.getItem('items') || '[]');
      
      if (editingItem) {
        // Update existing item
        const updatedItems = allItems.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                ...data,
                updatedAt: new Date().toISOString(),
                status: 'pending' // Reset status to pending after update
              }
            : item
        );
        localStorage.setItem('items', JSON.stringify(updatedItems));
        setItems(updatedItems.filter(item => 
          item.reportedBy === user.email && item.status !== 'rejected'
        ));
        showMessage('success', 'Item updated successfully');
      } else {
        // Add new item
        const newItem = {
          id: Date.now(),
          ...data,
          reportedBy: user.email,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
        setItems(prev => prev.filter(item => 
          item.id !== itemId && item.status !== 'rejected'
        ));
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
      resolved: 'info'
    };
    return variants[status] || 'secondary';
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
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>
                            <Badge bg={item.type === 'lost' ? 'danger' : 'success'}>
                              {item.type}
                            </Badge>
                          </td>
                          <td>{item.category}</td>
                          <td>{item.location}</td>
                          <td>
                            {item.description.length > 50 
                              ? `${item.description.substring(0, 50)}...` 
                              : item.description}
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(item.status)}>
                              {item.status}
                            </Badge>
                          </td>
                          <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="me-2"
                              onClick={() => handleShowModal(item)}
                              disabled={item.status !== 'pending'}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(item.id)}
                              disabled={item.status !== 'pending'}
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

          <Tab.Pane eventKey="lostItems">
            <Card>
              <Card.Header>
                <h4>Lost Items</h4>
              </Card.Header>
              <Card.Body>
                {lostItems.length === 0 ? (
                  <Alert variant="info">No lost items found.</Alert>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Description</th>
                        <th>Date Reported</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lostItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.category}</td>
                          <td>{item.location}</td>
                          <td>
                            {item.description.length > 50 
                              ? `${item.description.substring(0, 50)}...` 
                              : item.description}
                          </td>
                          <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleInitiateClaim(item)}
                            >
                              Claim Item
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
    </Container>
  );
};

export default UserDashboard;
