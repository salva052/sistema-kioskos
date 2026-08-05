import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <div className="surcos flex min-h-screen flex-col items-center justify-center bg-crema text-center p-4">
      <img src="/logo.png" alt="Sistema Kiosko's" className="h-20 w-20 object-contain opacity-50" />
      <h1 className="mt-4 font-display text-5xl font-700 text-campo-dark">404</h1>
      <p className="mt-2 text-carbon/60">Esta página no existe.</p>
      <Link to="/" className="mt-6 rounded-lg bg-campo px-5 py-2.5 text-sm font-semibold text-white hover:bg-campo-dark">
        Volver al inicio
      </Link>
    </div>
  );
}
