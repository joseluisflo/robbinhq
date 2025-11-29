
import { cn } from '@/lib/utils';
import * as React from 'react';

interface LoIconProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'stroke' | 'filled' | 'duotone';
}

export function DashboardIcon({ variant = 'stroke', className, ...props }: LoIconProps) {
  if (variant === 'filled') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        className={cn(className)}
        {...props}
      >
        <path
          d="M12.75 6.75C12.75 9.23528 14.7647 11.25 17.25 11.25C19.7353 11.25 21.75 9.23528 21.75 6.75C21.75 4.26472 19.7353 2.25 17.25 2.25C14.7647 2.25 12.75 4.26472 12.75 6.75Z"
          fill="currentColor"
        ></path>
        <path
          d="M2.25 6.75C2.25 9.23528 4.26472 11.25 6.75 11.25C9.23528 11.25 11.25 9.23528 11.25 6.75C11.25 4.26472 9.23528 2.25 6.75 2.25C4.26472 2.25 2.25 4.26472 2.25 6.75Z"
          fill="currentColor"
        ></path>
        <path
          d="M12.75 17.25C12.75 19.7353 14.7647 21.75 17.25 21.75C19.7353 21.75 21.75 19.7353 21.75 17.25C21.75 14.7647 19.7353 12.75 17.25 12.75C14.7647 12.75 12.75 14.7647 12.75 17.25Z"
          fill="currentColor"
        ></path>
        <path
          d="M2.25 17.25C2.25 19.7353 4.26472 21.75 6.75 21.75C9.23528 21.75 11.25 19.7353 11.25 17.25C11.25 14.7647 9.23528 12.75 6.75 12.75C4.26472 12.75 2.25 14.7647 2.25 17.25Z"
          fill="currentColor"
        ></path>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      className={cn(className)}
      {...props}
    >
      <path
        d="M21 6.75C21 4.67893 19.3211 3 17.25 3C15.1789 3 13.5 4.67893 13.5 6.75C13.5 8.82107 15.1789 10.5 17.25 10.5C19.3211 10.5 21 8.82107 21 6.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      ></path>
      <path
        d="M10.5 6.75C10.5 4.67893 8.82107 3 6.75 3C4.67893 3 3 4.67893 3 6.75C3 8.82107 4.67893 10.5 6.75 10.5C8.82107 10.5 10.5 8.82107 10.5 6.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      ></path>
      <path
        d="M21 17.25C21 15.1789 19.3211 13.5 17.25 13.5C15.1789 13.5 13.5 15.1789 13.5 17.25C13.5 19.3211 15.1789 21 17.25 21C19.3211 21 21 19.3211 21 17.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      ></path>
      <path
        d="M10.5 17.25C10.5 15.1789 8.82107 13.5 6.75 13.5C4.67893 13.5 3 15.1789 3 17.25C3 19.3211 4.67893 21 6.75 21C8.82107 21 10.5 19.3211 10.5 17.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
}
