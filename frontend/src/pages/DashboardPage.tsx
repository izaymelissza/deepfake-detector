import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        🎉 Dashboard
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        You are logged in!
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default DashboardPage;