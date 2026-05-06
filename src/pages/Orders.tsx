import { Link, Navigate } from 'react-router-dom';
import { User } from '../types';

export default function Orders({ user }: { user: User }) {
  // Redirect to dashboard where orders are managed for now
  return <Navigate to="/dashboard" />;
}
