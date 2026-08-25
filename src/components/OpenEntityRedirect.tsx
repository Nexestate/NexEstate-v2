import { Navigate, useParams } from 'react-router-dom';

/** Old `/broker/{entity}/{id}` links had no route and fell through to the marketing home. */
export function OpenEntityRedirect({ listPath }: { listPath: string }) {
  const { id } = useParams<{ id: string }>();
  const search = id ? `?open=${encodeURIComponent(id)}` : '';
  return <Navigate to={`${listPath}${search}`} replace />;
}
