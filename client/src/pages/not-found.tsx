import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Page not found</h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div>
          <Link href="/">
            <a className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Go back home
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}