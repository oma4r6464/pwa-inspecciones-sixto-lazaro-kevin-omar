"use client";

import { useState, useEffect } from 'react';
import { LoadingState } from '@/components/loading-state';

// Datos sintéticos, no incluyen PII ni datos reales
const FAKE_INSPECTIONS = [
  { id: 1, title: 'Inspección de Seguridad 001', status: 'completada', date: '2023-10-01', inspector: 'Ana Torres' },
  { id: 2, title: 'Inspección de Higiene 002', status: 'pendiente', date: '2023-10-05', inspector: 'Luis Gomez' },
  { id: 3, title: 'Inspección Estructural 003', status: 'en progreso', date: '2023-10-10', inspector: 'Marta Diaz' },
  { id: 4, title: 'Inspección Eléctrica 004', status: 'completada', date: '2023-10-12', inspector: 'Carlos Ruiz' },
  { id: 5, title: 'Inspección de Maquinaria 005', status: 'pendiente', date: '2023-10-15', inspector: 'Elena Vega' },
];

export default function InspeccionesPage() {
  const [inspections, setInspections] = useState<typeof FAKE_INSPECTIONS>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInspections = async (simulateError = false) => {
    setLoading(true);
    setError(null);
    
    // Simular un retraso de red
    await new Promise(resolve => setTimeout(resolve, 800));

    if (simulateError) {
      setError('Error al cargar las inspecciones. Por favor, intente de nuevo.');
      setLoading(false);
      return;
    }

    setInspections(FAKE_INSPECTIONS);
    setLoading(false);
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const filteredInspections = inspections.filter((ins) => 
    ins.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ins.inspector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Listado de Inspecciones</h1>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <input 
          type="text" 
          placeholder="Buscar inspecciones..." 
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading || !!error}
          aria-label="Buscar inspecciones"
        />
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => fetchInspections(false)}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            disabled={loading}
          >
            Recargar
          </button>
          <button 
            onClick={() => fetchInspections(true)}
            className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
            disabled={loading}
          >
            Simular Error
          </button>
        </div>
      </div>

      {loading && (
        <div className="my-12">
          <LoadingState message="Cargando inspecciones..." />
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => fetchInspections(false)}
            className="mt-2 text-sm font-semibold underline hover:text-red-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          {filteredInspections.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInspections.map((ins) => (
                <li key={ins.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ins.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Inspector: {ins.inspector} | Fecha: {ins.date}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${ins.status === 'completada' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        ins.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                      {ins.status.charAt(0).toUpperCase() + ins.status.slice(1)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No se encontraron inspecciones que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
