/**
 * useInactivityTimer.js
 * 
 * Custom Hook: Detecta inactividad del usuario y ejecuta un callback de logout.
 * 
 * - Tiempo de expiración: 10 minutos (600 000 ms)
 * - Eventos escuchados: mousemove, mousedown, keydown, touchstart, scroll, click
 * - Al expirar: llama a onExpire() → el componente padre maneja el logout y la alerta.
 * 
 * Uso:
 *   useInactivityTimer({ onExpire: handleInactivityLogout, isActive: !!currentUser });
 */

import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

/**
 * @param {Object}   options
 * @param {Function} options.onExpire   - Callback que se ejecuta al expirar la sesión.
 * @param {boolean}  options.isActive   - Solo activa el timer cuando el usuario está autenticado.
 */
export default function useInactivityTimer({ onExpire, isActive }) {
  const timerRef = useRef(null);
  // Usamos una ref para onExpire para evitar re-registrar listeners en cada render
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onExpireRef.current?.();
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    // Solo activar cuando el usuario está autenticado
    if (!isActive) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Iniciar timer al montar / activar
    resetTimer();

    // Registrar todos los eventos de actividad
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Cleanup al desmontar o cuando isActive cambia a false
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isActive, resetTimer]);
}
