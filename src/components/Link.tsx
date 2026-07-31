import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { navigate } from '@/lib/navigation';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, onClick, target, ...props }, ref) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target === '_blank') return;
    event.preventDefault();
    navigate(to);
  };

  return <a {...props} ref={ref} href={to} target={target} onClick={handleClick} />;
});

Link.displayName = 'Link';
