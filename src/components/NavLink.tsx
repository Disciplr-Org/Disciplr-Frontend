import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  ariaLabel?: string;
}

export default function NavLink({ to, className = '', children, ariaLabel, ...props }: NavLinkProps) {
  const location = useLocation();
  const toStr = typeof to === 'string' ? to : (to as any)?.pathname || '';
  const isActive = toStr === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(toStr);
  const combinedClass = `${className} ${isActive ? 'active' : ''}`.trim();
  return (
    <Link
      to={to}
      className={combinedClass}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}
