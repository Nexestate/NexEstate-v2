import { Link, type LinkProps } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPublishAdPath } from '../../lib/publishAd';

type PublishAdLinkProps = Omit<LinkProps, 'to'>;

export function PublishAdLink({ children, ...props }: PublishAdLinkProps) {
  const { user } = useAuth();
  return (
    <Link to={getPublishAdPath(user)} {...props}>
      {children}
    </Link>
  );
}
