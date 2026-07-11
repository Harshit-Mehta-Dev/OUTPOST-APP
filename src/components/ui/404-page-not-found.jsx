import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./button";

export function NotFoundPage() {
  const navigate = useNavigate();

  // SECURE LOOPHOLE FIX: 
  // Instantly log them out the moment the 404 page loads.
  // This prevents them from using the browser's "Back" button to return to the dashboard.
  useEffect(() => {
    localStorage.removeItem('outpost_user');
    localStorage.removeItem('outpost_token');
  }, []);

  return (
    <section className="bg-white font-serif min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fff', width: '100vw' }}>
      <div className="container mx-auto">
        <div className="flex justify-center" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="w-full sm:w-10/12 md:w-8/12 text-center" style={{ textAlign: 'center' }}>
            <div
              className="bg-center bg-no-repeat bg-contain"
              style={{
                backgroundImage: 'url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)',
                height: '400px',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center'
              }}
              aria-hidden="true"
            >
              <h1 className="text-center text-black text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8" style={{ color: 'black', fontSize: '5rem', margin: 0, paddingTop: '30px', fontWeight: 'bold' }}>
                404
              </h1>
            </div>

            <div className="mt-[-50px]" style={{ marginTop: '-50px' }}>
              <h3 className="text-2xl text-black sm:text-3xl font-bold mb-4" style={{ color: 'black', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Look like you're lost
              </h3>
              <p className="mb-6 text-black sm:mb-5" style={{ color: 'black', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                The page you are looking for is not available!
              </p>

              <Button
                variant="default"
                onClick={() => {
                  // For security, if they get lost, log them out and force re-authentication
                  localStorage.removeItem('outpost_user');
                  localStorage.removeItem('outpost_token');
                  navigate("/auth");
                }}
                className="my-5 bg-green-600 hover:bg-green-700"
                style={{ backgroundColor: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '1rem' }}
              >
                Return to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
