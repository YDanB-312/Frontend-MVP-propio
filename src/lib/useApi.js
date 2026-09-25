// Hook de consulta a la API con estados de carga y error.
//
// Envuelve el patrón clásico de la actividad (useState + useEffect + fetch):
//   const { data, cargando, error, recargar } = useApi(() => apiFetch('/projects'))
// `deps` re-dispara la consulta cuando cambian (ids, filtros…). Mantén valores
// serializables (números, strings) para que el cambio se detecte bien.
import { useCallback, useEffect, useRef, useState } from "react";
import { invalidarCache } from "./api";

export function useApi(fn, deps = [], { inicial = null } = {}) {
  const [estado, setEstado] = useState({
    data: inicial,
    cargando: true,
    error: null,
  });

  // La función se lee siempre desde la ref: evita reconsultas por identidad.
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const claveDeps = JSON.stringify(deps);

  // Evita actualizar estado tras desmontar (p. ej. al navegar con una recarga
  // en vuelo).
  const montadoRef = useRef(true);
  useEffect(
    () => () => {
      montadoRef.current = false;
    },
    [],
  );

  useEffect(() => {
    let vivo = true;
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    Promise.resolve()
      .then(() => fnRef.current())
      .then((data) => {
        if (vivo) setEstado({ data, cargando: false, error: null });
      })
      .catch((error) => {
        if (vivo) setEstado((e) => ({ ...e, cargando: false, error }));
      });
    return () => {
      vivo = false;
    };
  }, [claveDeps]);

  // Recarga explícita: descarta la caché para traer datos frescos del servidor.
  const recargar = useCallback(async () => {
    invalidarCache();
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    try {
      const data = await fnRef.current();
      if (montadoRef.current) setEstado({ data, cargando: false, error: null });
    } catch (error) {
      if (montadoRef.current)
        setEstado((e) => ({ ...e, cargando: false, error }));
    }
  }, []);

  const setData = useCallback((data) => setEstado((e) => ({ ...e, data })), []);

  return {
    data: estado.data,
    cargando: estado.cargando,
    error: estado.error,
    recargar,
    setData,
  };
}
