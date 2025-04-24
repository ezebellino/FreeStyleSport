// src/components/Notifications.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, removeNotification } from '../features/notificationsSlice';
import { ListGroup, Button, Spinner, Alert } from 'react-bootstrap';

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, status, error } = useSelector(state => state.notifications);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchNotifications());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <Spinner animation="border" />;
  if (status === 'failed') return <Alert variant="danger">{error}</Alert>;

  return (
    <ListGroup>
      {notifications.map(n => (
        <ListGroup.Item key={n.id}>
          {n.message}
          <Button variant="link" onClick={() => dispatch(removeNotification(n.id))}>X</Button>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default Notifications;
