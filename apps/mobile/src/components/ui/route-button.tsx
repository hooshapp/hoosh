import { Link, type Href } from 'expo-router';
import { ButtonSurface } from './button-surface';

export function RouteButton({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <ButtonSurface accessibilityRole="link" label={label} />
    </Link>
  );
}
