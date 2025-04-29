import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type Units = 'kg' | 'lb';

interface UnitsContextType {
  units: Units;
  setUnits: (units: Units) => void;
  loading: boolean;
}

const UnitsContext = createContext<UnitsContextType>({
  units: 'kg',
  setUnits: () => {},
  loading: true,
});

export const UnitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [units, setUnits] = useState<Units>('kg');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      try {
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        if (!user) {
          setUnits('kg');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('default_units')
          .eq('id', user.id)
          .single();
        if (error || !data) {
          setUnits('kg');
        } else {
          setUnits(data.default_units === 'lb' ? 'lb' : 'kg');
        }
      } catch (err) {
        setUnits('kg');
      }
      setLoading(false);
    };
    fetchUnits();
  }, []);

  return (
    <UnitsContext.Provider value={{ units, setUnits, loading }}>
      {children}
    </UnitsContext.Provider>
  );
};

export const useUnits = () => useContext(UnitsContext); 