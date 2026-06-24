import { useRef, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Boton, Campo, Input, Select, Badge } from '../components/ui';

const NOMBRE_ROL = { admin: 'Administrador', repartidor: 'Repartidor', tomador: 'Pedidos' };

export default function Usuarios() {
  // Formulario NO controlado: leemos los valores con useRef en el submit,
  // en lugar de guardar cada tecla en el estado (formulario controlado).
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const rolRef = useRef(null);

  const { datos: usuarios, cargando, error, recargar } = useFetch('/auth/usuarios');
  const [msg, setMsg] = useState('');

  const eliminarUsuario = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar al usuario "${nombre}"? Ya no podrá iniciar sesión.`)) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      setMsg(`Usuario "${nombre}" desactivado.`);
      recargar();
    } catch (err) { setMsg(err.response?.data?.error || 'No se pudo desactivar'); }
  };
  const [errForm, setErrForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const registrar = async (e) => {
    e.preventDefault();
    setMsg(''); setErrForm('');

    // Validaciones del formulario (no controlado) leyendo los refs
    const nombre = nombreRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const password = passwordRef.current.value;
    const rol = rolRef.current.value;

    if (!nombre || !email || !password) {
      setErrForm('Todos los campos son obligatorios');
      return;
    }
    if (password.length < 6) {
      setErrForm('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/auth/registrar', { nombre, email, password, rol });
      setMsg(`Usuario "${nombre}" registrado correctamente`);
      // Limpiamos el formulario manualmente (al ser no controlado)
      nombreRef.current.value = '';
      emailRef.current.value = '';
      passwordRef.current.value = '';
      rolRef.current.value = 'tomador';
      recargar();
    } catch (err) {
      setErrForm(err.response?.data?.error || 'No se pudo registrar el usuario');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-600 text-campo-dark">Usuarios del sistema</h1>
        <p className="text-sm text-carbon/55">Registra empleados y asígnales un rol.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alta (formulario NO controlado con useRef) */}
        <Tarjeta className="p-5 h-fit">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <UserPlus className="h-5 w-5" /> Nuevo usuario
          </h2>
          <form onSubmit={registrar} className="space-y-3">
            <Campo etiqueta="Nombre">
              <Input ref={nombreRef} type="text" placeholder="Ej. Pedro López" defaultValue="" />
            </Campo>
            <Campo etiqueta="Correo">
              <Input ref={emailRef} type="email" placeholder="correo@fruteria.com" defaultValue="" />
            </Campo>
            <Campo etiqueta="Contraseña">
              <Input ref={passwordRef} type="password" placeholder="Mínimo 6 caracteres" defaultValue="" />
            </Campo>
            <Campo etiqueta="Rol">
              <Select ref={rolRef} defaultValue="tomador">
                <option value="admin">Administrador</option>
                <option value="repartidor">Repartidor</option>
                <option value="tomador">Pedidos (tomador)</option>
              </Select>
            </Campo>
            {errForm && <p className="rounded-lg bg-tierra/10 px-3 py-2 text-sm text-tierra">{errForm}</p>}
            {msg && <p className="rounded-lg bg-campo/10 px-3 py-2 text-sm text-campo">{msg}</p>}
            <Boton tipo="submit" disabled={guardando}>{guardando ? 'Registrando...' : 'Registrar usuario'}</Boton>
          </form>
        </Tarjeta>

        {/* Lista */}
        <Tarjeta className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-600 text-campo-dark">Usuarios registrados</h2>
          {cargando ? <Cargando /> : error ? <ErrorEstado mensaje={error} onReintentar={recargar} />
            : !usuarios || usuarios.length === 0 ? <Vacio mensaje="Aún no hay usuarios." />
            : (
              <ul className="divide-y divide-campo/8">
                {usuarios.map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-carbon">{u.nombre}</p>
                      <p className="text-xs text-carbon/55">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={u.rol === 'admin' ? 'tierra' : 'campo'}>{NOMBRE_ROL[u.rol] || u.rol}</Badge>
                      <button
                        onClick={() => eliminarUsuario(u.id, u.nombre)}
                        className="text-carbon/30 hover:text-tierra transition" title="Desactivar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </Tarjeta>
      </div>
    </div>
  );
}
