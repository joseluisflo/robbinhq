import { cn } from '@/lib/utils';
import * as React from 'react';

interface LoIconProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'stroke' | 'filled';
}

export function UserGroupIcon({ variant = 'stroke', className, ...props }: LoIconProps) {
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
          d="M8.2499 10.5C8.2499 8.42893 9.92884 6.75 11.9999 6.75C14.071 6.75 15.7499 8.42893 15.7499 10.5C15.7499 12.0256 14.8388 13.3385 13.5311 13.9242C16.2049 14.5465 18.25 16.7615 18.25 19.499C18.25 19.9133 17.9142 20.249 17.5 20.249H6.5C6.08579 20.249 5.75 19.9133 5.75 19.499C5.75 16.7615 7.79507 14.5466 10.4688 13.9242C9.16099 13.3385 8.2499 12.0257 8.2499 10.5Z"
          fill="currentColor"
        ></path>
        <path
          d="M7.4999 3.74805C5.42884 3.74805 3.7499 5.42698 3.7499 7.49805C3.7499 9.02371 4.66099 10.3366 5.96877 10.9222C3.29507 11.5447 1.25 13.7596 1.25 16.4971C1.25 16.9113 1.58579 17.2471 2 17.2471H4.62528C5.17244 15.6666 6.27833 14.3603 7.67909 13.4807C7.09348 12.6342 6.7499 11.6067 6.7499 10.498C6.7499 8.0732 8.39385 6.03231 10.628 5.42911C9.95662 4.41605 8.80627 3.74805 7.4999 3.74805Z"
          fill="currentColor"
        ></path>
        <path
          d="M19.3747 17.2471C18.8276 15.6665 17.7216 14.3602 16.3208 13.4806C16.9064 12.6341 17.2499 11.6066 17.2499 10.498C17.2499 8.0732 15.606 6.03231 13.3718 5.42911C14.0432 4.41605 15.1936 3.74805 16.4999 3.74805C18.571 3.74805 20.2499 5.42698 20.2499 7.49805C20.2499 9.02368 19.3389 10.3365 18.0311 10.9222C20.7049 11.5446 22.75 13.7595 22.75 16.4971C22.75 16.9113 22.4142 17.2471 22 17.2471H19.3747Z"
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
        d="M15.5 11C15.5 9.067 13.933 7.5 12 7.5C10.067 7.5 8.5 9.067 8.5 11C8.5 12.933 10.067 14.5 12 14.5C13.933 14.5 15.5 12.933 15.5 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M15.4827 11.3499C15.8047 11.4475 16.1462 11.5 16.5 11.5C18.433 11.5 20 9.933 20 8C20 6.067 18.433 4.5 16.5 4.5C14.6851 4.5 13.1928 5.8814 13.0173 7.65013"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M10.9827 7.65013C10.8072 5.8814 9.31492 4.5 7.5 4.5C5.567 4.5 4 6.067 4 8C4 9.933 5.567 11.5 7.5 11.5C7.85381 11.5 8.19535 11.4475 8.51727 11.3499"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path d="M22 16.5C22 13.7386 19.5376 11.5 16.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
      <path
        d="M17.5 19.5C17.5 16.7386 15.0376 14.5 12 14.5C8.96243 14.5 6.5 16.7386 6.5 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path d="M7.5 11.5C4.46243 11.5 2 13.7386 2 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );
}
