import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Boton, Campo, Input } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  };

  const entrarComo = (correo, clave) => { setEmail(correo); setPassword(clave); };

  return (
    <div className="surcos flex min-h-screen items-center justify-center bg-crema p-4">
      <div className="w-full max-w-sm fade-in">
        {/* Marca */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-campo-dark p-2.5">
            <img src="/logo.png" alt="Sistema Kiosko's" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-display text-3xl font-600 text-campo-dark">Sistema Kiosko's</h1>
          <p className="mt-1 text-sm text-carbon/60">El sistema operativo de tu distribuidora</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl bg-hueso p-6 shadow-tarjeta border border-campo/5 space-y-4">
          <Campo etiqueta="Correo">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@fruteria.com"
              required
            />
          </Campo>
          <Campo etiqueta="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Campo>

          {error && (
            <p className="rounded-lg bg-tierra/10 px-3 py-2 text-sm text-tierra">{error}</p>
          )}

          <Boton tipo="submit" disabled={enviando} variante="primario">
            <LogIn className="h-4 w-4" />
            {enviando ? 'Entrando...' : 'Entrar'}
          </Boton>
        </form>

        {/* Accesos de demostracion */}
        <div className="mt-5 rounded-xl bg-campo/5 p-4">
          <p className="mb-2 text-center text-xs font-medium text-carbon/50">Cuentas de demostración</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button onClick={() => entrarComo('christian@fruteria.com', 'admin123')} className="rounded-lg bg-hueso px-2 py-1.5 font-medium text-campo-dark hover:bg-white">Admin</button>
            <button onClick={() => entrarComo('chuy@fruteria.com', 'chuy123')} className="rounded-lg bg-hueso px-2 py-1.5 font-medium text-campo-dark hover:bg-white">Repartidor</button>
            <button onClick={() => entrarComo('alexa@fruteria.com', 'alexa123')} className="rounded-lg bg-hueso px-2 py-1.5 font-medium text-campo-dark hover:bg-white">Pedidos</button>
          </div>
        </div>
      </div>
    </div>
  );
}
