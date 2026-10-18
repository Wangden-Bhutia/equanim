import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export function NotFound() {
  return (
    <EmptyState level={1} title="Nothing here" action={<Link to="/" className="btn-primary">Back to Today</Link>}>
      This page does not exist. It may have been moved, or the link may be incomplete.
    </EmptyState>
  );
}
